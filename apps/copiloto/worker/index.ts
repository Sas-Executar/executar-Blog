/**
 * Worker do Copiloto Operacional (ADR-015). Sem interface: só webhooks, fila e cron.
 *  - POST /webhooks/graph   Outlook (Microsoft Graph): responde rápido e enfileira (§3.4 INPUT).
 *  - POST /webhooks/github  GitHub App: valida transições feitas na UI (§5.2) e enfileira.
 *  - GET  /saude            heartbeat + profundidade da DLQ.
 *  - queue                  processa comandos e envios (retry com backoff; DLQ no ledger).
 *  - scheduled              rotinas de ops/routines/*.yaml, reconciliador e espelho da planilha.
 */
import { parse as lerYaml } from 'yaml';
import { ErroComando, extrairComando, parseComando } from './comandos.ts';
import { promoviveis } from './dominio.ts';
import { type EnvEmail, type EnvGraph, type EnvSheets, type Navegador, ErroEnvio, base64, enviarEmail, gerarPdf, lerEmail, renovarAssinatura, substituirAbas } from './adaptadores.ts';
import { type D1Like, Ledger, sha256, ulid } from './ledger.ts';
import { caminhoRelatorio, htmlEmail, htmlImpressao, textoPlano } from './relatorio.ts';
import { abasEspelho, definicoesGithub, validarLabelUi, verificarLink } from './portas.ts';
import { type Resposta, executar, papelDe } from './servico.ts';
import { type EnvTarefas, Tarefas } from './tarefas.ts';

// Reexportados para quem já importava daqui (testes e ferramentas).
export { abasEspelho, validarLabelUi, verificarLink };

export interface Env extends EnvTarefas, EnvEmail, EnvGraph, EnvSheets {
	LEDGER: D1Like;
	FILA: { send(corpo: unknown, opcoes?: { delaySeconds?: number }): Promise<void> };
	BROWSER?: Navegador;
	OPS_BRANCH?: string; // ramo padrão do repositório operacional
	BLOG_REPO: string; // onde vivem as definições ops/** (PR + merge humano)
	RBAC?: string; // {"email":"OPERADOR"|"LEITOR"|"EDITOR"|"AGENTE"}
	GITHUB_WEBHOOK_SECRET?: string;
	OPERADOR_EMAIL?: string; // destino de alertas e rotinas
	URL_PUBLICA?: string; // https://executar-copiloto.<conta>.workers.dev (notificationUrl do Graph)
}

type Mensagem = { tipo: 'email'; id: string } | { tipo: 'saida'; outbox: number } | { tipo: 'rotina'; comando: string; para: string; horario: string; rotina: string };

const log = (dados: Record<string, unknown>) => console.log(JSON.stringify({ componente: 'copiloto', ...dados }));

const definicoes = (env: Env) => definicoesGithub(env);

const tarefasDe = (env: Env) => new Tarefas({ ...env, GITHUB_BRANCH: env.OPS_BRANCH } as EnvTarefas);

/** Resposta → e-mail (texto sempre; HTML ou PDF quando é relatório). Vai para o outbox. */
async function montarSaida(env: Env, r: Resposta, para: string, responderA?: string) {
	if (!r.relatorio) return { para: [para], assunto: r.assunto, texto: r.texto, responderA };
	const d = r.relatorio.dados;
	const base = { para: [para], assunto: r.assunto, texto: textoPlano(d), responderA };
	if (r.relatorio.formato === 'html') return { ...base, html: htmlEmail(d) };
	const pdf = await gerarPdf(env.BROWSER, htmlImpressao(d));
	return { ...base, texto: `${d.meta.title}: ${d.progress.overall_percent ?? '—'} % concluído. Agora: ${d.now.title}.\nRelatório completo em PDF anexo.`, anexos: [{ nome: `${caminhoRelatorio(r.relatorio.tipo, d.meta.date ?? 'sem-data', 'html').split('/').pop()!.replace('.html', '.pdf')}`, base64: base64(pdf), tipo: 'application/pdf' }] };
}

async function processarEmail(env: Env, ledger: Ledger, id: string) {
	const email = await lerEmail(env, id);
	const papel = papelDe(email.remetente, env.RBAC);
	// E-110 silencioso: remetente fora da allowlist não recebe resposta (evita oráculo).
	if (!papel) return log({ evento: 'rejeitado', motivo: 'E-110', remetente_hash: (await sha256(email.remetente)).slice(0, 12) });
	if (email.dmarc !== 'pass') {
		log({ evento: 'rejeitado', motivo: 'E-111', dmarc: email.dmarc });
		if (env.OPERADOR_EMAIL) await ledger.enfileirar('email', { para: [env.OPERADOR_EMAIL], assunto: 'Alerta: comando com autenticação falha', texto: `Um e-mail de ${email.remetente} chegou com DMARC=${email.dmarc} e foi ignorado.` });
		return;
	}
	const commandId = ulid();
	const aberto = await ledger.abrirComando({ command_id: commandId, dedupe_key: await sha256(`outlook:${email.internetMessageId}`), source: 'outlook', actor: email.remetente, envelope: { assunto: email.assunto, anexos: email.anexos } });
	if (!aberto.novo) return log({ evento: 'duplicado', command_id: aberto.command_id });
	const achado = extrairComando(email.assunto, email.corpo);
	let resposta: Resposta;
	try {
		if (!achado) throw new ErroComando('E-100', 'Nenhum comando encontrado. Comece a primeira linha com "/" (ex.: /hoje). Use /ajuda.');
		const comando = parseComando(achado.linha, achado.payload);
		await ledger.statusComando(commandId, 'PARSED', { verbo: comando.verbo });
		resposta = await executar(comando, { commandId, ator: { email: email.remetente, papel }, tarefas: tarefasDe(env), defs: definicoes(env), ledger, fonte: env.OPS_REPO, verificarLink: (u) => verificarLink(u) });
		await ledger.statusComando(commandId, 'APPLIED', { efeitos: resposta.efeitos ?? [] });
		await ledger.auditar(email.remetente, comando.verbo, resposta.efeitos?.join(',') ?? null, commandId);
	} catch (e) {
		const codigo = e instanceof ErroComando ? e.codigo : 'E-500';
		await ledger.statusComando(commandId, 'REJECTED', { codigo, erro: String(e) });
		if (!(e instanceof ErroComando)) throw e; // falha transitória: a fila retenta
		resposta = { assunto: `Não executado (${codigo})`, texto: `${e.message}\n\ncmd: ${commandId}` };
	}
	const saida = await montarSaida(env, resposta, email.remetente, email.internetMessageId);
	saida.texto += `\n\ncmd: ${commandId}`;
	const n = await ledger.enfileirar('email', saida, commandId);
	await env.FILA.send({ tipo: 'saida', outbox: n } satisfies Mensagem);
}

async function processarSaida(env: Env, ledger: Ledger, outbox: number) {
	const item = (await ledger.outboxPendente(100)).find((o) => o.id === outbox);
	if (!item) return; // já enviado (at-least-once) ou na DLQ
	try {
		const m = JSON.parse(item.payload);
		const r = await enviarEmail(env, { ...m, idempotencia: `outbox-${item.id}` });
		await ledger.outboxResultado(item.id, true);
		log({ evento: 'enviado', outbox: item.id, simulado: r.simulado });
	} catch (e) {
		const definitivo = e instanceof ErroEnvio && e.definitivo;
		const status = await ledger.outboxResultado(item.id, false, String(e), definitivo ? 1 : 5);
		log({ evento: 'falha-envio', outbox: item.id, status, erro: String(e).slice(0, 200) });
		if (status === 'PENDENTE') throw e; // a fila reentrega com backoff
	}
}

async function verificarAssinatura(segredo: string, corpo: string, assinatura: string | null) {
	if (!assinatura?.startsWith('sha256=')) return false;
	const chave = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const mac = new Uint8Array(await crypto.subtle.sign('HMAC', chave, new TextEncoder().encode(corpo)));
	const esperado = `sha256=${[...mac].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
	if (esperado.length !== assinatura.length) return false;
	let dif = 0;
	for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ assinatura.charCodeAt(i);
	return dif === 0;
}

export async function tratar(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const ledger = new Ledger(env.LEDGER);
	if (url.pathname === '/saude' && request.method === 'GET') {
		const sync = await ledger.ultimoSync('sheets');
		return Response.json({ ok: true, dlq: await ledger.profundidadeDlq(), ultimo_sync: sync?.last_synced_at ?? null });
	}
	if (url.pathname === '/webhooks/graph' && request.method === 'POST') {
		const token = url.searchParams.get('validationToken');
		if (token) return new Response(token, { headers: { 'content-type': 'text/plain' } }); // handshake da subscription
		const corpo = (await request.json().catch(() => null)) as { value?: { clientState?: string; resourceData?: { id?: string } }[] } | null;
		for (const n of corpo?.value ?? []) {
			if (!env.GRAPH_CLIENT_STATE || n.clientState !== env.GRAPH_CLIENT_STATE || !n.resourceData?.id) continue;
			if (await ledger.registrarEvento('outlook', n.resourceData.id)) await env.FILA.send({ tipo: 'email', id: n.resourceData.id } satisfies Mensagem);
		}
		return new Response(null, { status: 202 });
	}
	if (url.pathname === '/webhooks/github' && request.method === 'POST') {
		const corpo = await request.text();
		if (!env.GITHUB_WEBHOOK_SECRET || !(await verificarAssinatura(env.GITHUB_WEBHOOK_SECRET, corpo, request.headers.get('x-hub-signature-256')))) return new Response('assinatura inválida', { status: 401 });
		const entrega = request.headers.get('x-github-delivery') ?? '';
		if (!(await ledger.registrarEvento('github', entrega))) return new Response(null, { status: 202 });
		const ev = JSON.parse(corpo) as { action?: string; label?: { name: string }; issue?: { number: number; labels: { name: string }[] }; sender?: { type?: string } };
		if (request.headers.get('x-github-event') === 'issues' && ev.action === 'labeled' && ev.issue && ev.label && ev.sender?.type !== 'Bot') {
			const r = await validarLabelUi(tarefasDe(env), ev.issue.number, ev.label.name, ev.issue.labels.map((l) => l.name));
			log({ evento: 'label-ui', issue: ev.issue.number, resultado: r });
		}
		return new Response(null, { status: 202 });
	}
	return new Response('não encontrado', { status: 404 });
}

interface Rotina {
	id: string;
	nome: string;
	gatilho: { cron_utc: string };
	comando: string;
	payload?: string;
	para?: string;
	estado?: string;
}

async function cron(evento: { cron: string; scheduledTime: number }, env: Env) {
	const ledger = new Ledger(env.LEDGER);
	const horario = new Date(evento.scheduledTime).toISOString().slice(0, 16);
	const t = tarefasDe(env);
	if (evento.cron === '*/15 * * * *') {
		// ROT-004 reconciliação: invariantes + promoção READY + espelho da planilha.
		const ts = await t.listar();
		for (const x of promoviveis(ts)) await t.transicionar(x.numero, 'BACKLOG_VALIDATED', 'READY', undefined, 'Dependências concluídas (reconciliação).');
		if (env.SHEETS_ID) {
			const abas = abasEspelho(await t.listar());
			const hash = await sha256(JSON.stringify({ ...abas, _SYNC: null }));
			const antes = await ledger.ultimoSync('sheets');
			if (antes?.last_hash !== hash) await substituirAbas(env, abas);
			await ledger.sincronizado('sheets', hash, 0);
		}
		return;
	}
	const defs = definicoes(env);
	const indice = await defs.lerOps('ops/routines/index.yaml');
	for (const id of ((indice ? lerYaml(indice) : null) as { rotinas?: string[] } | null)?.rotinas ?? []) {
		const y = await defs.lerOps(`ops/routines/${id}.yaml`);
		const r = y ? (lerYaml(y) as Rotina) : null;
		if (!r || r.estado !== 'ATIVO' || r.gatilho?.cron_utc !== evento.cron) continue;
		if (!(await ledger.marcarRotina(r.id, horario))) continue; // já disparada neste horário
		if (r.comando === '/renovar-graph') {
			if (!env.URL_PUBLICA) continue;
			const atual = await ledger.ultimoSync('graph-subscription');
			const s = await renovarAssinatura(env, `${env.URL_PUBLICA}/webhooks/graph`, fetch, atual?.last_hash ?? undefined).catch(() => renovarAssinatura(env, `${env.URL_PUBLICA}/webhooks/graph`));
			await ledger.sincronizado('graph-subscription', s.id, 0);
			continue;
		}
		const para = r.para ?? env.OPERADOR_EMAIL;
		if (para) await env.FILA.send({ tipo: 'rotina', comando: r.comando + (r.payload ? `\n${r.payload}` : ''), para, horario, rotina: r.id } satisfies Mensagem);
	}
}

async function processarRotina(env: Env, ledger: Ledger, m: Extract<Mensagem, { tipo: 'rotina' }>) {
	const commandId = ulid();
	const aberto = await ledger.abrirComando({ command_id: commandId, dedupe_key: await sha256(`scheduler:${m.rotina}:${m.horario}`), source: 'scheduler', actor: `rotina:${m.rotina}`, envelope: m });
	if (!aberto.novo) return;
	const [linha, ...payload] = m.comando.split('\n');
	const resposta = await executar(parseComando(linha, payload), { commandId, ator: { email: `rotina:${m.rotina}`, papel: 'AGENTE' }, tarefas: tarefasDe(env), defs: definicoes(env), ledger, fonte: env.OPS_REPO });
	await ledger.statusComando(commandId, 'APPLIED');
	const saida = await montarSaida(env, resposta, m.para);
	const n = await ledger.enfileirar('email', saida, commandId);
	await env.FILA.send({ tipo: 'saida', outbox: n } satisfies Mensagem);
}

export default {
	fetch: (request: Request, env: Env) => tratar(request, env),
	async queue(lote: { messages: { body: Mensagem; attempts: number; ack(): void; retry(o?: { delaySeconds?: number }): void }[] }, env: Env) {
		const ledger = new Ledger(env.LEDGER);
		for (const msg of lote.messages) {
			try {
				if (msg.body.tipo === 'email') await processarEmail(env, ledger, msg.body.id);
				else if (msg.body.tipo === 'saida') await processarSaida(env, ledger, msg.body.outbox);
				else await processarRotina(env, ledger, msg.body);
				msg.ack();
			} catch (e) {
				// Backoff §5.7: 5 s, 30 s, 2 min, 10 min, 1 h. Esgotado → DLQ da fila (configurada no wrangler).
				const espera = [5, 30, 120, 600, 3600][Math.min(msg.attempts - 1, 4)];
				log({ evento: 'retry', tipo: msg.body.tipo, tentativa: msg.attempts, erro: String(e).slice(0, 200) });
				msg.retry({ delaySeconds: espera });
			}
		}
	},
	scheduled: (evento: { cron: string; scheduledTime: number }, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) => ctx.waitUntil(cron(evento, env)),
};

