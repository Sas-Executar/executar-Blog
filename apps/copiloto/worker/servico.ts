/**
 * Executor de comandos (ADR-015 §3.4: VALIDATION → PLANNING → EXECUTION). Determinístico: recebe
 * o comando já parseado, aplica RBAC e regras de estado, escreve só pela porta do GitHub e devolve
 * a resposta a enviar. Portas injetadas para teste (GitHub simulado, ledger em SQLite).
 */
import { parse as lerYaml } from 'yaml';
import { AJUDA, type Comando, ErroComando, type Referencia, VERBOS, exigeConfirmacao, tipoDoComando } from './comandos.ts';
import { type Estado, type TaskSpec, type Tarefa, ROTULO, barra, completude, dataLocal, decidirFeito, promoviveis } from './dominio.ts';
import type { Ledger } from './ledger.ts';
import { type RelatorioV1, montarRelatorio } from './relatorio.ts';
import { resolverReferencia } from './tarefas.ts';
import { type Workflow, WorkflowSchema, estadoDaCampanha, lerWorkflow, mermaidEstados, planejarInstancia } from './workflow.ts';

export const PAPEIS = ['OPERADOR', 'LEITOR', 'EDITOR', 'AGENTE'] as const;
export type Papel = (typeof PAPEIS)[number];

/** RBAC (§5.6): JSON {"email": "OPERADOR", ...} em secret/var RBAC. Sem entrada → não autorizado. */
export function papelDe(email: string, rbac: string | undefined): Papel | null {
	if (!rbac) return null;
	try {
		const p = (JSON.parse(rbac) as Record<string, string>)[email.toLowerCase()];
		return (PAPEIS as readonly string[]).includes(p) ? (p as Papel) : null;
	} catch {
		return null;
	}
}

export function autorizado(papel: Papel, c: Comando): boolean {
	const tipo = tipoDoComando(c);
	if (papel === 'OPERADOR') return true;
	if (tipo === 'leitura') return true;
	if (papel === 'LEITOR') return c.verbo === 'status-report';
	if (papel === 'EDITOR') return c.verbo === 'ideia' ? c.args.area === 'editorial' : c.verbo === 'feito' || c.verbo === 'status-report';
	if (papel === 'AGENTE') return c.verbo === 'status-report' || c.verbo === 'campanha';
	return false;
}

export interface PortaTarefas {
	listar(): Promise<Tarefa[]>;
	criar(p: { titulo: string; spec: TaskSpec; labels: string[]; estado: Estado; descricao?: string; epic?: number; commandId?: string }, existentes?: Tarefa[]): Promise<{ numero: number; url: string; criada: boolean }>;
	transicionar(numero: number, de: Estado, para: Estado, commandId?: string, motivo?: string): Promise<'aplicada' | 'sem-efeito'>;
	comentar(numero: number, texto: string, commandId?: string): Promise<void>;
	atualizarSpec(numero: number, spec: TaskSpec): Promise<void>;
	adicionarLabel(numero: number, label: string): Promise<void>;
}

export interface PortaDefinicoes {
	/** Lê um arquivo versionado de ops/ na main (só o que foi mergeado vale — DEC-08). */
	lerOps(caminho: string): Promise<string | null>;
	/** Abre PR com a definição proposta; o merge humano é a aprovação. */
	abrirPR(caminho: string, conteudo: string, titulo: string, autor: string): Promise<string>;
}

export interface Contexto {
	commandId: string;
	ator: { email: string; papel: Papel };
	tarefas: PortaTarefas;
	defs: PortaDefinicoes;
	ledger: Ledger;
	fonte: string; // "Sas-Executar/Copiloto" (para proveniência)
	agora?: Date;
	/** Verificação "link_valido": a URL de evidência responde 2xx (publicado ≠ existente). */
	verificarLink?: (url: string) => Promise<boolean>;
}

export interface Resposta {
	assunto: string;
	texto: string;
	relatorio?: { dados: RelatorioV1; formato: 'html' | 'pdf'; tipo: string };
	efeitos?: string[];
}

const linha = (t: Tarefa) => `#${t.numero} ${t.spec?.task_key ? `${t.spec.task_key} ` : ''}— ${t.titulo}${t.estado ? ` [${ROTULO[t.estado]}]` : ''}${t.spec?.data ? ` · ${t.spec.data}` : ''}`;
const abertas = (ts: Tarefa[]) => ts.filter((t) => t.tipo !== 'ideia' && t.estado && t.estado !== 'DONE' && t.estado !== 'CANCELADO');

async function areasValidas(defs: PortaDefinicoes): Promise<Record<string, { aliases?: string[] }>> {
	const y = await defs.lerOps('ops/areas.yaml');
	return y ? ((lerYaml(y) as { areas: Record<string, { aliases?: string[] }> }).areas ?? {}) : {};
}

async function resolverArea(defs: PortaDefinicoes, area: string): Promise<string> {
	const areas = await areasValidas(defs);
	if (areas[area]) return area;
	const por = Object.entries(areas).find(([, v]) => v.aliases?.includes(area));
	if (por) return por[0];
	const dist = (a: string, b: string) => {
		const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
		for (let j = 1; j <= b.length; j++) d[0][j] = j;
		for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		return d[a.length][b.length];
	};
	const sugestoes = Object.keys(areas).sort((x, y) => dist(area, x) - dist(area, y)).slice(0, 3);
	throw new ErroComando('E-104', `Área desconhecida: ${area}. Mais próximas: ${sugestoes.join(', ') || '(ops/areas.yaml vazio)'}.`);
}

async function proximaChave(prefixo: string, ts: Tarefa[]): Promise<string> {
	const n = ts.map((t) => new RegExp(`^${prefixo}-(\\d{4})$`).exec(t.spec?.task_key ?? '')).filter(Boolean).map((m) => Number(m![1]));
	return `${prefixo}-${String((n.length ? Math.max(...n) : 0) + 1).padStart(4, '0')}`;
}

async function carregarWorkflow(defs: PortaDefinicoes, id: string): Promise<Workflow> {
	if (!/^WF-[A-Z]+-\d{3}$/.test(id)) throw new ErroComando('E-100', `Workflow inválido: ${id} (ex.: WF-CAMP-001).`);
	const y = await defs.lerOps(`ops/workflows/${id}.yaml`);
	if (!y) throw new ErroComando('E-201', `Workflow ${id} não existe na main (só definições mergeadas valem).`);
	const w = lerWorkflow(y);
	if (w.estado !== 'ATIVO') throw new ErroComando('E-301', `Workflow ${id} está ${w.estado}.`);
	return w;
}

/** Promove BACKLOG_VALIDATED → READY quando as dependências fecharam (efeito do /feito). */
async function promover(ctx: Contexto, ts: Tarefa[]): Promise<string[]> {
	const out: string[] = [];
	for (const t of promoviveis(ts)) {
		await ctx.tarefas.transicionar(t.numero, 'BACKLOG_VALIDATED', 'READY', ctx.commandId, 'Dependências concluídas.');
		t.estado = 'READY';
		out.push(`#${t.numero} → Pronta`);
	}
	return out;
}

export async function executar(c: Comando, ctx: Contexto): Promise<Resposta> {
	if (!autorizado(ctx.ator.papel, c)) throw new ErroComando('E-110', 'Seu papel não permite este comando.');
	const agora = ctx.agora ?? new Date();
	const hoje = dataLocal(agora);

	switch (c.verbo) {
		case 'ajuda': {
			const alvo = c.args.alvo as string | undefined;
			const verbos = alvo && (VERBOS as readonly string[]).includes(alvo) ? [alvo as (typeof VERBOS)[number]] : [...VERBOS];
			return { assunto: 'Ajuda — comandos do Copiloto', texto: verbos.map((v) => AJUDA[v]).join('\n') };
		}

		case 'hoje':
		case 'amanha': {
			const ts = await ctx.tarefas.listar();
			const dia = c.verbo === 'hoje' ? hoje : dataLocal(agora, 1);
			const doDia = abertas(ts).filter((t) => t.spec?.data === dia);
			const partes = [`${c.verbo === 'hoje' ? 'HOJE' : 'AMANHÃ'} (${dia}): ${doDia.length} tarefa(s)`, ...doDia.map(linha)];
			if (c.verbo === 'hoje') {
				const atrasadas = abertas(ts).filter((t) => t.spec?.data && t.spec.data < hoje);
				const wip = ts.filter((t) => t.estado === 'DOING');
				if (atrasadas.length) partes.push('', `ATRASADAS: ${atrasadas.length}`, ...atrasadas.map(linha));
				partes.push('', `WIP: ${wip.length}${wip.length > 1 ? ' (acima de 1 — feche uma antes de abrir outra)' : ''}`, ...wip.map(linha));
				const semData = ts.filter((t) => t.estado === 'READY' && !t.spec?.data).length;
				if (semData) partes.push('', `${semData} tarefa(s) PRONTAS sem data.`);
			} else {
				const porChave = new Map(ts.filter((t) => t.spec).map((t) => [t.spec!.task_key, t]));
				const pendentes = doDia.flatMap((t) => (t.spec?.depende ?? []).filter((k) => porChave.get(k)?.estado !== 'DONE').map((k) => `${t.spec!.task_key} depende de ${k}`));
				if (pendentes.length) partes.push('', 'DEPENDÊNCIAS AINDA NÃO PRONTAS:', ...pendentes);
			}
			return { assunto: `${c.verbo === 'hoje' ? 'Hoje' : 'Amanhã'} — ${doDia.length} tarefa(s)`, texto: partes.join('\n') };
		}

		case '%': {
			const ts = await ctx.tarefas.listar();
			const escopo = c.args.escopo as string;
			const alvo = (c.args.alvo as string | undefined)?.toLowerCase();
			const filtro: Record<string, (t: Tarefa) => boolean> = {
				programa: (t) => !alvo || t.spec?.program === alvo,
				sprint: (t) => !alvo || t.labels.includes(`sprint/${alvo}`),
				area: (t) => t.spec?.area === alvo,
				urgente: (t) => t.labels.includes('priority/urgente'),
				hoje: (t) => t.spec?.data === hoje,
				amanha: (t) => t.spec?.data === dataLocal(agora, 1),
				fila: (t) => !alvo || t.spec?.area === alvo,
				campanha: (t) => Boolean(t.spec?.workflow) && (!alvo || t.spec!.task_key.startsWith(`${alvo.toUpperCase()}-`)),
			};
			const c2 = completude(ts.filter(filtro[escopo] ?? (() => false)));
			const contagem = Object.entries(c2.contagem).filter(([, n]) => n).map(([e, n]) => `${ROTULO[e as Estado]} ${n}`).join(' · ');
			return { assunto: `% ${escopo}${alvo ? ` ${alvo}` : ''}: ${c2.percentual === null ? 'sem itens' : `${c2.percentual} %`}`, texto: `${escopo.toUpperCase()}${alvo ? ` ${alvo}` : ''}  ${barra(c2.percentual)}\n${contagem || 'sem itens'}\nVERIFY não conta como concluído; ideias ficam fora.` };
		}

		case 'urgente': {
			const ts = await ctx.tarefas.listar();
			if (!c.args.refs && !c.args.area) {
				const ordem = ['DOING', 'VERIFY', 'READY', 'BLOCKED', 'BACKLOG_VALIDATED'];
				const u = abertas(ts).filter((t) => t.labels.includes('priority/urgente')).sort((a, b) => ordem.indexOf(a.estado!) - ordem.indexOf(b.estado!) || (a.spec?.data ?? '9').localeCompare(b.spec?.data ?? '9') || (b.spec?.peso ?? 1) - (a.spec?.peso ?? 1));
				return { assunto: `Urgentes — ${u.length}`, texto: u.length ? u.map(linha).join('\n') : 'Nenhuma tarefa urgente aberta.' };
			}
			if (c.args.refs) {
				if (exigeConfirmacao(c) && !c.args.confirmado) {
					const token = await ctx.ledger.guardarPlano(ctx.commandId, c);
					return { assunto: 'Confirmação necessária', texto: `Marcar ${(c.args.refs as unknown[]).length} tarefas como urgentes é escrita em lote.\nResponda com: /confirmar ${token}\n(válido por 30 minutos, uso único)` };
				}
				const efeitos: string[] = [];
				for (const ref of c.args.refs as Referencia[]) {
					const r = resolverReferencia(ref, ts);
					if (!('tarefa' in r)) throw new ErroComando('codigo' in r ? r.codigo : 'E-202', 'erro' in r ? r.erro : 'Referência ambígua.');
					await ctx.ledger.operacao(`${ctx.commandId}:urgente:${r.tarefa.numero}`, ctx.commandId, `#${r.tarefa.numero}`, () => ctx.tarefas.adicionarLabel(r.tarefa.numero, 'priority/urgente'));
					efeitos.push(`#${r.tarefa.numero} marcada como urgente`);
				}
				return { assunto: `Urgente — ${efeitos.length} marcada(s)`, texto: efeitos.join('\n'), efeitos };
			}
			return criarTarefa(c, ctx, ts, true);
		}

		case 'fila':
			return criarTarefa(c, ctx, await ctx.tarefas.listar(), false);

		case 'ideia': {
			const ts = await ctx.tarefas.listar();
			const area = await resolverArea(ctx.defs, c.args.area as string);
			const k = await proximaChave('IDEIA', ts);
			const r = await ctx.ledger.operacao(`${ctx.commandId}:ideia`, ctx.commandId, k, () =>
				ctx.tarefas.criar({ titulo: c.args.texto as string, spec: { task_key: k, area, dod: '', peso: 1, depende: [], verificacao: 'manual', evidencia: [], origem: { command_id: ctx.commandId, canal: 'outlook' } }, labels: ['type/ideia', `area/${area}`], estado: 'BACKLOG_VALIDATED', descricao: c.payload.descricao, commandId: ctx.commandId }, ts),
			);
			return { assunto: `Ideia registrada — ${k}`, texto: `${k} (#${r.numero}) em ${area}. Ideias não entram na fila nem no percentual.\n${r.url}`, efeitos: [`#${r.numero}`] };
		}

		case 'feito': {
			const ts = await ctx.tarefas.listar();
			const r = resolverReferencia(c.args.ref as Referencia, ts);
			if ('candidatos' in r) return { assunto: 'Qual delas?', texto: `Mais de uma tarefa corresponde:\n${r.candidatos.map(linha).join('\n')}\nResponda /feito #n com o número certo.` };
			if ('erro' in r) throw new ErroComando(r.codigo, r.erro);
			const t = r.tarefa;
			if (!t.spec || !t.estado) throw new ErroComando('E-100', `#${t.numero} não tem task-spec/estado válido.`);
			const evidencia = [...t.spec.evidencia, ...(c.args.evidencia ? [String(c.args.evidencia)] : [])];
			let d = decidirFeito(t.estado, t.spec, evidencia);
			if (d.acao === 'DONE' && t.spec.verificacao === 'link_valido' && ctx.verificarLink) {
				const links = evidencia.filter((e) => /^https:\/\//.test(e));
				const ok = (await Promise.all(links.map((u) => ctx.verificarLink!(u).catch(() => false)))).some(Boolean);
				if (!ok) d = { acao: 'VERIFY', motivo: 'O link de evidência não respondeu (verificação link_valido).' };
			}
			if (d.acao === 'IDEMPOTENTE') return { assunto: `#${t.numero} já concluída`, texto: linha(t) };
			if (d.acao === 'ERRO') throw new ErroComando(d.codigo, d.mensagem);
			if (c.args.evidencia && !t.spec.evidencia.includes(String(c.args.evidencia))) await ctx.tarefas.atualizarSpec(t.numero, { ...t.spec, evidencia });
			const de = t.estado;
			const para: Estado = d.acao === 'DONE' ? 'DONE' : 'VERIFY';
			const efeitos: string[] = [];
			if (de !== para) {
				await ctx.tarefas.transicionar(t.numero, de, para, ctx.commandId, d.acao === 'VERIFY' ? d.motivo : `Evidência: ${evidencia.join(', ')}`);
				await ctx.ledger.evento(`#${t.numero}`, 'transicao', de, para, ctx.commandId);
				efeitos.push(`#${t.numero} ${ROTULO[de]} → ${ROTULO[para]}`);
				t.estado = para;
			}
			if (para === 'DONE') efeitos.push(...(await promover(ctx, ts)));
			const proxima = abertas(ts).find((x) => x.estado === 'READY');
			return {
				assunto: para === 'DONE' ? `✓ ${t.spec.task_key} → Concluída` : `${t.spec.task_key} → Verificando`,
				texto: [`RESULTADO: ${efeitos[0] ?? linha(t)}`, d.acao === 'VERIFY' ? `PENDENTE: ${d.motivo}` : `EVIDÊNCIA: ${evidencia.join(', ')}`, ...efeitos.slice(1), proxima ? `PRÓXIMA: ${linha(proxima)}` : ''].filter(Boolean).join('\n'),
				efeitos,
			};
		}

		case 'campanha': {
			const w = await carregarWorkflow(ctx.defs, c.args.workflow as string);
			const instancia = (c.payload.instancia ?? '').toUpperCase();
			if (!/^[A-Z]{2,5}-[A-Z0-9]{2,6}$/.test(instancia)) throw new ErroComando('E-100', 'Informe "instancia: RC-C01" (prefixo do programa + ciclo) nas linhas seguintes.');
			const ts = await ctx.tarefas.listar();
			if (c.args.acao === 'iniciar') {
				const lancamento = c.payload.data;
				const programa = (c.payload.programa ?? '').toLowerCase();
				if (!/^\d{4}-\d{2}-\d{2}$/.test(lancamento ?? '') || !/^[a-z0-9-]+$/.test(programa)) throw new ErroComando('E-100', 'Informe "data: AAAA-MM-DD" (dia do lançamento) e "programa: slug".');
				const epic = c.payload.epic ? Number(c.payload.epic.replace('#', '')) : undefined;
				const plano = planejarInstancia(w, { instancia, lancamento, programa, command_id: ctx.commandId });
				let criadas = 0;
				for (const p of plano) {
					const r = await ctx.ledger.operacao(`${ctx.commandId}:${p.spec.task_key}`, ctx.commandId, p.spec.task_key, () => ctx.tarefas.criar({ titulo: p.titulo, spec: p.spec, labels: p.labels, estado: p.estadoInicial, descricao: p.descricao, epic, commandId: ctx.commandId }, ts));
					if (r.criada) criadas++;
				}
				return { assunto: `Campanha ${instancia} iniciada — ${plano.length} tarefas`, texto: `${w.nome}\n${criadas} criadas, ${plano.length - criadas} já existiam (idempotente).\nLançamento: ${lancamento}. Só a primeira tarefa nasce Pronta; cada gate abre o próximo ENTRYPOINT.`, efeitos: [`${criadas} issues`] };
			}
			const efeitos = c.args.acao === 'avancar' ? await promover(ctx, ts) : [];
			const ec = estadoDaCampanha(w, instancia, ts, agora);
			if (!ec.entrypoints.some((e) => e.tarefas.length)) throw new ErroComando('E-201', `Nenhuma tarefa da instância ${instancia}. Use /campanha ${w.id} iniciar.`);
			return {
				assunto: `Campanha ${instancia} — ${ec.atual ? `${ec.atual.id} aberto` : 'ciclo fechado'} · ${ec.completude.percentual ?? 0} %`,
				texto: [
					`${w.nome} · ${instancia}  ${barra(ec.completude.percentual)}`,
					...ec.entrypoints.map((e) => `${e.id} ${e.nome}: ${e.estado.toLowerCase()}${e.progresso === null ? '' : ` (${e.progresso} %)`}`),
					'',
					ec.agora ? `AGORA: ${linha(ec.agora)}` : 'AGORA: nada pronto — confira bloqueios/gates.',
					ec.proxima ? `PRÓXIMA: ${linha(ec.proxima)}` : '',
					ec.atrasadas.length ? `ATRASADAS: ${ec.atrasadas.length}\n${ec.atrasadas.map(linha).join('\n')}` : '',
					...efeitos,
					'',
					'```mermaid',
					mermaidEstados(ec),
					'```',
				]
					.filter((x) => x !== '')
					.join('\n'),
				efeitos,
			};
		}

		case 'status-report': {
			const ts = await ctx.tarefas.listar();
			const tipo = c.args.tipo as string;
			const alvo = c.args.alvo as string | undefined;
			let campanha;
			let escopo = ts;
			let titulo = { '72h': 'Status das últimas 72 horas', wiki: 'Status para a wiki', programa: `Programa ${alvo ?? 'EXECUTAR'}`, sprint: `Sprint ${alvo ?? 'atual'}`, roadmap: 'Roadmap', campanha: 'Campanha' }[tipo] ?? tipo;
			if (tipo === 'campanha') {
				const [wf, inst] = (alvo ?? '').split(/\s+/);
				const w = await carregarWorkflow(ctx.defs, wf ?? '');
				if (!inst) throw new ErroComando('E-100', '/status-report campanha <WF-ID> <INSTÂNCIA> [html|pdf]');
				campanha = estadoDaCampanha(w, inst.toUpperCase(), ts, agora);
				escopo = campanha.entrypoints.flatMap((e) => e.tarefas);
				titulo = `${w.nome} · ${inst.toUpperCase()}`;
			} else if (tipo === 'programa' && alvo) escopo = ts.filter((t) => t.spec?.program === alvo.toLowerCase());
			else if (tipo === 'sprint' && alvo) escopo = ts.filter((t) => t.labels.includes(`sprint/${alvo.toLowerCase()}`));
			else if (tipo === '72h') {
				const janela = new Set([dataLocal(agora, -2), dataLocal(agora, -1), hoje, dataLocal(agora, 1)]);
				escopo = ts.filter((t) => (t.spec?.data && janela.has(t.spec.data)) || t.estado === 'DOING' || t.estado === 'VERIFY' || t.estado === 'BLOCKED');
			}
			const dados = montarRelatorio({ tipo, titulo, tarefas: escopo, fonte: ctx.fonte, agora, campanha });
			return { assunto: `Status report — ${titulo} · ${dados.progress.overall_percent ?? '—'} %`, texto: '', relatorio: { dados, formato: c.args.formato as 'html' | 'pdf', tipo } };
		}

		case 'criar-rotina':
		case 'criar-runbook':
		case 'criar-workflow': {
			const conteudo = c.payload.descricao ?? '';
			const pasta = { 'criar-rotina': 'routines', 'criar-runbook': 'runbooks', 'criar-workflow': 'workflows' }[c.verbo];
			let nome: string;
			if (c.verbo === 'criar-workflow') {
				const w = WorkflowSchema.safeParse(lerYaml(conteudo));
				if (!w.success) throw new ErroComando('E-100', `Workflow inválido: ${w.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
				if (w.data.estado !== 'PROPOSTO') throw new ErroComando('E-100', 'Workflow novo nasce com "estado: PROPOSTO"; o PR aprovado muda para ATIVO.');
				nome = `${w.data.id}.yaml`;
			} else if (c.verbo === 'criar-rotina') {
				const r = lerYaml(conteudo) as { id?: string };
				if (!r?.id || !/^ROT-\d{3}$/.test(r.id)) throw new ErroComando('E-100', 'Rotina precisa de "id: ROT-NNN" (ver ops/routines/).');
				nome = `${r.id}.yaml`;
			} else {
				const slug = String(c.args.alvo ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
				if (!slug) throw new ErroComando('E-100', '/criar-runbook <nome> + Markdown nas linhas seguintes');
				nome = `${slug}.md`;
			}
			const url = await ctx.defs.abrirPR(`ops/${pasta}/${nome}`, conteudo.endsWith('\n') ? conteudo : `${conteudo}\n`, `ops: propõe ${pasta}/${nome}`, ctx.ator.email);
			return { assunto: `PR aberto — ops/${pasta}/${nome}`, texto: `Proposta aberta para revisão: ${url}\nSó passa a valer depois do merge humano.`, efeitos: [url] };
		}

		case 'confirmar': {
			const p = await ctx.ledger.consumirPlano(c.args.token as string);
			if (!p) throw new ErroComando('E-401', 'Token inválido, expirado ou já usado. Reenvie o comando.');
			const original = p.plano as Comando;
			return executar({ ...original, args: { ...original.args, confirmado: true } }, ctx);
		}

		case 'cancelar': {
			const p = await ctx.ledger.consumirPlano(c.args.token as string);
			return { assunto: p ? 'Plano cancelado' : 'Nada a cancelar', texto: p ? 'O plano pendente foi descartado.' : 'Token inválido, expirado ou já usado.' };
		}
	}
	throw new ErroComando('E-101', 'Verbo sem implementação.');
}

async function criarTarefa(c: Comando, ctx: Contexto, ts: Tarefa[], urgente: boolean): Promise<Resposta> {
	const area = await resolverArea(ctx.defs, c.args.area as string);
	const dod = c.payload.dod?.trim();
	// DoD é pré-condição de BACKLOG_VALIDATED (§5.2). Sem LLM, não há DoD proposto: pede explícito.
	if (!dod) throw new ErroComando('E-100', 'Falta o critério de pronto. Responda com o mesmo comando e uma linha "dod: ..." abaixo.');
	const data = c.payload.data;
	if (data && !/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new ErroComando('E-100', 'data: use AAAA-MM-DD.');
	const peso = c.payload.peso ? Number(c.payload.peso) : 1;
	if (!Number.isInteger(peso) || peso < 1 || peso > 13) throw new ErroComando('E-100', 'peso: inteiro de 1 a 13.');
	const prefixo = (c.payload.programa ?? 'EXE').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'EXE';
	const k = await proximaChave(prefixo, ts);
	const depende = (c.payload.depende ?? '').split(/[\s,]+/).filter(Boolean);
	const spec: TaskSpec = { task_key: k, area, program: c.payload.programa?.toLowerCase(), dod, data, peso, depende, verificacao: 'manual', evidencia: [], origem: { command_id: ctx.commandId, canal: 'outlook' } };
	const labels = ['type/tarefa', `area/${area}`, ...(spec.program ? [`program/${spec.program}`] : []), ...(urgente ? ['priority/urgente'] : [])];
	const r = await ctx.ledger.operacao(`${ctx.commandId}:criar`, ctx.commandId, k, () => ctx.tarefas.criar({ titulo: c.args.texto as string, spec, labels, estado: 'BACKLOG_VALIDATED', descricao: c.payload.descricao, commandId: ctx.commandId }, ts));
	const naFila = ts.filter((t) => t.estado === 'BACKLOG_VALIDATED' && t.spec?.area === area).length + 1;
	return { assunto: `${urgente ? 'Urgente' : 'Na fila'} — ${k}`, texto: `${k} (#${r.numero}) criada em ${area}${urgente ? ' como urgente' : ''}. Posição na fila da área: ${naFila}.\nDoD: ${dod}\n${r.url}`, efeitos: [`#${r.numero}`] };
}
