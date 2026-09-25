// Copiloto Operacional (ADR-015): parser, domínio, workflow de campanha, ledger (D1 simulado em
// SQLite), executor de comandos com GitHub em memória, relatório (paridade com a skill) e webhooks.
// Nada sai da máquina.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { ErroComando, extrairComando, parseComando, tipoDoComando } from '../../apps/copiloto/worker/comandos.ts';
import { blocoTaskSpec, completude, comTaskSpec, dataLocal, decidirFeito, lerTaskSpec, promoviveis } from '../../apps/copiloto/worker/dominio.ts';
import { Ledger } from '../../apps/copiloto/worker/ledger.ts';
import { estadoDaCampanha, lerWorkflow, mermaidGantt, planejarInstancia } from '../../apps/copiloto/worker/workflow.ts';
import { executar, papelDe } from '../../apps/copiloto/worker/servico.ts';
import { htmlEmail, htmlImpressao, montarRelatorio, textoPlano } from '../../apps/copiloto/worker/relatorio.ts';
import { dmarcDe, enviarEmail } from '../../apps/copiloto/worker/adaptadores.ts';
import { Tarefas } from '../../apps/copiloto/worker/tarefas.ts';
import { abasEspelho, tratar, validarLabelUi, verificarLink } from '../../apps/copiloto/worker/index.ts';
import { validarOps } from '../../scripts/validate-ops.mjs';

const raiz = path.resolve(import.meta.dirname, '../..');
const WF = fs.readFileSync(path.join(raiz, 'ops/workflows/WF-CAMP-001.yaml'), 'utf8');
const AREAS = fs.readFileSync(path.join(raiz, 'ops/areas.yaml'), 'utf8');

/** D1 simulado sobre node:sqlite com a migration real. */
function d1() {
	const db = new DatabaseSync(':memory:');
	db.exec(fs.readFileSync(path.join(raiz, 'apps/copiloto/migrations/0001_ledger.sql'), 'utf8'));
	return {
		db,
		prepare(sql) {
			const st = db.prepare(sql);
			return {
				bind: (...v) => ({
					run: async () => ({ meta: { changes: st.run(...v).changes } }),
					first: async () => st.get(...v) ?? null,
					all: async () => ({ results: st.all(...v) }),
				}),
			};
		},
	};
}

/** Porta de tarefas em memória com a mesma semântica do adapter do GitHub. */
function tarefasFalsas() {
	const issues = [];
	let n = 0;
	const porta = {
		issues,
		async listar() {
			return issues.map((i) => ({ ...i, labels: [...i.labels] }));
		},
		async criar(p, existentes) {
			const ja = (existentes ?? issues).find((t) => t.spec?.task_key === p.spec.task_key) ?? issues.find((t) => t.spec?.task_key === p.spec.task_key);
			if (ja) return { numero: ja.numero, url: `u/${ja.numero}`, criada: false };
			const numero = ++n;
			issues.push({ numero, titulo: p.titulo, estado: p.estado, spec: structuredClone(p.spec), labels: [...p.labels, `state/${p.estado.toLowerCase()}`], url: `u/${numero}`, tipo: p.labels.includes('type/ideia') ? 'ideia' : 'tarefa', epic: p.epic });
			return { numero, url: `u/${numero}`, criada: true };
		},
		async transicionar(numero, de, para) {
			const i = issues.find((x) => x.numero === numero);
			if (i.estado === para) return 'sem-efeito';
			assert.equal(i.estado, de, `CAS: #${numero} está em ${i.estado}, esperado ${de}`);
			i.estado = para;
			i.labels = [...i.labels.filter((l) => !l.startsWith('state/')), `state/${para.toLowerCase()}`];
			return 'aplicada';
		},
		async comentar() {},
		async atualizarSpec(numero, spec) {
			issues.find((x) => x.numero === numero).spec = structuredClone(spec);
		},
		async adicionarLabel(numero, label) {
			issues.find((x) => x.numero === numero).labels.push(label);
		},
	};
	return porta;
}

function contexto(extra = {}) {
	const prs = [];
	return {
		prs,
		ctx: {
			commandId: `CMD${Math.random().toString(36).slice(2, 8)}`,
			ator: { email: 'op@x.com', papel: 'OPERADOR' },
			tarefas: tarefasFalsas(),
			defs: {
				lerOps: async (c) => (c === 'ops/areas.yaml' ? AREAS : c === 'ops/workflows/WF-CAMP-001.yaml' ? WF : null),
				abrirPR: async (caminho, conteudo) => {
					prs.push({ caminho, conteudo });
					return `https://github.com/o/r/pull/${prs.length}`;
				},
			},
			ledger: new Ledger(d1()),
			fonte: 'Sas-Executar/Copiloto',
			agora: new Date('2026-10-05T15:00:00Z'),
			...extra,
		},
	};
}

const cmd = (texto) => {
	const e = extrairComando('', texto);
	return parseComando(e.linha, e.payload);
};

// ------------------------------------------------------------------ parser
test('parser: comando na primeira linha, citação removida, aliases e acentos', () => {
	const e = extrairComando('Re: algo', '/done #12 https://blog.x/a\n\n> /fila antigo\nEm seg, 1 de set, Fulano escreveu:\n/hoje');
	assert.equal(e.linha, '/done #12 https://blog.x/a');
	const c = parseComando(e.linha, e.payload);
	assert.equal(c.verbo, 'feito');
	assert.deepEqual(c.args.ref, { tipo: 'issue', numero: 12 });
	assert.equal(c.args.evidencia, 'https://blog.x/a');
	assert.equal(parseComando('/amanhã').verbo, 'amanha');
	assert.equal(extrairComando('/hoje', 'oi').linha, '/hoje');
	assert.equal(extrairComando('sem comando', 'texto livre'), null);
});

test('parser: payload chave: valor, status-report com formato e erros com código', () => {
	const c = cmd('/fila editorial "Revisar headline"\ndod: headline aprovada\ndata: 2026-10-06\npeso: 3\nnotas livres');
	assert.equal(c.args.area, 'editorial');
	assert.equal(c.args.texto, 'Revisar headline');
	assert.deepEqual([c.payload.dod, c.payload.data, c.payload.peso, c.payload.descricao], ['headline aprovada', '2026-10-06', '3', 'notas livres']);
	const r = parseComando('/status-report campanha WF-CAMP-001 RC-C01 pdf');
	assert.deepEqual([r.args.tipo, r.args.alvo, r.args.formato], ['campanha', 'WF-CAMP-001 RC-C01', 'pdf']);
	assert.equal(parseComando('/status-report 72h').args.formato, 'html');
	assert.throws(() => parseComando('/deploy tudo'), (e) => e instanceof ErroComando && e.codigo === 'E-101');
	assert.throws(() => parseComando('/fila so-area'), (e) => e.codigo === 'E-100');
	assert.equal(tipoDoComando(parseComando('/urgente')), 'leitura');
	assert.equal(tipoDoComando(parseComando('/urgente #1')), 'escrita');
	assert.deepEqual(parseComando('/feito RC-C01-E1-01').args.ref, { tipo: 'chave', chave: 'RC-C01-E1-01' });
});

// ------------------------------------------------------------------ domínio
test('domínio: task-spec ida e volta preserva descrição', () => {
	const spec = { task_key: 'EXE-0001', area: 'editorial', dod: 'Publicado', data: '2026-10-06', peso: 2, depende: ['EXE-0000'], verificacao: 'link_valido', evidencia: [] };
	const corpo = comTaskSpec('Descrição livre.', spec);
	assert.deepEqual(lerTaskSpec(corpo), { ...spec, program: undefined, workflow: undefined, etapa: undefined, origem: undefined });
	assert.match(comTaskSpec(corpo, { ...spec, peso: 5 }), /peso: 5[\s\S]*Descrição livre\./);
	assert.match(blocoTaskSpec(spec), /^<!-- task-spec:v1 -->/);
});

test('domínio: /feito só chega a DONE com DoD + evidência + verificação (AC-04)', () => {
	const s = (v, dod = 'ok') => ({ task_key: 'K-01', area: 'a', dod, peso: 1, depende: [], verificacao: v, evidencia: [] });
	assert.equal(decidirFeito('DOING', s('link_valido'), []).acao, 'VERIFY');
	assert.equal(decidirFeito('DOING', s('link_valido'), ['https://blog/x']).acao, 'DONE');
	assert.equal(decidirFeito('DOING', s('link_valido'), ['http://inseguro']).acao, 'VERIFY');
	assert.equal(decidirFeito('DOING', s('manual'), ['https://x']).acao, 'VERIFY');
	assert.equal(decidirFeito('DOING', s('pr_mergeado'), ['https://github.com/o/r/pull/3']).acao, 'DONE');
	assert.equal(decidirFeito('DOING', s('link_valido', ''), ['https://x']).acao, 'VERIFY');
	assert.equal(decidirFeito('READY', s('manual'), ['https://x']).codigo, 'E-301');
	assert.equal(decidirFeito('BLOCKED', s('manual'), []).codigo, 'E-302');
	assert.equal(decidirFeito('DONE', s('manual'), []).acao, 'IDEMPOTENTE');
});

test('domínio: completude por peso, VERIFY não conta, ideias e canceladas fora, vazio = null (AC-05)', () => {
	const t = (estado, peso = 1, tipo = 'tarefa') => ({ numero: 0, titulo: '', estado, spec: { peso }, labels: [], tipo });
	const c = completude([t('DONE', 3), t('VERIFY', 1), t('DOING', 1), t('CANCELADO', 5), t('DONE', 9, 'ideia')]);
	assert.equal(c.percentual, 60);
	assert.equal(completude([]).percentual, null);
});

test('domínio: hoje/amanhã em America/Sao_Paulo perto da meia-noite (AC-11)', () => {
	assert.equal(dataLocal(new Date('2026-10-06T02:30:00Z')), '2026-10-05'); // 23:30 em SP
	assert.equal(dataLocal(new Date('2026-10-06T03:30:00Z')), '2026-10-06'); // 00:30 em SP
	assert.equal(dataLocal(new Date('2026-12-31T20:00:00Z'), 1), '2027-01-01');
});

// ------------------------------------------------------------------ workflow de campanha
test('workflow: WF-CAMP-001 vira 34 tarefas encadeadas, só a primeira nasce pronta', () => {
	const w = lerWorkflow(WF);
	const p = planejarInstancia(w, { instancia: 'RC-C01', lancamento: '2026-10-09', programa: 'risco-cognitivo' });
	assert.equal(w.entrypoints.length, 6);
	assert.equal(p.length, 34);
	assert.deepEqual(p.filter((x) => x.estadoInicial === 'READY').map((x) => x.spec.task_key), ['RC-C01-E1-01']);
	const gate1 = p.find((x) => x.spec.task_key === 'RC-C01-E1-99');
	assert.equal(gate1.spec.depende.length, 7);
	assert.deepEqual(p.find((x) => x.spec.task_key === 'RC-C01-E2-01').spec.depende, ['RC-C01-E1-99']);
	assert.equal(p[0].spec.data, '2026-10-05'); // D−4
	assert.ok(p.every((x) => x.spec.dod.length > 5));
	assert.throws(() => lerWorkflow(WF.replace('id: E2', 'id: E9')), /fora de ordem/);
});

test('workflow: estado da campanha e vistas derivados das tarefas reais', () => {
	const w = lerWorkflow(WF);
	const ts = planejarInstancia(w, { instancia: 'RC-C01', lancamento: '2026-10-09', programa: 'rc' }).map((x, i) => ({ numero: i + 1, titulo: x.titulo, estado: x.spec.etapa === 'E1' ? 'DONE' : x.estadoInicial, spec: x.spec, labels: x.labels, tipo: 'tarefa' }));
	ts.find((t) => t.spec.task_key === 'RC-C01-E2-01').estado = 'DOING';
	const ec = estadoDaCampanha(w, 'RC-C01', ts, new Date('2026-10-08T15:00:00Z'));
	assert.deepEqual(ec.atual, { id: 'E2', nome: w.entrypoints[1].nome });
	assert.equal(ec.entrypoints[0].estado, 'FECHADO');
	assert.equal(ec.agora.spec.task_key, 'RC-C01-E2-01');
	assert.match(mermaidGantt(ec), /done, 2026-10-05/);
	assert.deepEqual(promoviveis(ts).map((t) => t.spec.task_key), []);
});

test('ops/: definições versionadas passam no validador do CI', () => {
	assert.deepEqual(validarOps(), []);
});

// ------------------------------------------------------------------ ledger
test('ledger: dedupe na borda e no comando, operação idempotente, auditoria append-only', async () => {
	const banco = d1();
	const l = new Ledger(banco);
	assert.equal(await l.registrarEvento('outlook', 'm1'), true);
	assert.equal(await l.registrarEvento('outlook', 'm1'), false); // AC-03
	const a = await l.abrirComando({ command_id: 'C1', dedupe_key: 'k', source: 'outlook', actor: 'x', envelope: {} });
	const b = await l.abrirComando({ command_id: 'C2', dedupe_key: 'k', source: 'outlook', actor: 'x', envelope: {} });
	assert.deepEqual([a.novo, b.novo, b.command_id], [true, false, 'C1']);
	let chamadas = 0;
	const f = async () => ({ n: ++chamadas });
	assert.deepEqual(await l.operacao('op1', 'C1', 't', f), { n: 1 });
	assert.deepEqual(await l.operacao('op1', 'C1', 't', f), { n: 1 });
	assert.equal(chamadas, 1);
	await l.auditar('x', 'feito', '#1', 'C1');
	assert.throws(() => banco.db.exec('DELETE FROM audit_log'), /append-only/);
});

test('ledger: token de confirmação é de uso único; outbox vai para a DLQ e volta por replay', async () => {
	const l = new Ledger(d1());
	const token = await l.guardarPlano('C1', { verbo: 'urgente' });
	assert.match(token, /^[A-Z2-9]{6}$/);
	assert.deepEqual((await l.consumirPlano(token.toLowerCase())).plano, { verbo: 'urgente' });
	assert.equal(await l.consumirPlano(token), null); // E-401
	const id = await l.enfileirar('email', { a: 1 });
	for (let i = 0; i < 4; i++) assert.equal(await l.outboxResultado(id, false, 'x'), 'PENDENTE');
	assert.equal(await l.outboxResultado(id, false, 'x'), 'DLQ');
	assert.equal(await l.profundidadeDlq(), 1);
	assert.equal(await l.replay(id), true);
	assert.equal(await l.profundidadeDlq(), 0);
	assert.equal((await l.outboxPendente()).length, 1);
});

// ------------------------------------------------------------------ executor de comandos
test('comandos: /fila exige DoD e área registrada; cria na fila com chave sequencial', async () => {
	const { ctx } = contexto();
	await assert.rejects(executar(cmd('/fila editorial Revisar'), ctx), (e) => e.codigo === 'E-100');
	await assert.rejects(executar(cmd('/fila editorail Revisar\ndod: x'), ctx), (e) => e.codigo === 'E-104' && /editorial/.test(e.message));
	const r = await executar(cmd('/fila blog "Revisar headline"\ndod: headline aprovada\ndata: 2026-10-05'), ctx);
	assert.match(r.assunto, /EXE-0001/);
	const [t] = ctx.tarefas.issues;
	assert.deepEqual([t.estado, t.spec.area, t.labels.includes('area/editorial')], ['BACKLOG_VALIDATED', 'editorial', true]);
	await executar(cmd('/fila editorial Outra\ndod: y'), { ...ctx, commandId: 'C2' });
	assert.equal(ctx.tarefas.issues[1].spec.task_key, 'EXE-0002');
});

test('comandos: RBAC — leitor não escreve, remetente sem papel não existe', async () => {
	const { ctx } = contexto();
	await assert.rejects(executar(cmd('/fila editorial X\ndod: y'), { ...ctx, ator: { email: 'l@x', papel: 'LEITOR' } }), (e) => e.codigo === 'E-110');
	assert.equal((await executar(cmd('/hoje'), { ...ctx, ator: { email: 'l@x', papel: 'LEITOR' } })).assunto.startsWith('Hoje'), true);
	assert.equal(papelDe('OP@X.com', '{"op@x.com":"OPERADOR"}'), 'OPERADOR');
	assert.equal(papelDe('z@x.com', '{"op@x.com":"OPERADOR"}'), null);
	assert.equal(papelDe('op@x.com', 'json quebrado'), null);
});

test('campanha: iniciar é idempotente; /feito sem evidência vai para VERIFY; com evidência fecha e promove a próxima', async () => {
	const { ctx } = contexto();
	const iniciar = cmd('/campanha WF-CAMP-001 iniciar\ninstancia: RC-C01\ndata: 2026-10-09\nprograma: risco-cognitivo\nepic: #284');
	const r1 = await executar(iniciar, ctx);
	assert.match(r1.texto, /34 criadas/);
	const r2 = await executar(iniciar, { ...ctx, commandId: 'OUTRO' });
	assert.match(r2.texto, /0 criadas, 34 já existiam/);
	assert.equal(ctx.tarefas.issues.length, 34);
	assert.equal(ctx.tarefas.issues[0].epic, 284);

	// Primeira tarefa: Pronta → Fazendo (pela UI), depois /feito.
	const t1 = ctx.tarefas.issues[0];
	t1.estado = 'DOING';
	const semEv = await executar(cmd('/feito RC-C01-E1-01'), ctx);
	assert.match(semEv.assunto, /Verificando/);
	assert.equal(t1.estado, 'VERIFY');
	t1.spec.verificacao = 'link_valido';
	const comEv = await executar(cmd('/feito RC-C01-E1-01 https://docs.x/tema'), { ...ctx, commandId: 'C3' });
	assert.match(comEv.assunto, /Concluída/);
	assert.equal(t1.estado, 'DONE');
	assert.equal(ctx.tarefas.issues[1].estado, 'READY'); // dependência fechou → promovida
	assert.deepEqual(t1.spec.evidencia, ['https://docs.x/tema']);

	const estado = await executar(cmd('/campanha WF-CAMP-001 estado\ninstancia: RC-C01'), ctx);
	assert.match(estado.texto, /E1 Texto .*: aberto/);
	assert.match(estado.texto, /stateDiagram-v2/);
	assert.match(estado.texto, /AGORA: #2/);
});

test('/feito com link_valido: link que não responde mantém em VERIFY (publicado exige URL verificada)', async () => {
	const { ctx } = contexto();
	await executar(cmd('/fila editorial Publicar\ndod: artigo no ar'), ctx);
	const t = ctx.tarefas.issues[0];
	Object.assign(t, { estado: 'DOING' });
	t.spec.verificacao = 'link_valido';
	const r = await executar(cmd('/feito #1 https://blog.x/fora-do-ar'), { ...ctx, commandId: 'L1', verificarLink: async () => false });
	assert.match(r.texto, /não respondeu/);
	assert.equal(t.estado, 'VERIFY');
	await executar(cmd('/feito #1'), { ...ctx, commandId: 'L2', verificarLink: async () => true });
	assert.equal(t.estado, 'DONE');
	assert.equal(await verificarLink('http://inseguro.x'), false);
	assert.equal(await verificarLink('https://ok.x', async () => new Response(null, { status: 200 })), true);
	assert.equal(await verificarLink('https://head.x', async (u, i) => new Response(null, { status: i.method === 'HEAD' ? 405 : 200 })), true);
});

test('comandos: /urgente em lote pede /confirmar; o token executa uma vez', async () => {
	const { ctx } = contexto();
	for (let i = 0; i < 4; i++) await executar(cmd(`/fila editorial T${i}\ndod: d`), { ...ctx, commandId: `F${i}` });
	const r = await executar(cmd('/urgente #1 #2 #3 #4'), ctx);
	const token = /confirmar (\w{6})/.exec(r.texto)[1];
	assert.equal(ctx.tarefas.issues.filter((t) => t.labels.includes('priority/urgente')).length, 0);
	await executar(cmd(`/confirmar ${token}`), { ...ctx, commandId: 'CF' });
	assert.equal(ctx.tarefas.issues.filter((t) => t.labels.includes('priority/urgente')).length, 4);
	await assert.rejects(executar(cmd(`/confirmar ${token}`), { ...ctx, commandId: 'CF2' }), (e) => e.codigo === 'E-401');
	const lista = await executar(cmd('/urgente'), ctx);
	assert.match(lista.assunto, /Urgentes — 4/);
	const pct = await executar(cmd('/% urgente'), ctx);
	assert.match(pct.texto, /Na fila 4/);
});

test('comandos: /criar-workflow valida o schema e abre PR (merge humano aprova)', async () => {
	const { ctx, prs } = contexto();
	await assert.rejects(executar(cmd(`/criar-workflow editorial\n${WF.replace('estado: ATIVO', 'estado: ATIVO')}`), ctx), /PROPOSTO/);
	const novo = WF.replace('id: WF-CAMP-001', 'id: WF-CAMP-002').replace('estado: ATIVO', 'estado: PROPOSTO');
	const r = await executar(parseComando('/criar-workflow editorial', novo.split('\n').filter((l) => !/^\s*#/.test(l))), ctx);
	assert.equal(prs[0].caminho, 'ops/workflows/WF-CAMP-002.yaml');
	assert.match(r.texto, /merge humano/);
});

// ------------------------------------------------------------------ relatório
test('relatório: snapshot → JSON canônico com proveniência; HTML só com tokens; texto plano', async () => {
	const { ctx } = contexto();
	await executar(cmd('/campanha WF-CAMP-001 iniciar\ninstancia: RC-C01\ndata: 2026-10-09\nprograma: rc'), ctx);
	const r = await executar(cmd('/status-report campanha WF-CAMP-001 RC-C01 pdf'), ctx);
	const d = r.relatorio.dados;
	assert.equal(r.relatorio.formato, 'pdf');
	assert.equal(d.meta.schema, 'EXECUTAR_STATUS_REPORT_V1');
	assert.equal(d.progress.overall_percent, 0);
	assert.deepEqual([d.progress.cycle_current, d.progress.cycle_total], [1, 6]);
	for (const k of Object.keys(d.properties)) if (d.properties[k] !== 'Não identificado no documento') assert.ok(d.provenance.field_map[`properties.${k}`], k);
	const impresso = htmlImpressao(d);
	const email = htmlEmail(d);
	assert.doesNotMatch(impresso, /{{/);
	assert.doesNotMatch(email, /{{|var\(--/); // e-mail: tokens resolvidos, sem custom properties
	assert.match(impresso, /IBM Plex Sans/);
	assert.match(textoPlano(d), /AGORA: \[E1\] Validar o tema do ciclo/);
	// Fora do bloco de tokens gerado, nenhum hex no template de impressão.
	const semTokens = impresso.replace(/:root\{[^}]*\}/, '');
	assert.doesNotMatch(semTokens, /#[0-9A-Fa-f]{6}\b/);
});

const COPILOTO = process.env.COPILOTO_DIR ?? path.resolve(raiz, '../Copiloto');
const temPython = (() => {
	try {
		execFileSync('python3', ['--version']);
		return fs.existsSync(path.join(COPILOTO, 'skills/SK-04-executar-relatorios/scripts/render_report.py'));
	} catch {
		return false;
	}
})();

test('relatório: paridade byte a byte com render_report.py da skill (mesmo commit)', { skip: !temPython && 'sem clone do Copiloto/python3' }, async (t) => {
	const { COMMIT } = await import('../../scripts/sync-report-assets.mjs');
	const head = execFileSync('git', ['-C', COPILOTO, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
	if (head !== COMMIT) return t.skip(`clone do Copiloto em ${head.slice(0, 7)}, assets fixados em ${COMMIT.slice(0, 7)}`);
	const entrada = path.join(COPILOTO, 'skills/SK-04-executar-relatorios/examples/report-project.json');
	const dados = JSON.parse(fs.readFileSync(entrada, 'utf8'));
	const tmp = fs.mkdtempSync(path.join((await import('node:os')).tmpdir(), 'rel-'));
	execFileSync('python3', [path.join(COPILOTO, 'skills/SK-04-executar-relatorios/scripts/render_report.py'), entrada, path.join(tmp, 'a.html'), '--email', path.join(tmp, 'a.email.html')]);
	assert.equal(htmlImpressao(dados), fs.readFileSync(path.join(tmp, 'a.html'), 'utf8'));
	assert.equal(htmlEmail(dados), fs.readFileSync(path.join(tmp, 'a.email.html'), 'utf8'));
});

test('relatório: montarRelatorio sem tarefas marca lacunas em vez de inventar', () => {
	const d = montarRelatorio({ tipo: '72h', titulo: 'Vazio', tarefas: [], fonte: 'o/r', agora: new Date('2026-10-05T12:00:00Z') });
	assert.equal(d.progress.overall_percent, null);
	assert.equal(d.properties.step_1, 'Não identificado no documento');
	assert.ok(d.quality.missing_fields.includes('properties.step_1'));
	assert.match(htmlImpressao(d), /—/);
});

// ------------------------------------------------------------------ adapters e webhooks
test('e-mail: sem EMAIL_ENVIO_ATIVO=1 nada sai (fail safe); com ele, chama o Resend com idempotência', async () => {
	const m = { para: ['a@x'], assunto: 's', texto: 't', idempotencia: 'outbox-1' };
	assert.deepEqual(await enviarEmail({ EMAIL_FROM: 'f' }, m, () => assert.fail('não deveria chamar')), { id: null, simulado: true });
	let pedido;
	const r = await enviarEmail({ EMAIL_FROM: 'f', RESEND_API_KEY: 're_x', EMAIL_ENVIO_ATIVO: '1' }, { ...m, anexos: [{ nome: 'r.pdf', base64: 'QQ==', tipo: 'application/pdf' }] }, async (url, init) => {
		pedido = { url, init };
		return Response.json({ id: 'e1' });
	});
	assert.equal(r.id, 'e1');
	assert.equal(pedido.init.headers['idempotency-key'], 'outbox-1');
	assert.equal(JSON.parse(pedido.init.body).attachments[0].filename, 'r.pdf');
	await assert.rejects(enviarEmail({ EMAIL_FROM: 'f', RESEND_API_KEY: 'k', EMAIL_ENVIO_ATIVO: '1' }, m, async () => new Response('bad', { status: 422 })), (e) => e.definitivo === true);
	await assert.rejects(enviarEmail({ EMAIL_FROM: 'f', RESEND_API_KEY: 'k', EMAIL_ENVIO_ATIVO: '1' }, m, async () => new Response('x', { status: 503 })), (e) => e.definitivo === false);
});

test('e-mail: DMARC lido de Authentication-Results', () => {
	assert.equal(dmarcDe([{ name: 'Authentication-Results', value: 'spf=pass; dkim=pass; dmarc=pass action=none' }]), 'pass');
	assert.equal(dmarcDe([{ name: 'Authentication-Results', value: 'dmarc=fail' }]), 'fail');
	assert.equal(dmarcDe([]), 'unknown');
});

function envWorker(extra = {}) {
	const enviados = [];
	return { enviados, env: { LEDGER: d1(), FILA: { send: async (m) => enviados.push(m) }, GRAPH_CLIENT_STATE: 'segredo', GITHUB_WEBHOOK_SECRET: 'wh', OPS_REPO: 'o/ops', BLOG_REPO: 'o/blog', EMAIL_FROM: 'f', GRAPH_MAILBOX: 'c@x', ...extra } };
}

test('webhook Graph: handshake, clientState obrigatório e dedupe antes de enfileirar', async () => {
	const { env, enviados } = envWorker();
	const h = await tratar(new Request('https://c/webhooks/graph?validationToken=abc%20123', { method: 'POST' }), env);
	assert.equal(await h.text(), 'abc 123');
	const corpo = (cs) => JSON.stringify({ value: [{ clientState: cs, resourceData: { id: 'M1' } }] });
	await tratar(new Request('https://c/webhooks/graph', { method: 'POST', body: corpo('errado') }), env);
	assert.equal(enviados.length, 0);
	const r = await tratar(new Request('https://c/webhooks/graph', { method: 'POST', body: corpo('segredo') }), env);
	await tratar(new Request('https://c/webhooks/graph', { method: 'POST', body: corpo('segredo') }), env);
	assert.equal(r.status, 202);
	assert.deepEqual(enviados, [{ tipo: 'email', id: 'M1' }]);
	assert.equal((await tratar(new Request('https://c/saude'), env)).status, 200);
});

test('webhook GitHub: assinatura HMAC obrigatória', async () => {
	const { env } = envWorker();
	const corpo = JSON.stringify({ action: 'opened' });
	assert.equal((await tratar(new Request('https://c/webhooks/github', { method: 'POST', body: corpo, headers: { 'x-hub-signature-256': 'sha256=00' } }), env)).status, 401);
	const sig = `sha256=${createHmac('sha256', 'wh').update(corpo).digest('hex')}`;
	assert.equal((await tratar(new Request('https://c/webhooks/github', { method: 'POST', body: corpo, headers: { 'x-hub-signature-256': sig, 'x-github-delivery': 'd1', 'x-github-event': 'issues' } }), env)).status, 202);
});

/** GitHub falso para o adapter real de tarefas. */
function githubFalso(issues) {
	const chamadas = [];
	const buscar = async (url, init = {}) => {
		const u = new URL(url);
		const rota = u.pathname.replace('/repos/o/ops', '');
		const corpo = init.body ? JSON.parse(init.body) : null;
		chamadas.push({ metodo: init.method ?? 'GET', rota, corpo });
		const r = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });
		if (rota === '/issues' && !init.method) return r(u.searchParams.get('labels') === 'type/tarefa' ? issues : []);
		if (rota === '/issues' && init.method === 'POST') {
			const nova = { number: issues.length + 1, id: 900 + issues.length, title: corpo.title, body: corpo.body, state: 'open', html_url: `h/${issues.length + 1}`, labels: corpo.labels.map((name) => ({ name })) };
			issues.push(nova);
			return r(nova, 201);
		}
		const m = /^\/issues\/(\d+)$/.exec(rota);
		if (m) {
			const i = issues.find((x) => x.number === Number(m[1]));
			if (init.method === 'PATCH') {
				if (corpo.labels) i.labels = corpo.labels.map((name) => ({ name }));
				if (corpo.body) i.body = corpo.body;
				if (corpo.state) i.state = corpo.state;
			}
			return r(i);
		}
		if (/\/comments$|\/labels$|\/sub_issues$/.test(rota)) return r({}, 201);
		return r({}, 404);
	};
	return { buscar, chamadas };
}

test('adapter GitHub: criação idempotente por task_key, CAS na transição e fechamento em DONE', async () => {
	const issues = [];
	const { buscar, chamadas } = githubFalso(issues);
	const t = new Tarefas({ OPS_REPO: 'o/ops', GITHUB_TOKEN: 't', GITHUB_API: 'https://api.test' }, buscar);
	const spec = { task_key: 'EXE-0001', area: 'editorial', dod: 'ok', peso: 1, depende: [], verificacao: 'manual', evidencia: [] };
	const a = await t.criar({ titulo: 'X', spec, labels: ['type/tarefa'], estado: 'READY', epic: 284 });
	const b = await t.criar({ titulo: 'X', spec, labels: ['type/tarefa'], estado: 'READY' });
	assert.deepEqual([a.criada, b.criada, issues.length], [true, false, 1]);
	assert.ok(chamadas.some((c) => c.rota === '/issues/284/sub_issues' && c.corpo.sub_issue_id === 900));
	assert.equal((await t.listar())[0].estado, 'READY');
	await assert.rejects(t.transicionar(1, 'DOING', 'VERIFY'), (e) => e.codigo === 'E-301');
	assert.equal(await t.transicionar(1, 'READY', 'DOING'), 'aplicada');
	assert.equal(await t.transicionar(1, 'READY', 'DOING'), 'sem-efeito');
	await t.transicionar(1, 'DOING', 'DONE');
	assert.deepEqual([issues[0].state, issues[0].labels.filter((l) => l.name.startsWith('state/')).map((l) => l.name)], ['closed', ['state/done']]);
});

test('UI do GitHub: DONE sem evidência é revertido; transição legal é aceita (AC-07)', async () => {
	const corpo = comTaskSpec('', { task_key: 'EXE-0001', area: 'e', dod: 'ok', peso: 1, depende: [], verificacao: 'link_valido', evidencia: [] });
	const issues = [{ number: 1, id: 1, title: 'X', body: corpo, state: 'open', html_url: 'h', labels: [{ name: 'type/tarefa' }, { name: 'state/doing' }, { name: 'state/done' }] }];
	const { buscar } = githubFalso(issues);
	const t = new Tarefas({ OPS_REPO: 'o/ops', GITHUB_TOKEN: 't', GITHUB_API: 'https://api.test' }, buscar);
	assert.equal(await validarLabelUi(t, 1, 'state/done', ['type/tarefa', 'state/doing', 'state/done']), 'revertida');
	assert.deepEqual(issues[0].labels.map((l) => l.name), ['type/tarefa', 'state/doing']);
	issues[0].labels.push({ name: 'state/verify' });
	assert.equal(await validarLabelUi(t, 1, 'state/verify', ['type/tarefa', 'state/doing', 'state/verify']), 'aceita');
	assert.deepEqual(issues[0].labels.map((l) => l.name), ['type/tarefa', 'state/verify']);
});

test('espelho da planilha: projeção do GitHub com cabeçalho e progresso (DEC-02)', () => {
	const ts = [
		{ numero: 1, titulo: 'A', estado: 'DONE', spec: { task_key: 'K-01', area: 'e', program: 'rc', peso: 1, depende: [], evidencia: ['https://x'] }, labels: [], tipo: 'tarefa' },
		{ numero: 2, titulo: 'B', estado: 'READY', spec: { task_key: 'K-02', area: 'e', program: 'rc', peso: 1, depende: ['K-01'], evidencia: [] }, labels: ['priority/urgente'], tipo: 'tarefa' },
		{ numero: 3, titulo: 'I', estado: 'BACKLOG_VALIDATED', spec: { task_key: 'IDEIA-0001', area: 'e' }, labels: [], tipo: 'ideia' },
	];
	const abas = abasEspelho(ts, new Date('2026-10-05T00:00:00Z'));
	assert.equal(abas.TAREFAS.length, 3);
	assert.equal(abas.TAREFAS[2][5], 'sim');
	assert.equal(abas.IDEIAS.length, 2);
	assert.deepEqual(abas.PROGRESSO[1].slice(0, 2), ['todos', 50]);
	assert.deepEqual(abas.PROGRESSO[2].slice(0, 2), ['programa/rc', 50]);
});
