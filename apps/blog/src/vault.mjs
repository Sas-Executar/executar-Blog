// Vault como fonte única (ADR-013/ADR-014): lista os arquivos do vault (e, só nos testes, os da
// pasta de fixtures) para o índice de wikilinks/embeds e para o loader de conteúdo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarIndice } from '@executar/markdown-parser';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const BASES = ['vault', ...(process.env.E2E_FIXTURES ? ['tests/fixtures/vault'] : [])];

function listar(base, rel = '') {
	const dir = path.join(RAIZ, base, rel);
	if (!fs.existsSync(dir)) return [];
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		if (e.name.startsWith('.') || e.name.startsWith('_')) return [];
		const p = rel ? `${rel}/${e.name}` : e.name;
		return e.isDirectory() ? listar(base, p) : [{ base, caminho: p }];
	});
}

export const ARQUIVOS = BASES.flatMap((b) => listar(b));

export const indice = criarIndice(
	ARQUIVOS.map(({ base, caminho }) => ({ caminho, conteudo: caminho.endsWith('.md') ? fs.readFileSync(path.join(RAIZ, base, caminho), 'utf8') : '' })),
);

/** Imagem do vault → caminho relativo ao arquivo da nota, para o Astro otimizar a imagem. */
export function urlAsset(caminho, fileURL) {
	const achado = ARQUIVOS.find((a) => a.caminho === caminho);
	const alvo = path.join(RAIZ, achado?.base ?? 'vault', caminho);
	if (!fileURL) return `/${caminho}`;
	const rel = path.relative(path.dirname(fileURLToPath(fileURL)), alvo).split(path.sep).join('/');
	return rel.startsWith('.') ? rel : `./${rel}`;
}
