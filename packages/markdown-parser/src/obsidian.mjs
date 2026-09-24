// Plugin mdast do Sätteri para o Obsidian Flavored Markdown (ADR-013). Sintaxe canônica do vault:
// callouts (incl. dobráveis), ==destaque==, %%comentário%%, [[wikilinks]] (alias, #título, #^bloco),
// ![[embeds]], #tags, âncoras ^bloco e as caixas de seleção estendidas do Minimal.
// Regra de ouro: sintaxe que não dá para resolver degrada para texto/Markdown válido — nunca quebra.
import { bloco, callout, inline, texto } from './nos.mjs';
import { idBloco, slugTitulo } from './slug.mjs';

const EXTERNO = /^(?:[a-z][a-z0-9+.-]*:|\/|#|\.{1,2}\/)/i;
const IMAGEM = /\.(png|jpe?g|gif|webp|avif|svg)$/i;
const CALLOUT = /^\[!([\w-]+)\]([+-]?)[ \t]*(.*)$/;
const TAREFA = /^\[([ xX/\-><?!*"lbiSIpcfkwud])\]\s+/;

/** Caixas de seleção estendidas do Minimal → rótulo acessível. */
export const TAREFAS = {
	' ': 'A fazer', x: 'Concluída', X: 'Concluída', '/': 'Em andamento', '-': 'Cancelada', '>': 'Adiada',
	'<': 'Agendada', '?': 'Pergunta', '!': 'Importante', '*': 'Destaque', '"': 'Citação', l: 'Local',
	b: 'Marcador', i: 'Informação', S: 'Custo', I: 'Ideia', p: 'Prós', c: 'Contras', f: 'Fogo',
	k: 'Chave', w: 'Conquista', u: 'Alta', d: 'Baixa',
};

function dividirTexto(valor) {
	// ==destaque==, %%comentário%% (inline) e #tag → nós. Devolve null quando não há nada a fazer.
	const re = /==([^=\n]+)==|%%[\s\S]*?%%|(^|[\s(])#([\p{L}_][\p{L}\p{N}_/-]*)/gu;
	const nos = [];
	let ultimo = 0;
	let m;
	let mudou = false;
	while ((m = re.exec(valor))) {
		mudou = true;
		const inicio = m.index + (m[2] !== undefined ? m[2].length : 0);
		if (inicio > ultimo) nos.push(texto(valor.slice(ultimo, inicio)));
		if (m[1] !== undefined) nos.push(inline('mark', {}, [texto(m[1])]));
		else if (m[3] !== undefined) nos.push(inline('span', { class: 'tag' }, [texto(`#${m[3]}`)]));
		ultimo = m.index + m[0].length;
	}
	if (!mudou) return null;
	if (ultimo < valor.length) nos.push(texto(valor.slice(ultimo)));
	return nos;
}

/**
 * @param {{ indice: ReturnType<import('./indice.mjs').criarIndice>, urlAsset?: (caminho: string, fileURL?: URL) => string, avisar?: (msg: string) => void }} opcoes
 */
export default function obsidian({ indice, urlAsset, avisar = () => {} }) {
	const resolverNota = (alvo) => indice.porNome.get(alvo.trim().toLowerCase());

	function resolverLink(url) {
		const [alvo, ancora = ''] = decodeURI(url).split('#');
		const nota = alvo ? resolverNota(alvo) : null;
		if (alvo && !nota) return null;
		const base = nota ? nota.url : '';
		if (!ancora) return base || null;
		return `${base}#${ancora.startsWith('^') ? idBloco(ancora.slice(1)) : slugTitulo(ancora)}`;
	}

	return {
		name: 'executar-obsidian',

		// Comentário de bloco %% ... %% que atravessa parágrafos: remove do primeiro ao último.
		before(root, ctx) {
			let dentro = false;
			for (const no of [...root.children]) {
				const t = no.type === 'paragraph' ? ctx.textContent(no).trim() : '';
				if (!dentro) {
					if (!t.startsWith('%%')) continue;
					ctx.removeNode(no);
					dentro = !(t.length >= 4 && t.endsWith('%%'));
				} else {
					ctx.removeNode(no);
					if (t.endsWith('%%')) dentro = false;
				}
			}
		},

		blockquote(node) {
			const primeiro = node.children[0];
			const t0 = primeiro?.type === 'paragraph' ? primeiro.children[0] : null;
			if (t0?.type !== 'text') return;
			const quebra = t0.value.indexOf('\n');
			const linha = quebra < 0 ? t0.value : t0.value.slice(0, quebra);
			const m = CALLOUT.exec(linha);
			if (!m) return;
			const [, tipo, dobra, titulo] = m;
			const restoTexto = quebra < 0 ? '' : t0.value.slice(quebra + 1);
			const restoPrimeiro = [...(restoTexto ? [texto(restoTexto)] : []), ...primeiro.children.slice(1)];
			// O título vai até a primeira quebra; nós inline logo após o [!tipo] (ex.: **negrito**) entram nele.
			const tituloNos = quebra < 0 ? [...(titulo ? [texto(titulo)] : []), ...primeiro.children.slice(1)] : titulo ? [texto(titulo)] : [];
			const corpo = [...(quebra >= 0 && restoPrimeiro.length ? [{ type: 'paragraph', children: restoPrimeiro }] : []), ...node.children.slice(1)];
			return callout(tipo, tituloNos, corpo, dobra);
		},

		paragraph(node, ctx) {
			// Âncora de bloco: "texto ^id" no fim do parágrafo.
			const ultimo = node.children.at(-1);
			if (ultimo?.type !== 'text') return;
			const m = /\s\^([A-Za-z0-9-]+)\s*$/.exec(ultimo.value);
			if (!m) return;
			ctx.setProperty(ultimo, 'value', ultimo.value.slice(0, m.index));
			ctx.setProperty(node, 'data', { ...(node.data ?? {}), hProperties: { id: idBloco(m[1]) } });
		},

		text(node, ctx) {
			const nos = dividirTexto(node.value);
			if (nos) ctx.replaceNode(node, nos);
		},

		link(node) {
			if (EXTERNO.test(node.url) || /\.[a-z0-9]{2,5}$/i.test(node.url.split('#')[0])) return;
			const url = resolverLink(node.url);
			if (url) return { ...node, url, data: { hProperties: { class: 'wikilink' } } };
			avisar(`link interno não encontrado: [[${node.url}]]`);
			return inline('span', { class: 'wikilink wikilink--quebrado', title: 'Nota não encontrada' }, node.children);
		},

		image(node, ctx) {
			if (EXTERNO.test(node.url) && !/^\.{1,2}\//.test(node.url)) return;
			const alvo = decodeURI(node.url);
			if (!IMAGEM.test(alvo.split('#')[0])) {
				// ![[Nota]] → cartão de link para a nota (a nota inteira não é transcluída na web).
				const url = resolverLink(alvo);
				if (!url) {
					avisar(`embed não encontrado: ![[${alvo}]]`);
					return inline('span', { class: 'wikilink wikilink--quebrado' }, [texto(alvo)]);
				}
				return { type: 'link', url, data: { hProperties: { class: 'embed-nota' } }, children: [texto(resolverNota(alvo.split('#')[0])?.titulo ?? alvo)] };
			}
			const caminho = indice.assets.get(alvo.split('/').pop().toLowerCase());
			if (!caminho) {
				if (/^\.{1,2}\//.test(node.url)) return;
				avisar(`imagem não encontrada no vault: ${alvo}`);
				return inline('span', { class: 'imagem-ausente' }, [texto(`[imagem: ${alvo}]`)]);
			}
			// ![[img.png|300]] ou |300x200 → largura/altura; senão o alias é o texto alternativo.
			const tam = /^(\d+)(?:x(\d+))?$/.exec(node.alt ?? '');
			const alt = tam || node.alt === alvo ? '' : node.alt;
			const props = tam ? { width: tam[1], ...(tam[2] ? { height: tam[2] } : {}) } : {};
			return { ...node, url: urlAsset ? urlAsset(caminho, ctx.fileURL) : caminho, alt, data: { hProperties: props } };
		},

		listItem(node, ctx) {
			const p = node.children[0];
			const t = p?.type === 'paragraph' ? p.children[0] : null;
			let marca = node.checked === true ? 'x' : node.checked === false ? ' ' : null;
			if (marca === null && t?.type === 'text') {
				const m = TAREFA.exec(t.value);
				if (!m) return;
				marca = m[1];
				ctx.setProperty(t, 'value', t.value.slice(m[0].length));
				ctx.insertChildAt(p, 0, inline('span', { class: 'tarefa__marca', role: 'img', 'aria-label': TAREFAS[marca] }, []));
			}
			if (marca === null) return;
			// Tarefas GFM ([ ]/[x]) já saem com a classe task-list-item; as estendidas precisam dela.
			const props = node.checked == null ? { class: 'task-list-item' } : {};
			ctx.setProperty(node, 'data', { hProperties: { ...props, 'data-task': marca === 'X' ? 'x' : marca } });
		},
	};
}
