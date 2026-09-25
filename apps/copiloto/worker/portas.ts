/**
 * Portas compartilhadas entre as duas entradas do Copiloto Operacional (ADR-015/ADR-016):
 * o Worker Cloudflare (e-mail + cron) e o plugin do Claude Code (comandos + MCP stdio).
 * Nada aqui depende de Cloudflare: só GitHub REST (fetch) e as regras de domínio.
 */
import { GitHub } from '../../studio/worker/github.ts';
import { base64 } from './adaptadores.ts';
import { type Estado, type Tarefa, ESTADOS, ROTULO, completude, decidirFeito, estadoDasLabels, lerTaskSpec, promoviveis, transicaoLegal } from './dominio.ts';
import type { PortaDefinicoes } from './servico.ts';
import type { EnvTarefas, Tarefas } from './tarefas.ts';

export interface EnvDefinicoes extends Omit<EnvTarefas, 'OPS_REPO'> {
	BLOG_REPO: string; // onde vivem as definições ops/** (PR + merge humano)
}

/** Definições versionadas (ops/**): só a `main` vale (DEC-08); propostas viram PR. */
export function definicoesGithub(env: EnvDefinicoes, buscar: typeof fetch = fetch): PortaDefinicoes {
	const gh = new GitHub({ ...env, GITHUB_REPO: env.BLOG_REPO, GITHUB_BRANCH: 'main' }, buscar);
	return {
		async lerOps(caminho) {
			if (!/^ops\/[a-z0-9/_.-]+$/i.test(caminho) || caminho.includes('..')) return null;
			try {
				const r = await gh.api<{ content: string }>(`/contents/${caminho}?ref=main`);
				return new TextDecoder().decode(Uint8Array.from(atob(r.content.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
			} catch (e) {
				if (e instanceof Error && /HTTP 404/.test(e.message)) return null;
				throw e;
			}
		},
		async abrirPR(caminho, conteudo, titulo, autor) {
			const base = await gh.shaDoRamo('main');
			if (!base) throw new Error('main não encontrada');
			const ramo = `ops/${caminho.replace(/^ops\//, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
			const sha = await gh.commitar(base, [{ caminho, base64: base64(new TextEncoder().encode(conteudo)) }], titulo, autor);
			await gh.moverRamo(ramo, sha, true);
			return gh.abrirPR(ramo, titulo, `Proposta enviada por ${autor} pelo Copiloto Operacional.\n\nO merge humano é a aprovação (ADR-015, DEC-08). O CI valida o schema de ops/.`);
		},
	};
}

/** link_valido: HEAD (ou GET) https com 8 s de limite; 2xx = publicado. */
export async function verificarLink(url: string, buscar: typeof fetch = fetch): Promise<boolean> {
	if (!/^https:\/\/[^\s]+$/.test(url)) return false;
	const sinal = AbortSignal.timeout(8000);
	const r = await buscar(url, { method: 'HEAD', redirect: 'follow', signal: sinal }).catch(() => null);
	if (r && r.status === 405) return (await buscar(url, { redirect: 'follow', signal: sinal }).catch(() => null))?.ok ?? false;
	return r?.ok ?? false;
}

/** Transição feita direto na UI do GitHub (§5.2): legal → aceita; ilegal → reverte e comenta. */
export async function validarLabelUi(t: Tarefas, numero: number, adicionada: string, labels: string[]) {
	if (!adicionada.startsWith('state/')) return 'ignorado';
	const estados = labels.filter((l) => l.startsWith('state/'));
	if (estados.length <= 1) return 'ok';
	const para = estadoDasLabels([adicionada]) as Estado;
	const de = estadoDasLabels(estados.filter((l) => l !== adicionada));
	const issue = await t.ler(numero);
	const spec = lerTaskSpec(issue.corpo);
	const override = labels.includes('override/operador');
	const legal = de && transicaoLegal(de, para) && (para !== 'DONE' || (spec && decidirFeito(de, spec, spec.evidencia).acao === 'DONE'));
	const novas = legal || override ? [...labels.filter((l) => !l.startsWith('state/')), adicionada] : [...labels.filter((l) => l !== adicionada)];
	await t.gh.api(`/issues/${numero}`, { method: 'PATCH', body: JSON.stringify({ labels: novas }) });
	if (!legal && !override) await t.comentar(numero, `Transição revertida: ${de ? ROTULO[de] : '?'} → ${ROTULO[para]} não é permitida${para === 'DONE' ? ' sem DoD, evidência e verificação' : ''}. Use /feito ou o caminho legal.`);
	return legal || override ? 'aceita' : 'revertida';
}

export interface RelatorioReconciliacao {
	promovidas: number[];
	transicoes: { numero: number; label: string; resultado: string }[];
	sem_estado: number[];
}

/**
 * Reconciliação por varredura (pull) — a mesma regra do webhook (`validarLabelUi`) e do cron de
 * 15 min (`promoviveis`), para quem não tem webhook: descobre qual `state/*` foi adicionada por
 * último pelo histórico de eventos da issue e decide igual ao webhook.
 */
export async function reconciliarTudo(t: Tarefas, ts?: Tarefa[]): Promise<RelatorioReconciliacao> {
	const lista = ts ?? (await t.listar());
	const out: RelatorioReconciliacao = { promovidas: [], transicoes: [], sem_estado: [] };
	for (const x of lista) {
		if (x.tipo === 'ideia') continue;
		const estados = x.labels.filter((l) => l.startsWith('state/'));
		if (!estados.length) {
			out.sem_estado.push(x.numero);
			continue;
		}
		if (estados.length < 2) continue;
		const eventos = await t.gh.api<{ event: string; label?: { name: string } }[]>(`/issues/${x.numero}/events?per_page=100`);
		const ultima = [...eventos].reverse().find((e) => e.event === 'labeled' && e.label && estados.includes(e.label.name))?.label?.name ?? estados[estados.length - 1];
		out.transicoes.push({ numero: x.numero, label: ultima, resultado: await validarLabelUi(t, x.numero, ultima, x.labels) });
	}
	const atual = out.transicoes.length ? await t.listar() : lista;
	for (const x of promoviveis(atual)) {
		await t.transicionar(x.numero, 'BACKLOG_VALIDATED', 'READY', undefined, 'Dependências concluídas (reconciliação).');
		out.promovidas.push(x.numero);
	}
	return out;
}

/** Espelho unidirecional GitHub → planilha (DEC-02): reescreve as abas a partir do GitHub. */
export function abasEspelho(ts: Tarefa[], agora = new Date()) {
	const tarefas = ts.filter((t) => t.tipo !== 'ideia');
	const linhas = tarefas.map((t) => [t.spec?.task_key ?? '', t.numero, t.titulo, t.spec?.area ?? '', t.estado ?? 'INVÁLIDO', t.labels.includes('priority/urgente') ? 'sim' : '', t.spec?.data ?? '', t.spec?.peso ?? 1, t.spec?.workflow ?? '', (t.spec?.depende ?? []).join(' '), (t.spec?.evidencia ?? []).join(' '), t.url ?? '']);
	const programas = [...new Set(tarefas.map((t) => t.spec?.program).filter(Boolean))] as string[];
	const progresso = [['escopo', 'percentual', ...ESTADOS], ['todos', completude(tarefas).percentual ?? '', ...ESTADOS.map((e) => completude(tarefas).contagem[e])], ...programas.map((p) => { const c = completude(tarefas.filter((t) => t.spec?.program === p)); return [`programa/${p}`, c.percentual ?? '', ...ESTADOS.map((e) => c.contagem[e])]; })];
	return {
		TAREFAS: [['task_key', 'issue', 'título', 'área', 'estado', 'urgente', 'data', 'peso', 'workflow', 'dependências', 'evidência', 'link'], ...linhas],
		IDEIAS: [['task_key', 'issue', 'título', 'área', 'link'], ...ts.filter((t) => t.tipo === 'ideia').map((t) => [t.spec?.task_key ?? '', t.numero, t.titulo, t.spec?.area ?? '', t.url ?? ''])],
		PROGRESSO: progresso,
		_SYNC: [['last_sync_at', 'fonte', 'linhas'], [agora.toISOString(), 'GitHub (System of Record)', linhas.length]],
	};
}

/** CSV (RFC 4180) de uma aba do espelho. */
export function csv(linhas: (string | number)[][]): string {
	const campo = (v: string | number) => {
		const s = String(v);
		return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	return `${linhas.map((l) => l.map(campo).join(',')).join('\r\n')}\r\n`;
}
