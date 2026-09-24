// @executar/markdown-parser (ADR-013): gramática editorial única — Obsidian Flavored Markdown +
// diretivas editoriais + chart + math + mermaid — como plugins mdast do Sätteri. Mesmos plugins
// no blog (build) e no Studio (preview), para paridade visual.
import chart from './chart.mjs';
import codigo from './codigo.mjs';
import diretivas from './diretivas.mjs';
import obsidian from './obsidian.mjs';

export { criarIndice, indiceVazio, lerFrontmatter } from './indice.mjs';
export { idDoCaminho, slugTitulo, idBloco } from './slug.mjs';
export { DIRETIVAS } from './diretivas.mjs';
export { TAREFAS } from './obsidian.mjs';
export { chartHtml } from './chart.mjs';

/** Recursos do Sätteri exigidos pela gramática editorial. */
export const RECURSOS = {
	gfm: { footnotes: { label: 'Notas', backLabel: (i) => `Voltar à referência ${i + 1}` } },
	math: true,
	directive: true,
	wikilinks: true,
};

/**
 * @param {{ indice: ReturnType<import('./indice.mjs').criarIndice>, urlAsset?: (caminho: string, fileURL?: URL) => string, avisar?: (msg: string) => void }} opcoes
 * @returns {import('satteri').MdastPluginDefinition[]}
 */
export function pluginsEditoriais(opcoes) {
	return /** @type {any} */ ([diretivas(opcoes), obsidian(opcoes), codigo(), chart()]);
}

/**
 * Plugin hast: rótulo acessível nas caixas de seleção das tarefas GFM (axe: label).
 * @returns {import('satteri').HastPluginDefinition}
 */
export function hastEditorial() {
	return /** @type {any} */ ({
		name: 'executar-hast',
		element: [
			{
				filter: ['input'],
				visit(node, ctx) {
					if (node.properties?.type !== 'checkbox') return;
					ctx.setProperty(node, 'ariaLabel', node.properties.checked ? 'Concluída' : 'A fazer');
				},
			},
		],
	});
}
