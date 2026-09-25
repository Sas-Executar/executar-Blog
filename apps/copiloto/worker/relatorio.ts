/**
 * Status report por e-mail (ADR-015, DEC-14): snapshot do GitHub → JSON canônico
 * EXECUTAR_STATUS_REPORT_V1 (determinístico, com proveniência) → HTML pelos templates imutáveis da
 * skill executar-relatorios (sincronizados por scripts/sync-report-assets.mjs). Mesma regra de
 * preenchimento de skills/SK-04-executar-relatorios/scripts/render_report.py (teste de paridade).
 * Números nunca vêm do LLM.
 */
import { REPORT_CSS, TEMPLATE_EMAIL, TEMPLATE_IMPRESSAO, TOKENS_CSS } from './relatorio-assets.gen.ts';
import { type Tarefa, ESTADOS, ROTULO, completude, dataLocal } from './dominio.ts';
import type { EstadoCampanha } from './workflow.ts';

export const FALTANDO = 'Não identificado no documento';
const PROPS = ['context', 'problem', 'process', 'progress', 'step_1', 'step_2', 'step_3', 'risk', 'prevention', 'delivery'] as const;

export interface RelatorioV1 {
	meta: { title: string; kicker: string; schema: 'EXECUTAR_STATUS_REPORT_V1'; status: string; date: string | null; source_count: number };
	progress: { overall_percent: number | null; cycle_current: number | null; cycle_total: number | null; today_percent: number | null };
	depth: { project: string; cycle: string; today: string; task: string; action: string };
	triptych: Record<'yesterday' | 'today' | 'tomorrow', { title: string; state: string; percent: number | null }>;
	now: { title: string; meta: string; chip: string };
	properties: Record<(typeof PROPS)[number], string>;
	tags: { focus: string[]; state: string[]; origin: string[] };
	trace?: string;
	provenance: { sources: { id: string; name: string; type: string }[]; field_map: Record<string, { source_id: string; evidence: string }[]> };
	quality: { conflicts: string[]; warnings: string[]; missing_fields: string[] };
}

// ---------- preenchimento (paridade com render_report.py) ----------
const escapar = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

export function pct(v: number | null): string {
	if (v === null || v === undefined) return '—';
	return Number.isInteger(v) ? `${v}%` : `${Number(v.toPrecision(6))}%`;
}
const ciclo = (c: number | null, t: number | null) => (c === null || t === null ? '—' : `${String(c).padStart(2, '0')} / ${String(t).padStart(2, '0')}`);
const tagsHtml = (itens: string[], cls: string) => itens.map((x) => `<span class="${cls}">${escapar(String(x))}</span>`).join('') || `<span class="${cls}">—</span>`;

export function placeholders(d: RelatorioV1): Record<string, string> {
	const { meta: m, progress: p, depth: dp, triptych: t, now: n, properties: pr, tags } = d;
	const out: Record<string, string> = {
		TITLE: m.title,
		KICKER: m.kicker,
		SCHEMA: m.schema,
		STATUS: m.status,
		DATE: m.date || 'não identificada',
		PCT_OVERALL: pct(p.overall_percent),
		CYCLE: ciclo(p.cycle_current, p.cycle_total),
		PCT_TODAY: pct(p.today_percent),
		PROGRESS_WIDTH: String(Math.round(Math.max(0, Math.min(100, p.overall_percent || 0)))),
		DEPTH_PROJECT: dp.project,
		DEPTH_CYCLE: dp.cycle,
		DEPTH_TODAY: dp.today,
		DEPTH_TASK: dp.task,
		DEPTH_ACTION: dp.action,
		NOW_TITLE: n.title,
		NOW_META: n.meta,
		NOW_CHIP: n.chip,
		TRACE: d.trace || `fontes: ${m.source_count}`,
		PREHEADER: `${pct(p.overall_percent)} concluído · agora: ${n.title}`,
	};
	for (const [k, rot] of [['yesterday', 'YESTERDAY'], ['today', 'TODAY'], ['tomorrow', 'TOMORROW']] as const) {
		out[`TRI_${rot}_PCT`] = pct(t[k].percent);
		out[`TRI_${rot}_TITLE`] = t[k].title;
		out[`TRI_${rot}_STATE`] = t[k].state;
	}
	for (const k of PROPS) out[`PROP_${k.toUpperCase()}`] = pr[k];
	out.TAGS_FOCUS_HTML = tagsHtml(tags.focus, 'tag-brand');
	out.TAGS_STATE_HTML = tagsHtml(tags.state, 'tag-brand');
	out.TAGS_ORIGIN_HTML = tagsHtml(tags.origin, 'tag-neutral');
	return out;
}

export function preencher(template: string, valores: Record<string, string>): string {
	const faltando = [...new Set([...template.matchAll(/{{([A-Z0-9_]+)}}/g)].map((x) => x[1]))].filter((k) => !(k in valores)).sort();
	if (faltando.length) throw new Error(`placeholders sem valor: ${faltando.join(', ')}`);
	return template.replace(/{{([A-Z0-9_]+)}}/g, (_, k: string) => (k === 'STYLE' || k.endsWith('_HTML') ? valores[k] : escapar(String(valores[k]))));
}

export const htmlImpressao = (d: RelatorioV1) => preencher(TEMPLATE_IMPRESSAO, { ...placeholders(d), STYLE: `${TOKENS_CSS}\n${REPORT_CSS}` });
export const htmlEmail = (d: RelatorioV1) => preencher(TEMPLATE_EMAIL, placeholders(d));

/** Parte text/plain (regra 7 do perfil e-mail): os mesmos números, sem HTML. */
export function textoPlano(d: RelatorioV1): string {
	const p = d.properties;
	return [
		`${d.meta.kicker} — ${d.meta.title}`,
		`status: ${d.meta.status} · data: ${d.meta.date ?? 'não identificada'}`,
		'',
		`Progresso: ${pct(d.progress.overall_percent)} concluído · ciclo ${ciclo(d.progress.cycle_current, d.progress.cycle_total)} · hoje ${pct(d.progress.today_percent)}`,
		`Ontem: ${d.triptych.yesterday.title} (${d.triptych.yesterday.state})`,
		`Hoje: ${d.triptych.today.title} (${d.triptych.today.state})`,
		`Amanhã: ${d.triptych.tomorrow.title} (${d.triptych.tomorrow.state})`,
		'',
		`AGORA: ${d.now.title} — ${d.now.meta}`,
		'',
		`Problema: ${p.problem}`,
		`Progresso: ${p.progress}`,
		`Próximos: 1. ${p.step_1} 2. ${p.step_2} 3. ${p.step_3}`,
		`Risco: ${p.risk}`,
		'',
		`${d.meta.schema} · ${d.trace ?? ''}`,
	].join('\n');
}

// ---------- snapshot → JSON canônico ----------
const resumoDia = (ts: Tarefa[], rotuloVazio: string) => {
	if (!ts.length) return { title: rotuloVazio, state: 'sem tarefas com data', percent: null };
	const c = completude(ts);
	const abertas = ts.filter((t) => t.estado !== 'DONE' && t.estado !== 'CANCELADO');
	return {
		title: abertas.length ? abertas[0].titulo : ts[0].titulo,
		state: `${c.contagem.DONE} de ${ts.length - c.contagem.CANCELADO} concluídas`,
		percent: c.percentual,
	};
};

export function montarRelatorio(o: {
	tipo: string;
	titulo: string;
	tarefas: Tarefa[];
	fonte: string;
	agora?: Date;
	campanha?: EstadoCampanha;
	commit?: string;
}): RelatorioV1 {
	const agora = o.agora ?? new Date();
	const [ontem, hoje, amanha] = [dataLocal(agora, -1), dataLocal(agora), dataLocal(agora, 1)];
	const ts = o.tarefas.filter((t) => t.tipo !== 'ideia');
	const doDia = (d: string) => ts.filter((t) => t.spec?.data === d);
	const geral = completude(ts);
	const deHoje = completude(doDia(hoje));
	const abertas = ts.filter((t) => t.estado && !['DONE', 'CANCELADO'].includes(t.estado));
	const ordem = (t: Tarefa) => ['DOING', 'VERIFY', 'READY', 'BLOCKED', 'BACKLOG_VALIDATED'].indexOf(t.estado ?? '');
	const fila = [...abertas].sort((a, b) => ordem(a) - ordem(b) || (a.spec?.data ?? '9').localeCompare(b.spec?.data ?? '9'));
	const agoraT = o.campanha?.agora ?? fila[0] ?? null;
	const proximas = fila.filter((t) => t !== agoraT).slice(0, 3);
	const bloqueadas = ts.filter((t) => t.estado === 'BLOCKED');
	const atrasadas = o.campanha?.atrasadas ?? ts.filter((t) => t.spec?.data && t.spec.data < hoje && t.estado && !['DONE', 'CANCELADO'].includes(t.estado));
	const cc = o.campanha;
	const iAtual = cc?.atual ? cc.entrypoints.findIndex((e) => e.id === cc.atual!.id) + 1 : cc ? cc.entrypoints.length : null;
	const epAtual = cc?.atual ? cc.entrypoints.find((e) => e.id === cc.atual!.id) : null;
	const contagem = ESTADOS.filter((e) => geral.contagem[e]).map((e) => `${ROTULO[e]} ${geral.contagem[e]}`).join(' · ');
	const fonte = 'S01';
	const ev = (texto: string) => [{ source_id: fonte, evidence: texto }];

	const props: RelatorioV1['properties'] = {
		context: cc ? `${cc.workflow} · instância ${cc.instancia} · ENTRYPOINT atual: ${cc.atual ? `${cc.atual.id} ${cc.atual.nome}` : 'todos fechados'}.` : `${o.titulo}: ${ts.length} tarefas no escopo.`,
		problem: bloqueadas.length ? `${bloqueadas.length} bloqueada(s): ${bloqueadas.slice(0, 3).map((t) => t.titulo).join('; ')}.` : atrasadas.length ? `${atrasadas.length} tarefa(s) atrasada(s).` : 'Sem bloqueios nem atrasos registrados.',
		process: cc ? 'Sequência de ENTRYPOINTs com gate: o próximo só abre com o gate anterior DONE (WIP = 1).' : 'Estado derivado das issues do GitHub (labels state/* e task-spec).',
		progress: contagem || FALTANDO,
		step_1: proximas[0]?.titulo ?? FALTANDO,
		step_2: proximas[1]?.titulo ?? FALTANDO,
		step_3: proximas[2]?.titulo ?? FALTANDO,
		risk: atrasadas.length ? `Atrasadas: ${atrasadas.slice(0, 3).map((t) => `${t.titulo} (${t.spec?.data})`).join('; ')}.` : 'Nenhuma tarefa com data vencida.',
		prevention: atrasadas.length || bloqueadas.length ? 'Resolver atrasos e bloqueios antes de abrir nova frente (WIP = 1).' : 'Manter WIP = 1 e fechar cada tarefa com evidência.',
		delivery: cc?.atual ? `Fechar o gate de ${cc.atual.id} (${cc.atual.nome}).` : cc ? 'Ciclo fechado.' : FALTANDO,
	};
	const field_map: RelatorioV1['provenance']['field_map'] = {};
	for (const [k, v] of Object.entries(props)) if (v !== FALTANDO) field_map[`properties.${k}`] = ev(`derivado de ${o.fonte}`);
	if (agoraT) field_map['now.title'] = ev(`#${agoraT.numero} ${agoraT.titulo}`);
	field_map['progress.overall_percent'] = ev(`Σ peso DONE / Σ peso ≠ CANCELADO = ${geral.feito}/${geral.total}`);

	return {
		meta: { title: o.titulo, kicker: 'EXECUTAR / STATUS REPORT', schema: 'EXECUTAR_STATUS_REPORT_V1', status: cc ? (cc.atual ? 'em andamento' : 'concluído') : 'ativo', date: hoje, source_count: 1 },
		progress: { overall_percent: geral.percentual, cycle_current: iAtual, cycle_total: cc ? cc.entrypoints.length : null, today_percent: deHoje.percentual },
		depth: {
			project: pct(geral.percentual),
			cycle: epAtual ? pct(epAtual.progresso) : '—',
			today: pct(deHoje.percentual),
			task: agoraT?.estado ? ROTULO[agoraT.estado] : '—',
			action: agoraT ? 'agora' : '—',
		},
		triptych: { yesterday: resumoDia(doDia(ontem), 'Sem tarefas ontem'), today: resumoDia(doDia(hoje), 'Sem tarefas hoje'), tomorrow: resumoDia(doDia(amanha), 'Sem tarefas amanhã') },
		now: agoraT
			? { title: agoraT.titulo, meta: [agoraT.spec?.data ? `Data ${agoraT.spec.data}` : null, agoraT.spec?.task_key, `#${agoraT.numero}`].filter(Boolean).join(' · '), chip: agoraT.estado ? ROTULO[agoraT.estado] : 'próxima ação' }
			: { title: 'Nenhuma tarefa aberta', meta: 'Fila vazia no escopo', chip: '—' },
		properties: props,
		tags: { focus: [o.tipo], state: [pct(geral.percentual), ...(cc?.atual ? [cc.atual.id.toLowerCase()] : [])], origin: ['github'] },
		trace: `fonte: ${o.fonte}${o.commit ? ` @ ${o.commit.slice(0, 7)}` : ''} · tokens EXECUTAR-REPORT-PRINT-DS-001`,
		provenance: { sources: [{ id: fonte, name: o.fonte, type: 'github' }], field_map },
		quality: { conflicts: [], warnings: ts.some((t) => !t.estado) ? ['Há issues sem exatamente um state/*; o reconciliador corrige.'] : [], missing_fields: Object.entries(props).filter(([, v]) => v === FALTANDO).map(([k]) => `properties.${k}`) },
	};
}

/** Nome de arquivo do relatório versionado (reports/AAAA/MM/…). */
export function caminhoRelatorio(tipo: string, data: string, ext: 'json' | 'html') {
	return `reports/${data.slice(0, 4)}/${data.slice(5, 7)}/${data}-status-${tipo.replace(/[^a-z0-9-]/gi, '')}.${ext}`;
}
