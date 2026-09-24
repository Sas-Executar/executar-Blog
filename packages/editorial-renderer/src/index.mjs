// @executar/editorial-renderer (ADR-014): Markdown do vault → HTML com a mesma gramática e plugins
// do blog. Usado pelo Studio (preview/validação), pelos exports (PDF/EPUB) e pelos testes de paridade.
import { markdownToHtml } from 'satteri';
import { satteriHeadingIdsPlugin } from '@astrojs/markdown-satteri';
import { RECURSOS, criarIndice, hastEditorial, lerFrontmatter, pluginsEditoriais } from '@executar/markdown-parser';

/** Diretivas de texto/folha não reconhecidas voltam a ser texto (mesmo efeito do Starlight no blog). */
const restaurar = {
	name: 'executar-restaurar-diretivas',
	textDirective(node, ctx) {
		if (node.data) return;
		return { type: 'text', value: `:${node.name}${ctx.textContent(node) ? `[${ctx.textContent(node)}]` : ''}` };
	},
	leafDirective(node, ctx) {
		if (node.data) return;
		return { type: 'paragraph', children: [{ type: 'text', value: `::${node.name}${ctx.textContent(node) ? `[${ctx.textContent(node)}]` : ''}` }] };
	},
};

/**
 * @param {string} markdown arquivo completo (com frontmatter)
 * @param {{ indice?: ReturnType<typeof criarIndice>, urlAsset?: (caminho: string) => string }} [opcoes]
 * @returns {Promise<{ html: string, dados: Record<string, unknown>, avisos: string[] }>}
 */
export async function renderMarkdown(markdown, { indice = criarIndice([]), urlAsset } = {}) {
	const avisos = [];
	const { dados, corpo } = lerFrontmatter(markdown);
	const plugins = pluginsEditoriais({ indice, urlAsset, avisar: (m) => avisos.push(m) });
	const resultado = await markdownToHtml(corpo, { features: RECURSOS, mdastPlugins: [...plugins, restaurar], hastPlugins: [satteriHeadingIdsPlugin(), hastEditorial()] });
	return { html: resultado.html ?? String(resultado), dados, avisos: [...new Set(avisos)] };
}
