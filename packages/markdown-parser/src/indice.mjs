// Índice do vault (ADR-013): resolve [[wikilinks]], aliases, embeds e alimenta :::database.
// Recebe arquivos já lidos ({ caminho, conteudo }), então funciona no build (fs) e no Studio (GitHub).
import { parse as parseYaml } from 'yaml';
import { idDoCaminho } from './slug.mjs';

const IMAGEM = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

export function lerFrontmatter(conteudo) {
	const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(conteudo);
	if (!m) return { dados: {}, corpo: conteudo };
	try {
		return { dados: parseYaml(m[1]) ?? {}, corpo: conteudo.slice(m[0].length) };
	} catch {
		return { dados: {}, corpo: conteudo.slice(m[0].length), erro: 'frontmatter YAML inválido' };
	}
}

/**
 * @param {{ caminho: string, conteudo?: string }[]} arquivos caminhos relativos à raiz do vault
 * @returns {{ notas: Nota[], assets: Map<string,string>, porNome: Map<string,Nota> }}
 */
export function criarIndice(arquivos) {
	const notas = [];
	const assets = new Map();
	const porNome = new Map();
	for (const { caminho, conteudo = '' } of arquivos) {
		const base = caminho.split('/').pop();
		if (IMAGEM.test(caminho)) {
			assets.set(base.toLowerCase(), caminho);
			continue;
		}
		if (!/\.md$/i.test(caminho)) continue;
		const { dados } = lerFrontmatter(conteudo);
		const nome = base.replace(/\.md$/i, '');
		const pasta = caminho.includes('/') ? caminho.slice(0, caminho.lastIndexOf('/')) : '';
		const nota = { caminho, nome, pasta, url: `/${idDoCaminho(caminho)}/`, titulo: dados.title ?? nome, dados };
		notas.push(nota);
		for (const chave of [nome, dados.title, ...(Array.isArray(dados.aliases) ? dados.aliases : [])]) {
			if (typeof chave === 'string' && !porNome.has(chave.toLowerCase())) porNome.set(chave.toLowerCase(), nota);
		}
	}
	return { notas, assets, porNome };
}

export const indiceVazio = () => criarIndice([]);
