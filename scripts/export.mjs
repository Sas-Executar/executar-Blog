#!/usr/bin/env node
/**
 * Saídas do mesmo Markdown (ADR-014): EPUB 3 e PDF.
 *   npm run export:epub -- "vault/Pasta/Artigo.md"   → dist-export/<nome>.epub (renderer + tema)
 *   npm run export:epub -- "vault/A.md" "vault/B.md"  → dist-export/livro.epub + livro.html (eBook, capítulos na ordem dada)
 *   npm run export:pdf  -- "vault/Pasta/Artigo.md"   → dist-export/<nome>.pdf (página do blog impressa pelo Chromium)
 * PDF usa BASE_URL (padrão: blog local em http://localhost:4321; rode `npm run dev` antes) e
 * PW_CHROMIUM_PATH quando o Chromium local for de outra versão.
 */
import fs from 'node:fs';
import path from 'node:path';
import { gerarEpub, gerarLivroWeb, renderMarkdown } from '@executar/editorial-renderer';
import { idDoCaminho } from '@executar/markdown-parser';
import { indice } from '../apps/blog/src/vault.mjs';

const [formato, arquivo, ...outros] = process.argv.slice(2);
if (!['epub', 'pdf'].includes(formato) || !arquivo) {
	console.error('uso: node scripts/export.mjs <epub|pdf> "vault/Pasta/Artigo.md"');
	process.exit(1);
}
const caminho = arquivo.replace(/\\/g, '/').replace(/^vault\//, '');
const md = fs.readFileSync(path.join('vault', caminho), 'utf8');
const nome = path.basename(caminho, '.md');
fs.mkdirSync('dist-export', { recursive: true });
const saida = path.join('dist-export', `${nome}.${formato}`);

if (formato === 'epub' && outros.length) {
	const css = ['packages/theme/src/cores.css', 'packages/theme/src/editorial.css'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
	const capitulos = [];
	for (const f of [arquivo, ...outros]) {
		const { html, dados } = await renderMarkdown(fs.readFileSync(path.join('vault', f.replace(/\\/g, '/').replace(/^vault\//, '')), 'utf8'), { indice });
		capitulos.push({ titulo: String(dados.title ?? path.basename(f, '.md')), html });
	}
	const titulo = process.env.TITULO ?? 'EXECUTAR';
	fs.writeFileSync(path.join('dist-export', 'livro.epub'), gerarEpub({ titulo, capitulos, css }));
	fs.writeFileSync(path.join('dist-export', 'livro.html'), gerarLivroWeb({ titulo, capitulos, css }));
	console.log('export: dist-export/livro.epub e dist-export/livro.html');
	process.exit(0);
}
if (formato === 'epub') {
	const { html, dados } = await renderMarkdown(md, { indice });
	const css = ['packages/theme/src/cores.css', 'packages/theme/src/editorial.css'].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
	fs.writeFileSync(saida, gerarEpub({ titulo: String(dados.title ?? nome), autor: String(dados.autor ?? 'EXECUTAR'), html, css }));
} else {
	const { chromium } = await import('@playwright/test');
	const base = (process.env.BASE_URL ?? 'http://localhost:4321').replace(/\/$/, '');
	const navegador = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
	const pagina = await navegador.newPage();
	const res = await pagina.goto(`${base}/${idDoCaminho(caminho)}/`, { waitUntil: 'networkidle' });
	if (!res?.ok()) throw new Error(`página não encontrada: HTTP ${res?.status()}`);
	await pagina.emulateMedia({ media: 'print' });
	await pagina.pdf({ path: saida, format: 'A4', printBackground: true, margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' } });
	await navegador.close();
}
console.log(`export: ${saida}`);
