// Diretivas editoriais (ADR-013): blocos no estilo Notion escritos como diretivas Markdown
// (`:::nome[rótulo]{atributos}`), sem quebrar o arquivo no Obsidian (lá aparecem como texto).
// Aninhamento: o bloco de fora usa mais dois-pontos (`::::tabs` contendo `:::tab`).
// Diretiva desconhecida → <div> com o conteúdo preservado (degradação segura).
import { bloco, callout, escapar, html, inline, texto, textoDe } from './nos.mjs';
import { slugTitulo } from './slug.mjs';

export const DIRETIVAS = ['tabs', 'tab', 'columns', 'column', 'toggle', 'callout', 'note', 'tip', 'caution', 'danger', 'card', 'grid', 'steps', 'timeline', 'metric', 'comparison', 'quote', 'figure', 'embed', 'toc', 'database'];
const EMBED_PERMITIDO = /^https:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/|www\.loom\.com\/embed\/)/;

function rotuloEFilhos(node) {
	const filhos = [...(node.children ?? [])];
	if (filhos[0]?.type === 'paragraph' && filhos[0].data?.directiveLabel) {
		const rotulo = filhos.shift();
		return { rotulo: rotulo.children, filhos };
	}
	return { rotulo: [], filhos };
}

function formatar(v) {
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (Array.isArray(v)) return v.map(formatar).join(', ');
	if (v === true) return 'Sim';
	if (v === false) return 'Não';
	if (v == null) return '';
	return String(v);
}

/** @param {{ indice: any, avisar?: (m: string) => void }} opcoes */
export default function diretivas({ indice, avisar = () => {} }) {
	let seq = 0;
	let titulos = [];

	const construir = {
		tabs(node) {
			const abas = (node.children ?? []).filter((c) => c.type === 'containerDirective' && c.name === 'tab');
			if (!abas.length) return bloco('div', { class: 'tabs' }, node.children);
			const id = `abas-${++seq}`;
			const botoes = abas.map((aba, i) => {
				const { rotulo } = rotuloEFilhos(aba);
				const nome = textoDe({ children: rotulo }).trim() || `Aba ${i + 1}`;
				return `<button type="button" role="tab" id="${id}-t${i}" aria-controls="${id}-p${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${escapar(nome)}</button>`;
			});
			const paineis = abas.map((aba, i) => {
				const { rotulo, filhos } = rotuloEFilhos(aba);
				return bloco('div', { role: 'tabpanel', id: `${id}-p${i}`, 'aria-labelledby': `${id}-t${i}`, tabindex: '0', 'data-rotulo': textoDe({ children: rotulo }).trim(), ...(i ? {} : { 'data-ativo': '' }) }, filhos);
			});
			return bloco('div', { class: 'tabs', 'data-tabs': '' }, [html(`<div role="tablist" class="tabs__lista">${botoes.join('')}</div>`), ...paineis]);
		},
		columns(node) {
			const cols = (node.children ?? []).map((c) => (c.type === 'containerDirective' && c.name === 'column' ? bloco('div', { class: 'coluna' }, rotuloEFilhos(c).filhos) : c));
			return bloco('div', { class: 'colunas', style: `--colunas:${Math.min(cols.length, 4)}` }, cols);
		},
		toggle(node) {
			const { rotulo, filhos } = rotuloEFilhos(node);
			return bloco('details', { class: 'toggle', ...(node.attributes?.open != null ? { open: '' } : {}) }, [bloco('summary', {}, rotulo.length ? rotulo : [texto('Mostrar')]), bloco('div', { class: 'toggle__corpo' }, filhos)]);
		},
		callout(node) {
			const { rotulo, filhos } = rotuloEFilhos(node);
			const dobra = node.attributes?.fold === 'open' ? '+' : node.attributes?.fold === 'closed' ? '-' : '';
			return callout(node.attributes?.type ?? 'note', rotulo, filhos, dobra);
		},
		card(node) {
			const { rotulo, filhos } = rotuloEFilhos(node);
			return bloco('section', { class: 'cartao' }, [...(rotulo.length ? [bloco('h3', { class: 'cartao__titulo' }, rotulo)] : []), ...filhos]);
		},
		grid(node) {
			const n = Math.min(Math.max(parseInt(node.attributes?.cols ?? '2', 10) || 2, 1), 4);
			return bloco('div', { class: 'grade-editorial', style: `--colunas:${n}` }, rotuloEFilhos(node).filhos);
		},
		steps(node) {
			return bloco('div', { class: 'passos' }, rotuloEFilhos(node).filhos);
		},
		timeline(node) {
			return bloco('div', { class: 'linha-do-tempo' }, rotuloEFilhos(node).filhos);
		},
		metric(node) {
			const a = node.attributes ?? {};
			const { rotulo, filhos } = rotuloEFilhos(node);
			const tendencia = /^-/.test(a.delta ?? '') ? 'baixa' : a.delta ? 'alta' : '';
			return bloco('div', { class: 'metrica', ...(tendencia ? { 'data-tendencia': tendencia } : {}) }, [
				bloco('p', { class: 'metrica__valor' }, [texto(a.value ?? '—')]),
				bloco('p', { class: 'metrica__rotulo' }, rotulo.length ? rotulo : [texto(a.label ?? '')]),
				...(a.delta ? [bloco('p', { class: 'metrica__delta' }, [texto(a.delta)])] : []),
				...filhos,
			]);
		},
		comparison(node) {
			const a = node.attributes ?? {};
			const { filhos } = rotuloEFilhos(node);
			const corte = filhos.findIndex((f) => f.type === 'thematicBreak');
			const lados = corte < 0 ? [filhos, []] : [filhos.slice(0, corte), filhos.slice(corte + 1)];
			return bloco('div', { class: 'comparacao' }, [
				bloco('section', { class: 'comparacao__lado', 'data-lado': 'antes' }, [bloco('h3', {}, [texto(a.antes ?? 'Antes')]), ...lados[0]]),
				bloco('section', { class: 'comparacao__lado', 'data-lado': 'depois' }, [bloco('h3', {}, [texto(a.depois ?? 'Depois')]), ...lados[1]]),
			]);
		},
		quote(node) {
			const a = node.attributes ?? {};
			const { filhos } = rotuloEFilhos(node);
			const fonte = [a.autor, a.cite].filter(Boolean).join(', ');
			return bloco('figure', { class: 'citacao' }, [bloco('blockquote', { class: 'pullquote' }, filhos), ...(fonte ? [bloco('figcaption', {}, [texto(`— ${fonte}`)])] : [])]);
		},
		figure(node) {
			const { rotulo, filhos } = rotuloEFilhos(node);
			const legenda = node.attributes?.caption ? [texto(node.attributes.caption)] : rotulo;
			return bloco('figure', { class: 'figura' }, [...filhos, ...(legenda.length ? [bloco('figcaption', {}, legenda)] : [])]);
		},
		embed(node) {
			const a = node.attributes ?? {};
			const titulo = a.title ?? textoDe({ children: rotuloEFilhos(node).rotulo }) ?? 'Conteúdo incorporado';
			if (!a.url) return bloco('p', {}, [texto(titulo)]);
			if (!EMBED_PERMITIDO.test(a.url)) {
				avisar(`embed de host não permitido (virou link): ${a.url}`);
				return bloco('p', { class: 'embed-link' }, [{ type: 'link', url: a.url, children: [texto(titulo || a.url)] }]);
			}
			return html(`<figure class="embed"><iframe src="${escapar(a.url)}" title="${escapar(titulo || 'Conteúdo incorporado')}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></figure>`);
		},
		toc() {
			// Classe "toc-bloco" (não "toc"): a sidebar do artigo já usa .toc no vocabulário da
			// referência editorial (ADR-019); esta é a diretiva :::toc dentro do próprio texto.
			if (!titulos.length) return bloco('p', { class: 'toc-bloco toc-bloco--vazio' }, [texto('Sem seções.')]);
			const itens = titulos.map((t) => `<li class="toc-bloco__nivel-${t.nivel}"><a href="#${t.id}">${escapar(t.texto)}</a></li>`).join('');
			return html(`<nav class="toc-bloco" aria-label="Nesta página"><p class="toc-bloco__titulo">Nesta página</p><ol>${itens}</ol></nav>`);
		},
		database(node) {
			const a = node.attributes ?? {};
			const colunas = (a.columns ?? 'title').split(',').map((c) => c.trim()).filter(Boolean);
			let notas = indice.notas.filter((n) => !a.from || n.pasta === a.from || n.pasta.startsWith(`${a.from}/`));
			if (a.filter) {
				const [k, v] = a.filter.split('=').map((s) => s.trim());
				notas = notas.filter((n) => formatar(n.dados[k]) === v);
			}
			if (a.sort) {
				const [k, dir = 'asc'] = a.sort.split(':');
				notas = [...notas].sort((x, y) => formatar(k === 'title' ? x.titulo : x.dados[k]).localeCompare(formatar(k === 'title' ? y.titulo : y.dados[k]), 'pt-BR') * (dir === 'desc' ? -1 : 1));
			}
			const rotulo = textoDe({ children: rotuloEFilhos(node).rotulo }).trim();
			if (!notas.length) return bloco('p', { class: 'database database--vazio' }, [texto(`Nenhuma nota encontrada${a.from ? ` em “${a.from}”` : ''}.`)]);
			const cab = colunas.map((c) => `<th scope="col">${escapar(c === 'title' ? 'Título' : c)}</th>`).join('');
			const linhas = notas
				.map((n) => `<tr>${colunas.map((c) => (c === 'title' ? `<th scope="row"><a href="${escapar(n.url)}">${escapar(n.titulo)}</a></th>` : `<td>${escapar(formatar(n.dados[c]))}</td>`)).join('')}</tr>`)
				.join('');
			return html(`<div class="database"><table>${rotulo ? `<caption>${escapar(rotulo)}</caption>` : ''}<thead><tr>${cab}</tr></thead><tbody>${linhas}</tbody></table></div>`);
		},
	};
	// Compatibilidade com as asides do Starlight (:::note, :::tip, :::caution, :::danger).
	for (const tipo of ['note', 'tip', 'caution', 'danger']) construir[tipo] = (node) => callout(tipo, rotuloEFilhos(node).rotulo, rotuloEFilhos(node).filhos);

	const visitar = (node, ctx) => {
		// Abas e colunas são montadas pelo pai (tabs/columns); aqui só as soltas, fora do pai.
		const pai = ctx.parent(node);
		if ((node.name === 'tab' || node.name === 'column') && pai?.type === 'containerDirective' && ['tabs', 'columns'].includes(pai.name)) return;
		const f = construir[node.name];
		if (f) return f(node);
		if (node.name === 'tab' || node.name === 'column') return bloco('div', {}, rotuloEFilhos(node).filhos);
		avisar(`diretiva desconhecida: :::${node.name}`);
		return bloco('div', { class: `diretiva diretiva--${node.name.replace(/[^a-z0-9-]/gi, '')}` }, rotuloEFilhos(node).filhos);
	};

	return {
		name: 'executar-diretivas',
		before(root, ctx) {
			seq = 0;
			titulos = [];
			const pilha = [root];
			while (pilha.length) {
				const n = pilha.shift();
				if (n.type === 'heading' && n.depth >= 2 && n.depth <= 3) titulos.push({ nivel: n.depth, texto: ctx.textContent(n), id: '' });
				if (n.children && n.type !== 'heading') pilha.unshift(...n.children);
			}
			// Ids iguais aos do Astro/Starlight: um slugger por documento (repetidos ganham -1, -2...).
			const vistos = new Map();
			for (const t of titulos) {
				const base = slugTitulo(t.texto);
				const n = vistos.get(base) ?? 0;
				vistos.set(base, n + 1);
				t.id = n ? `${base}-${n}` : base;
			}
		},
		containerDirective: visitar,
		leafDirective(node) {
			if (['toc', 'database', 'embed', 'metric'].includes(node.name)) return construir[node.name](node);
		},
	};
}
