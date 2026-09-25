/**
 * Workflows versionados em ops/workflows/*.yaml (ADR-015, DEC-08): runbook como máquina de
 * estados sequencial de ENTRYPOINTs com gate. Aqui: schema, plano de issues de uma instância
 * (idempotente por task_key) e leitura do estado da campanha a partir das tarefas reais.
 */
import { z } from 'zod';
import { parse as lerYaml } from 'yaml';
import { type Estado, type TaskSpec, type Tarefa, VERIFICACOES, completude, dataLocal } from './dominio.ts';

const Passo = z.object({
	id: z.string().regex(/^\d{2}$/),
	titulo: z.string().min(3),
	dia: z.number().int(),
	peso: z.number().int().min(1).max(13).default(1),
	dod: z.string().min(10),
	verificacao: z.enum(VERIFICACOES).default('manual'),
	pd_clb: z.array(z.string()).optional(),
});

const Entrypoint = z.object({
	id: z.string().regex(/^E\d+$/),
	nome: z.string(),
	sop_kp: z.array(z.string().regex(/^S\d{2}$/)).default([]),
	passos: z.array(Passo).min(1),
	gate: z.object({ titulo: z.string(), verificacao: z.enum(VERIFICACOES), checklist: z.array(z.string()).min(1) }),
});

export const WorkflowSchema = z
	.object({
		id: z.string().regex(/^WF-[A-Z]+-\d{3}$/),
		versao: z.number().int().min(1),
		nome: z.string(),
		area: z.string().regex(/^[a-z0-9-]+$/),
		estado: z.enum(['PROPOSTO', 'ATIVO', 'PAUSADO', 'ARQUIVADO']),
		wip: z.literal(1),
		fontes: z.array(z.string()).default([]),
		entrypoints: z.array(Entrypoint).min(1),
		medicao: z.object({ primarios: z.array(z.string()), secundarios: z.array(z.string()) }).optional(),
		assets: z.record(z.string(), z.number().int().min(0)).optional(),
	})
	.passthrough()
	.superRefine((w, ctx) => {
		const ids = w.entrypoints.map((e) => e.id);
		if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'ENTRYPOINTs com id repetido' });
		w.entrypoints.forEach((e, i) => {
			const passos = e.passos.map((p) => p.id);
			if (new Set(passos).size !== passos.length) ctx.addIssue({ code: 'custom', message: `${e.id}: passos com id repetido` });
			if (e.id !== `E${i + 1}`) ctx.addIssue({ code: 'custom', message: `ENTRYPOINTs fora de ordem: esperado E${i + 1}, veio ${e.id}` });
		});
	});
export type Workflow = z.infer<typeof WorkflowSchema>;

export function lerWorkflow(yaml: string): Workflow {
	return WorkflowSchema.parse(lerYaml(yaml));
}

export interface TarefaPlanejada {
	titulo: string;
	spec: TaskSpec;
	labels: string[];
	estadoInicial: Estado;
	descricao: string;
}

const somarDias = (iso: string, dias: number) => {
	const d = new Date(`${iso}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + dias);
	return d.toISOString().slice(0, 10);
};

/** Chave da instância: prefixo do programa + id curto, ex.: RC-C01 → RC-C01-E1-01, RC-C01-E1-GATE → RC-C01-E1-99. */
export function chave(instancia: string, entrypoint: string, passo: string) {
	return `${instancia}-${entrypoint}-${passo}`;
}

/**
 * Plano de issues de uma campanha: cada passo depende do anterior e o gate do ENTRYPOINT
 * depende de todos os passos dele; o primeiro passo do ENTRYPOINT seguinte depende do gate.
 * Só o primeiro passo nasce READY — o resto fica na fila até as dependências fecharem (WIP=1).
 */
export function planejarInstancia(w: Workflow, opcoes: { instancia: string; lancamento: string; programa: string; command_id?: string }): TarefaPlanejada[] {
	if (!/^[A-Z]{2,5}-[A-Z0-9]{2,6}$/.test(opcoes.instancia)) throw new Error('instância inválida (ex.: RC-C01)');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(opcoes.lancamento)) throw new Error('data de lançamento inválida (AAAA-MM-DD)');
	const plano: TarefaPlanejada[] = [];
	let anterior: string | null = null;
	for (const e of w.entrypoints) {
		const doEntrypoint: string[] = [];
		for (const p of e.passos) {
			const k = chave(opcoes.instancia, e.id, p.id);
			plano.push({
				titulo: `[${e.id}] ${p.titulo}`,
				spec: { task_key: k, area: w.area, program: opcoes.programa, workflow: w.id, etapa: e.id, dod: p.dod, data: somarDias(opcoes.lancamento, p.dia), peso: p.peso, depende: anterior ? [anterior] : [], verificacao: p.verificacao, evidencia: [], origem: { command_id: opcoes.command_id, canal: 'workflow' } },
				labels: ['type/tarefa', `area/${w.area}`, `program/${opcoes.programa}`, `workflow/${w.id.toLowerCase()}`],
				estadoInicial: anterior ? 'BACKLOG_VALIDATED' : 'READY',
				descricao: `${e.nome} · passo ${p.id}${p.pd_clb?.length ? ` · PD-CLB Tarefa ${p.pd_clb.join(', ')}` : ''}${e.sop_kp.length ? ` · SOP-KP-001 ${e.sop_kp.join(', ')}` : ''}`,
			});
			doEntrypoint.push(k);
			anterior = k;
		}
		const g = chave(opcoes.instancia, e.id, '99');
		const diaGate = Math.max(...e.passos.map((p) => p.dia));
		plano.push({
			titulo: `[${e.id}] ${e.gate.titulo}`,
			spec: { task_key: g, area: w.area, program: opcoes.programa, workflow: w.id, etapa: e.id, dod: `Gate: ${e.gate.checklist.join('; ')}.`, data: somarDias(opcoes.lancamento, diaGate), peso: 1, depende: doEntrypoint, verificacao: e.gate.verificacao, evidencia: [], origem: { command_id: opcoes.command_id, canal: 'workflow' } },
			labels: ['type/tarefa', `area/${w.area}`, `program/${opcoes.programa}`, `workflow/${w.id.toLowerCase()}`, 'gate'],
			estadoInicial: 'BACKLOG_VALIDATED',
			descricao: `${e.nome} · gate\n\n${e.gate.checklist.map((c) => `- [ ] ${c}`).join('\n')}`,
		});
		anterior = g;
	}
	return plano;
}

export interface EstadoCampanha {
	workflow: string;
	instancia: string;
	atual: { id: string; nome: string } | null;
	entrypoints: { id: string; nome: string; estado: 'FECHADO' | 'ABERTO' | 'TRAVADO'; progresso: number | null; tarefas: Tarefa[] }[];
	agora: Tarefa | null;
	proxima: Tarefa | null;
	atrasadas: Tarefa[];
	completude: ReturnType<typeof completude>;
}

/** Estado derivado da campanha a partir das tarefas reais (nunca digitado). */
export function estadoDaCampanha(w: Workflow, instancia: string, tarefas: Tarefa[], agora = new Date()): EstadoCampanha {
	const minhas = tarefas.filter((t) => t.spec?.workflow === w.id && t.spec.task_key.startsWith(`${instancia}-`));
	const hoje = dataLocal(agora);
	let atual: EstadoCampanha['atual'] = null;
	const entrypoints = w.entrypoints.map((e) => {
		const doE = minhas.filter((t) => t.spec?.etapa === e.id).sort((a, b) => a.spec!.task_key.localeCompare(b.spec!.task_key));
		const gate = doE.find((t) => t.spec!.task_key.endsWith('-99'));
		const fechado = gate?.estado === 'DONE';
		if (!fechado && !atual) atual = { id: e.id, nome: e.nome };
		const estado: 'FECHADO' | 'ABERTO' | 'TRAVADO' = fechado ? 'FECHADO' : atual?.id === e.id ? 'ABERTO' : 'TRAVADO';
		return { id: e.id, nome: e.nome, estado, progresso: completude(doE).percentual, tarefas: doE };
	});
	const ordenadas = entrypoints.flatMap((e) => e.tarefas);
	const agoraT = ordenadas.find((t) => t.estado === 'DOING') ?? ordenadas.find((t) => t.estado === 'VERIFY') ?? ordenadas.find((t) => t.estado === 'READY') ?? null;
	const idx = agoraT ? ordenadas.indexOf(agoraT) : -1;
	return {
		workflow: w.id,
		instancia,
		atual,
		entrypoints,
		agora: agoraT,
		proxima: idx >= 0 ? (ordenadas.slice(idx + 1).find((t) => t.estado !== 'DONE' && t.estado !== 'CANCELADO') ?? null) : null,
		atrasadas: ordenadas.filter((t) => t.spec?.data && t.spec.data < hoje && t.estado !== 'DONE' && t.estado !== 'CANCELADO'),
		completude: completude(minhas),
	};
}

/** Vista 1 do painel (máquina de estados) gerada do estado real, não digitada. */
export function mermaidEstados(ec: EstadoCampanha): string {
	const linhas = ['stateDiagram-v2', `  [*] --> ${ec.entrypoints[0]?.id ?? 'E1'}`];
	ec.entrypoints.forEach((e, i) => {
		linhas.push(`  ${e.id}: ${e.id} ${e.nome} (${e.estado.toLowerCase()}${e.progresso === null ? '' : `, ${e.progresso}%`})`);
		linhas.push(i < ec.entrypoints.length - 1 ? `  ${e.id} --> ${ec.entrypoints[i + 1].id}: gate DONE` : `  ${e.id} --> [*]`);
	});
	return linhas.join('\n');
}

/** Vista 3 (linha do tempo) a partir das datas dos task-specs. */
export function mermaidGantt(ec: EstadoCampanha): string {
	const linhas = ['gantt', `  title ${ec.workflow} · ${ec.instancia}`, '  dateFormat YYYY-MM-DD'];
	for (const e of ec.entrypoints) {
		linhas.push(`  section ${e.id} ${e.nome.replace(/[:#]/g, '')}`);
		for (const t of e.tarefas) {
			if (!t.spec?.data) continue;
			const marca = t.estado === 'DONE' ? 'done, ' : t.estado === 'DOING' || t.estado === 'VERIFY' ? 'active, ' : '';
			linhas.push(`  ${t.titulo.replace(/^\[E\d+\]\s*/, '').replace(/[:#]/g, '')} :${marca}${t.spec.data}, 1d`);
		}
	}
	return linhas.join('\n');
}
