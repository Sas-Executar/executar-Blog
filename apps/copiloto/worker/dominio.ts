/**
 * Domínio operacional (ADR-015 §5): estados canônicos do EXECUTAR como labels exclusivas
 * `state/*`, bloco `task-spec` no corpo do issue, conclusão com DoD + evidência + verificação,
 * completude derivada por peso e datas resolvidas em America/Sao_Paulo.
 */
import { parse as lerYaml, stringify as escreverYaml } from 'yaml';

export const ESTADOS = ['BACKLOG_VALIDATED', 'READY', 'DOING', 'VERIFY', 'DONE', 'BLOCKED', 'CANCELADO'] as const;
export type Estado = (typeof ESTADOS)[number];

export const ROTULO: Record<Estado, string> = {
	BACKLOG_VALIDATED: 'Na fila',
	READY: 'Pronta',
	DOING: 'Fazendo',
	VERIFY: 'Verificando',
	DONE: 'Concluída',
	BLOCKED: 'Bloqueada',
	CANCELADO: 'Cancelada',
};

export const labelDoEstado = (e: Estado) => `state/${e.toLowerCase()}`;
export function estadoDasLabels(labels: string[]): Estado | null {
	const s = labels.filter((l) => l.startsWith('state/')).map((l) => l.slice(6).toUpperCase());
	return s.length === 1 && (ESTADOS as readonly string[]).includes(s[0]) ? (s[0] as Estado) : null;
}

/** Transições legais (máquina de estados §5.2). */
const LEGAIS: Record<Estado, Estado[]> = {
	BACKLOG_VALIDATED: ['READY', 'BLOCKED', 'CANCELADO'],
	READY: ['DOING', 'BLOCKED', 'CANCELADO'],
	DOING: ['VERIFY', 'DONE', 'BLOCKED'],
	VERIFY: ['DONE', 'DOING'],
	BLOCKED: ['READY'],
	DONE: [],
	CANCELADO: [],
};
export const transicaoLegal = (de: Estado, para: Estado) => LEGAIS[de].includes(para);

export const VERIFICACOES = ['link_valido', 'pr_mergeado', 'manual'] as const;
export type Verificacao = (typeof VERIFICACOES)[number];

export interface TaskSpec {
	task_key: string;
	area: string;
	program?: string;
	workflow?: string;
	etapa?: string;
	dod: string;
	data?: string; // AAAA-MM-DD, absoluta
	peso: number;
	depende: string[];
	verificacao: Verificacao;
	evidencia: string[];
	origem?: { command_id?: string; canal?: string };
}

const INICIO = '<!-- task-spec:v1 -->';
const FIM = '<!-- /task-spec -->';

export function lerTaskSpec(corpo: string | null | undefined): TaskSpec | null {
	if (!corpo) return null;
	const i = corpo.indexOf(INICIO);
	const f = corpo.indexOf(FIM);
	if (i < 0 || f < i) return null;
	const bloco = corpo.slice(i + INICIO.length, f).replace(/^\s*```ya?ml\s*\n/, '').replace(/\n\s*```\s*$/, '');
	const d = lerYaml(bloco) as Partial<TaskSpec> | null;
	if (!d?.task_key) return null;
	return {
		task_key: String(d.task_key),
		area: String(d.area ?? ''),
		program: d.program ? String(d.program) : undefined,
		workflow: d.workflow ? String(d.workflow) : undefined,
		etapa: d.etapa ? String(d.etapa) : undefined,
		dod: String(d.dod ?? ''),
		data: d.data ? String((d.data as unknown) instanceof Date ? (d.data as unknown as Date).toISOString().slice(0, 10) : d.data) : undefined,
		peso: Number(d.peso ?? 1) || 1,
		depende: Array.isArray(d.depende) ? d.depende.map(String) : [],
		verificacao: (VERIFICACOES as readonly string[]).includes(String(d.verificacao)) ? (d.verificacao as Verificacao) : 'manual',
		evidencia: Array.isArray(d.evidencia) ? d.evidencia.map(String) : [],
		origem: d.origem,
	};
}

export function blocoTaskSpec(spec: TaskSpec): string {
	const limpo = Object.fromEntries(Object.entries(spec).filter(([, v]) => v !== undefined));
	return `${INICIO}\n\`\`\`yaml\n${escreverYaml(limpo).trimEnd()}\n\`\`\`\n${FIM}`;
}

/** Substitui (ou acrescenta) o bloco task-spec preservando a descrição livre. */
export function comTaskSpec(corpo: string, spec: TaskSpec): string {
	const i = corpo.indexOf(INICIO);
	const f = corpo.indexOf(FIM);
	if (i >= 0 && f > i) return corpo.slice(0, i) + blocoTaskSpec(spec) + corpo.slice(f + FIM.length);
	return `${blocoTaskSpec(spec)}\n\n${corpo}`.trimEnd();
}

export type ResultadoFeito =
	| { acao: 'DONE' }
	| { acao: 'VERIFY'; motivo: string }
	| { acao: 'IDEMPOTENTE' }
	| { acao: 'ERRO'; codigo: 'E-301' | 'E-302'; mensagem: string };

/** Regra do /feito (§4.6): DONE = DoD + evidência + verificação. */
export function decidirFeito(estado: Estado, spec: TaskSpec, evidencia: string[]): ResultadoFeito {
	if (estado === 'DONE') return { acao: 'IDEMPOTENTE' };
	if (estado === 'BLOCKED') return { acao: 'ERRO', codigo: 'E-302', mensagem: 'Tarefa bloqueada: desbloqueie antes de concluir.' };
	if (estado === 'CANCELADO' || estado === 'READY' || estado === 'BACKLOG_VALIDATED')
		return { acao: 'ERRO', codigo: 'E-301', mensagem: `Transição ilegal: ${ROTULO[estado]} → Concluída. Caminho legal: Pronta → Fazendo → Concluída.` };
	if (!spec.dod.trim()) return { acao: 'VERIFY', motivo: 'Sem DoD registrado: defina o critério de pronto.' };
	if (!evidencia.length) return { acao: 'VERIFY', motivo: 'Sem evidência: responda com o link ou anexo que prova a entrega.' };
	if (spec.verificacao === 'manual') return { acao: 'VERIFY', motivo: 'Verificação manual pendente.' };
	if (spec.verificacao === 'link_valido' && !evidencia.some((e) => /^https:\/\/\S+$/.test(e))) return { acao: 'VERIFY', motivo: 'A verificação exige um link https válido.' };
	if (spec.verificacao === 'pr_mergeado' && !evidencia.some((e) => /\/pull\/\d+/.test(e))) return { acao: 'VERIFY', motivo: 'A verificação exige o link do PR mergeado.' };
	return { acao: 'DONE' };
}

export interface Tarefa {
	numero: number;
	titulo: string;
	estado: Estado | null;
	spec: TaskSpec | null;
	labels: string[];
	url?: string;
	tipo?: 'tarefa' | 'ideia' | 'editorial';
}

/** Completude derivada (§4.6): Σ peso DONE / Σ peso ≠ CANCELADO; ideias fora; vazio → null. */
export function completude(tarefas: Tarefa[]) {
	const validas = tarefas.filter((t) => t.tipo !== 'ideia' && t.estado && t.estado !== 'CANCELADO');
	const contagem = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<Estado, number>;
	for (const t of tarefas) if (t.estado && t.tipo !== 'ideia') contagem[t.estado]++;
	const peso = (t: Tarefa) => t.spec?.peso ?? 1;
	const total = validas.reduce((s, t) => s + peso(t), 0);
	const feito = validas.filter((t) => t.estado === 'DONE').reduce((s, t) => s + peso(t), 0);
	return { percentual: total ? Math.round((feito / total) * 1000) / 10 : null, feito, total, contagem };
}

export function barra(percentual: number | null, largura = 16): string {
	if (percentual === null) return 'sem itens';
	const cheio = Math.round((percentual / 100) * largura);
	return `[${'█'.repeat(cheio)}${'░'.repeat(largura - cheio)}] ${percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} %`;
}

export const FUSO = 'America/Sao_Paulo';

/** Data civil (AAAA-MM-DD) em America/Sao_Paulo, com deslocamento em dias. */
export function dataLocal(agora: Date = new Date(), dias = 0): string {
	const p = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
	if (!dias) return p;
	const d = new Date(`${p}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + dias);
	return d.toISOString().slice(0, 10);
}

/** Dependências que ainda não estão DONE (bloqueiam READY). */
export function dependenciasAbertas(t: Tarefa, porChave: Map<string, Tarefa>): string[] {
	return (t.spec?.depende ?? []).filter((k) => porChave.get(k)?.estado !== 'DONE');
}

/** Tarefas da fila cujas dependências fecharam: promovem BACKLOG_VALIDATED → READY. */
export function promoviveis(tarefas: Tarefa[]): Tarefa[] {
	const porChave = new Map(tarefas.filter((t) => t.spec).map((t) => [t.spec!.task_key, t]));
	return tarefas.filter((t) => t.estado === 'BACKLOG_VALIDATED' && t.spec?.dod && dependenciasAbertas(t, porChave).length === 0);
}
