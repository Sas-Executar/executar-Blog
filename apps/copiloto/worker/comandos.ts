/**
 * Parser determinístico da linguagem de comandos (ADR-015 §4, herdado do ADR-001 do Copiloto).
 * Sem IA: o comando é a primeira linha não vazia do corpo iniciada por "/" (ou o assunto);
 * as linhas seguintes são payload "chave: valor". Anexos nunca são instrução.
 */

export const VERBOS = [
	'urgente',
	'hoje',
	'amanha',
	'fila',
	'%',
	'status-report',
	'feito',
	'ideia',
	'criar-rotina',
	'criar-runbook',
	'criar-workflow',
	'confirmar',
	'cancelar',
	'ajuda',
	'campanha',
] as const;
export type Verbo = (typeof VERBOS)[number];

export const ALIASES: Record<string, Verbo> = { done: 'feito', pct: '%', progresso: '%', report: 'status-report', help: 'ajuda', amanhã: 'amanha' };

export const TIPOS_REPORT = ['72h', 'wiki', 'programa', 'sprint', 'roadmap', 'campanha'] as const;
export const FORMATOS_REPORT = ['html', 'pdf'] as const;
export const ESCOPOS = ['programa', 'sprint', 'area', 'urgente', 'hoje', 'amanha', 'fila', 'campanha'] as const;
const CHAVES_PAYLOAD = ['dod', 'data', 'peso', 'depende', 'evidencia', 'sprint', 'programa', 'formato', 'para', 'epic', 'instancia', 'area'];

export type Referencia = { tipo: 'issue'; numero: number } | { tipo: 'chave'; chave: string } | { tipo: 'titulo'; texto: string };

export interface Comando {
	verbo: Verbo;
	args: Record<string, unknown>;
	payload: Record<string, string>;
	bruto: string;
}

export class ErroComando extends Error {
	codigo: string;
	constructor(codigo: string, mensagem: string) {
		super(mensagem);
		this.codigo = codigo;
	}
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Corpo em texto sem o histórico citado (linhas ">" e tudo após o separador de resposta). */
export function limparCorpo(corpo: string): string {
	const linhas = corpo.replace(/\r\n?/g, '\n').split('\n');
	const fim = linhas.findIndex((l) => /^(-{2,}\s*Original Message|_{5,}|De:\s|From:\s|Em .+ escreveu:|On .+ wrote:)/i.test(l.trim()));
	return (fim >= 0 ? linhas.slice(0, fim) : linhas).filter((l) => !l.trimStart().startsWith('>')).join('\n');
}

/** Localiza o comando no e-mail: primeira linha "/..." do corpo; senão, o assunto. */
export function extrairComando(assunto: string, corpo: string): { linha: string; payload: string[] } | null {
	const linhas = limparCorpo(corpo).split('\n');
	const i = linhas.findIndex((l) => l.trim() !== '');
	if (i >= 0 && linhas[i].trim().startsWith('/')) return { linha: linhas[i].trim(), payload: linhas.slice(i + 1) };
	const a = assunto.replace(/^\s*((re|res|enc|fw|fwd)\s*:\s*)+/i, '').trim();
	if (a.startsWith('/')) return { linha: a, payload: i >= 0 ? linhas.slice(i) : [] };
	return null;
}

/** Divide respeitando aspas: /feito "revisar headline" → ["feito", "revisar headline"]. */
function tokens(linha: string): string[] {
	const out: string[] = [];
	for (const m of linha.matchAll(/"([^"]*)"|(\S+)/g)) out.push(m[1] !== undefined ? `"${m[1]}"` : m[2]);
	return out;
}

export function parseReferencia(t: string): Referencia | null {
	if (/^#\d+$/.test(t)) return { tipo: 'issue', numero: Number(t.slice(1)) };
	if (/^[A-Z][A-Z0-9]{1,9}(-[A-Z0-9]+)*-\d{2,4}$/.test(t)) return { tipo: 'chave', chave: t };
	if (/^".+"$/.test(t)) return { tipo: 'titulo', texto: t.slice(1, -1) };
	return null;
}

function payloadDe(linhas: string[]): Record<string, string> {
	const p: Record<string, string> = {};
	const livre: string[] = [];
	for (const l of linhas) {
		const m = /^\s*([a-zçã]+)\s*:\s*(.*)$/i.exec(l);
		const chave = m && semAcento(m[1].toLowerCase());
		if (chave && CHAVES_PAYLOAD.includes(chave)) p[chave] = m[2].trim();
		else if (l.trim()) livre.push(l.trim());
	}
	if (livre.length) p.descricao = livre.join('\n');
	return p;
}

export function normalizarVerbo(bruto: string): Verbo {
	const v = semAcento(bruto.replace(/^\//, '').toLowerCase());
	const alvo = ALIASES[v] ?? v;
	if ((VERBOS as readonly string[]).includes(alvo)) return alvo as Verbo;
	throw new ErroComando('E-101', `Verbo desconhecido: /${v}. Use /ajuda para ver os comandos.`);
}

export function parseComando(linha: string, payloadLinhas: string[] = []): Comando {
	const [cabeca, ...resto] = tokens(linha.trim());
	if (!cabeca?.startsWith('/')) throw new ErroComando('E-100', 'O comando precisa começar com "/".');
	const verbo = normalizarVerbo(cabeca);
	// Em /criar-* o corpo é a definição (YAML/Markdown) e vai crua; nos demais, linhas "chave: valor".
	const payload = verbo.startsWith('criar-') ? (payloadLinhas.join('\n').trim() ? { descricao: payloadLinhas.join('\n').replace(/^\n+|\s+$/g, '') } : {}) : payloadDe(payloadLinhas);
	const args: Record<string, unknown> = {};
	const exigir = (cond: boolean, uso: string) => {
		if (!cond) throw new ErroComando('E-100', `Uso: ${uso}`);
	};
	switch (verbo) {
		case 'hoje':
		case 'amanha':
		case 'ajuda':
			if (resto[0]) args.alvo = semAcento(resto[0].replace(/^\//, '').toLowerCase());
			break;
		case 'urgente': {
			const refs = resto.map(parseReferencia);
			if (resto.length && refs.every(Boolean)) args.refs = refs;
			else if (resto.length) {
				exigir(resto.length >= 2, '/urgente [#n ...] | /urgente <area> <texto>');
				args.area = resto[0].toLowerCase();
				args.texto = resto.slice(1).join(' ').replace(/"/g, '');
			}
			break;
		}
		case 'fila':
		case 'ideia':
			exigir(resto.length >= 2, `/${verbo} <area> <texto>`);
			args.area = resto[0].toLowerCase();
			args.texto = resto.slice(1).join(' ').replace(/"/g, '');
			break;
		case '%':
			exigir(resto.length >= 1 && (ESCOPOS as readonly string[]).includes(semAcento(resto[0].toLowerCase())), `/% <${ESCOPOS.join('|')}> [alvo]`);
			args.escopo = semAcento(resto[0].toLowerCase());
			if (resto[1]) args.alvo = resto.slice(1).join(' ').replace(/"/g, '');
			break;
		case 'status-report': {
			exigir(resto.length >= 1 && (TIPOS_REPORT as readonly string[]).includes(resto[0].toLowerCase()), `/status-report <${TIPOS_REPORT.join('|')}> [alvo] [html|pdf] [enviar]`);
			args.tipo = resto[0].toLowerCase();
			const fmt = resto.slice(1).find((t) => (FORMATOS_REPORT as readonly string[]).includes(t.toLowerCase()));
			args.formato = (fmt ?? payload.formato ?? 'html').toLowerCase();
			exigir((FORMATOS_REPORT as readonly string[]).includes(args.formato as string), 'formato: html | pdf');
			// "enviar" pede o e-mail de verdade (nunca é leitura pura — ver tipoDoComando abaixo).
			const enviar = resto.slice(1).some((t) => t.toLowerCase() === 'enviar');
			if (enviar) args.enviar = true;
			if (payload.para) args.para = payload.para;
			const alvo = resto.slice(1).filter((t) => t !== fmt && t.toLowerCase() !== 'enviar');
			if (alvo.length) args.alvo = alvo.join(' ').replace(/"/g, '');
			break;
		}
		case 'feito': {
			exigir(resto.length >= 1, '/feito <#n | CHAVE | "título">');
			const ref = parseReferencia(resto[0]) ?? { tipo: 'titulo', texto: resto.join(' ').replace(/"/g, '') };
			args.ref = ref;
			const ev = resto.slice(1).find((t) => /^https?:\/\//.test(t));
			if (ev || payload.evidencia) args.evidencia = ev ?? payload.evidencia;
			break;
		}
		case 'campanha':
			exigir(resto.length >= 1, '/campanha <id-do-workflow> [iniciar|estado|avancar]');
			args.workflow = resto[0];
			args.acao = (resto[1] ?? 'estado').toLowerCase();
			exigir(['iniciar', 'estado', 'avancar'].includes(args.acao as string), '/campanha <id> [iniciar|estado|avancar]');
			break;
		case 'criar-rotina':
		case 'criar-runbook':
		case 'criar-workflow':
			if (resto[0]) args.alvo = resto.join(' ').replace(/"/g, '');
			exigir(Boolean(payload.descricao), `/${verbo} [alvo] + definição nas linhas seguintes`);
			break;
		case 'confirmar':
		case 'cancelar':
			exigir(/^[A-Z0-9]{6}$/i.test(resto[0] ?? ''), `/${verbo} <token de 6 caracteres>`);
			args.token = resto[0].toUpperCase();
			break;
	}
	return { verbo, args, payload, bruto: linha };
}

/** Tipo do comando (tabela de contratos §4.3): define RBAC e se exige confirmação. */
export function tipoDoComando(c: Comando): 'leitura' | 'escrita' | 'geracao' | 'proposta' | 'controle' {
	if (['hoje', 'amanha', '%', 'ajuda'].includes(c.verbo)) return 'leitura';
	if (c.verbo === 'urgente') return c.args.refs || c.args.area ? 'escrita' : 'leitura';
	if (c.verbo === 'campanha') return c.args.acao === 'estado' ? 'leitura' : 'escrita';
	// "enviar" tem efeito externo (envia e-mail de verdade): nunca pode passar pela leitura pré-aprovada.
	if (c.verbo === 'status-report') return c.args.enviar ? 'escrita' : 'geracao';
	if (c.verbo.startsWith('criar-')) return 'proposta';
	if (c.verbo === 'confirmar' || c.verbo === 'cancelar') return 'controle';
	return 'escrita';
}

/** Escrita em lote (> 3 refs) ou que pula estado exige /confirmar <token> (DEC-11). */
export function exigeConfirmacao(c: Comando): boolean {
	return c.verbo === 'urgente' && Array.isArray(c.args.refs) && c.args.refs.length > 3;
}

export const AJUDA: Record<Verbo, string> = {
	urgente: '/urgente — lista urgentes · /urgente #12 #15 — marca · /urgente <area> <texto> — cria tarefa urgente',
	hoje: '/hoje — tarefas com data de hoje, atrasadas e WIP atual',
	amanha: '/amanha — tarefas de amanhã e dependências ainda não prontas',
	fila: '/fila <area> <item> + "dod: ..." — cria tarefa na fila (BACKLOG_VALIDATED)',
	'%': `/% <${ESCOPOS.join('|')}> [alvo] — completude derivada por peso`,
	'status-report': `/status-report <${TIPOS_REPORT.join('|')}> [alvo] [html|pdf] [enviar] — relatório por e-mail`,
	feito: '/feito <#n|CHAVE|"título"> [url de evidência] — DONE só com DoD + evidência + verificação',
	ideia: '/ideia <area> <texto> — registra ideia fora do backlog',
	'criar-rotina': '/criar-rotina + YAML — abre PR em ops/routines/ (o merge aprova)',
	'criar-runbook': '/criar-runbook + Markdown — abre PR em ops/runbooks/',
	'criar-workflow': '/criar-workflow <area> + YAML — abre PR em ops/workflows/',
	confirmar: '/confirmar <token> — executa um plano pendente',
	cancelar: '/cancelar <token> — descarta um plano pendente',
	ajuda: '/ajuda [verbo] — esta ajuda',
	campanha: '/campanha <workflow> [iniciar|estado|avancar] — opera uma campanha (runbook com gates)',
};
