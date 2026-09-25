/**
 * GitHubAdapter do domínio (ADR-015, DEC-01): única porta de escrita no System of Record.
 * Tarefas = issues com labels `state/*` exclusivas e bloco task-spec. Reusa o cliente do Studio
 * (GitHub App/token só em secrets do Worker) apontado para o repositório operacional.
 */
import { GitHub } from '../../studio/worker/github.ts';
import { type Estado, type TaskSpec, type Tarefa, ESTADOS, ROTULO, comTaskSpec, estadoDasLabels, labelDoEstado, lerTaskSpec, transicaoLegal } from './dominio.ts';

export interface EnvTarefas {
	OPS_REPO: string; // "Sas-Executar/Copiloto"
	GITHUB_APP_ID?: string;
	GITHUB_APP_PRIVATE_KEY?: string;
	GITHUB_INSTALLATION_ID?: string;
	GITHUB_TOKEN?: string;
	GITHUB_API?: string;
}

type IssueApi = { number: number; id: number; title: string; body: string | null; state: string; html_url: string; labels: ({ name: string } | string)[]; pull_request?: unknown };

export class ErroTransicao extends Error {
	codigo: string;
	constructor(codigo: string, mensagem: string) {
		super(mensagem);
		this.codigo = codigo;
	}
}

const nomes = (labels: IssueApi['labels']) => labels.map((l) => (typeof l === 'string' ? l : l.name));

export function tarefaDaIssue(i: IssueApi): Tarefa {
	const labels = nomes(i.labels);
	return {
		numero: i.number,
		titulo: i.title,
		estado: estadoDasLabels(labels),
		spec: lerTaskSpec(i.body),
		labels,
		url: i.html_url,
		tipo: labels.includes('type/ideia') ? 'ideia' : labels.includes('type/editorial') ? 'editorial' : 'tarefa',
	};
}

const rodape = (commandId?: string) => (commandId ? `\n\n<!-- cmd:${commandId} -->` : '');

export class Tarefas {
	gh: GitHub;
	constructor(env: EnvTarefas, buscar: typeof fetch = fetch) {
		this.gh = new GitHub({ ...env, GITHUB_REPO: env.OPS_REPO }, buscar);
	}

	/** Todas as issues operacionais (tarefas, ideias, editoriais), abertas e fechadas. */
	async listar(): Promise<Tarefa[]> {
		const out: Tarefa[] = [];
		for (const tipo of ['type/tarefa', 'type/ideia', 'type/editorial']) {
			for (let pagina = 1; pagina <= 20; pagina++) {
				const lote = await this.gh.api<IssueApi[]>(`/issues?state=all&labels=${encodeURIComponent(tipo)}&per_page=100&page=${pagina}`);
				out.push(...lote.filter((i) => !i.pull_request).map(tarefaDaIssue));
				if (lote.length < 100) break;
			}
		}
		return out;
	}

	async ler(numero: number): Promise<Tarefa & { id: number; corpo: string }> {
		const i = await this.gh.api<IssueApi>(`/issues/${numero}`);
		return { ...tarefaDaIssue(i), id: i.id, corpo: i.body ?? '' };
	}

	/** Garante as labels fechadas `state/*` e as de tipo (422 = já existe). */
	async garantirLabels(extras: string[] = []) {
		const cores: Record<string, string> = { backlog_validated: 'c5c5c5', ready: '1f93ff', doing: '00bf63', verify: 'b45309', done: '007a45', blocked: 'dc2626', cancelado: '646363' };
		const todas = [...ESTADOS.map((e) => ({ name: labelDoEstado(e), color: cores[e.toLowerCase()], description: ROTULO[e] })), ...['type/tarefa', 'type/ideia', 'type/editorial', 'priority/urgente', 'gate', ...extras].map((name) => ({ name, color: 'eaeaea', description: '' }))];
		for (const l of todas) {
			try {
				await this.gh.api('/labels', { method: 'POST', body: JSON.stringify(l) });
			} catch (e) {
				if (!(e instanceof Error && /HTTP 422/.test(e.message))) throw e;
			}
		}
	}

	/** Cria a tarefa se a task_key ainda não existe (idempotência por marcador no corpo). */
	async criar(p: { titulo: string; spec: TaskSpec; labels: string[]; estado: Estado; descricao?: string; epic?: number; commandId?: string }, existentes?: Tarefa[]): Promise<{ numero: number; url: string; criada: boolean }> {
		const lista = existentes ?? (await this.listar());
		const ja = lista.find((t) => t.spec?.task_key === p.spec.task_key);
		if (ja) return { numero: ja.numero, url: ja.url ?? '', criada: false };
		const corpo = comTaskSpec(`${p.descricao ?? ''}\n\n<!-- idem:${p.spec.task_key} -->${rodape(p.commandId)}`, p.spec);
		const i = await this.gh.api<IssueApi>('/issues', { method: 'POST', body: JSON.stringify({ title: p.titulo, body: corpo, labels: [...new Set([...p.labels, labelDoEstado(p.estado)])] }) });
		if (p.epic) {
			try {
				await this.gh.api(`/issues/${p.epic}/sub_issues`, { method: 'POST', body: JSON.stringify({ sub_issue_id: i.id }) });
			} catch {
				// Vínculo ao Epic é organizacional: a tarefa existe mesmo se o vínculo falhar (reconciliador tenta de novo).
			}
		}
		return { numero: i.number, url: i.html_url, criada: true };
	}

	/**
	 * Transição compare-and-set (§5.7): se já está em `para`, sucesso sem efeito; se não está em
	 * `de`, conflito E-301. DONE fecha como concluída; CANCELADO fecha como não planejada.
	 */
	async transicionar(numero: number, de: Estado, para: Estado, commandId?: string, motivo?: string): Promise<'aplicada' | 'sem-efeito'> {
		const atual = await this.ler(numero);
		if (atual.estado === para) return 'sem-efeito';
		if (atual.estado !== de) throw new ErroTransicao('E-301', `#${numero} está em ${atual.estado ? ROTULO[atual.estado] : 'estado inválido'}, não em ${ROTULO[de]}.`);
		if (!transicaoLegal(de, para)) throw new ErroTransicao('E-301', `Transição ilegal: ${ROTULO[de]} → ${ROTULO[para]}.`);
		const labels = [...atual.labels.filter((l) => !l.startsWith('state/')), labelDoEstado(para)];
		const fechar = para === 'DONE' ? { state: 'closed', state_reason: 'completed' } : para === 'CANCELADO' ? { state: 'closed', state_reason: 'not_planned' } : {};
		await this.gh.api(`/issues/${numero}`, { method: 'PATCH', body: JSON.stringify({ labels, ...fechar }) });
		await this.comentar(numero, `**${ROTULO[de]} → ${ROTULO[para]}**${motivo ? `\n\n${motivo}` : ''}`, commandId);
		return 'aplicada';
	}

	async comentar(numero: number, texto: string, commandId?: string) {
		await this.gh.api(`/issues/${numero}/comments`, { method: 'POST', body: JSON.stringify({ body: texto + rodape(commandId) }) });
	}

	async atualizarSpec(numero: number, spec: TaskSpec) {
		const atual = await this.ler(numero);
		await this.gh.api(`/issues/${numero}`, { method: 'PATCH', body: JSON.stringify({ body: comTaskSpec(atual.corpo, spec) }) });
	}

	async adicionarLabel(numero: number, label: string) {
		await this.gh.api(`/issues/${numero}/labels`, { method: 'POST', body: JSON.stringify({ labels: [label] }) });
	}
}

/** Resolve "#n", CHAVE ou "título" (§4.6): 1 resultado → ok; 2–5 → candidatos; 0 ou > 5 → E-202. */
export function resolverReferencia(ref: { tipo: 'issue'; numero: number } | { tipo: 'chave'; chave: string } | { tipo: 'titulo'; texto: string }, tarefas: Tarefa[]): { tarefa: Tarefa } | { candidatos: Tarefa[] } | { erro: string; codigo: 'E-201' | 'E-202' } {
	if (ref.tipo === 'issue') {
		const t = tarefas.find((x) => x.numero === ref.numero);
		return t ? { tarefa: t } : { erro: `Issue #${ref.numero} não encontrada no repositório operacional.`, codigo: 'E-201' };
	}
	if (ref.tipo === 'chave') {
		const t = tarefas.find((x) => x.spec?.task_key === ref.chave);
		return t ? { tarefa: t } : { erro: `Chave ${ref.chave} não encontrada.`, codigo: 'E-201' };
	}
	const alvo = ref.texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
	const prioridade = (t: Tarefa) => (t.estado === 'DOING' ? 0 : t.estado === 'VERIFY' ? 1 : 2);
	const achadas = tarefas
		.filter((t) => t.estado !== 'DONE' && t.estado !== 'CANCELADO' && t.titulo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(alvo))
		.sort((a, b) => prioridade(a) - prioridade(b));
	if (achadas.length === 1) return { tarefa: achadas[0] };
	if (achadas.length >= 2 && achadas.length <= 5) return { candidatos: achadas };
	return { erro: achadas.length ? `"${ref.texto}" corresponde a ${achadas.length} tarefas; seja mais específico.` : `Nenhuma tarefa aberta com "${ref.texto}".`, codigo: 'E-202' };
}
