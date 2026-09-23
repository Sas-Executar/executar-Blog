#!/usr/bin/env node
/**
 * Importa o pacote de artigos (RC-KNW) para o vault publicável, aplicando a limpeza editorial
 * aprovada (ADR-004): remove IDs internos, briefing de infográfico, "Autor curto", link interno do
 * Knowledge Pack e arquivos de controle. Execução única; o vault/ passa a ser a fonte editorial.
 *
 * Uso: node scripts/import-content.mjs <pasta-do-pacote> [pasta-do-vault]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ID_PREFIX = /^(FRC-\d+|ARTICLE-MASTER-[A-Z0-9-]+)\s+/;
const FILE_ID_PREFIX = /^(FRC-\d+|ARTICLE-MASTER-[A-Z0-9-]+)__/;

/** Lê MATRIZ_RASTREABILIDADE.csv → Map(id → { titulo, grupo }). */
export function parseMatriz(csv) {
	const map = new Map();
	for (const line of csv.trim().split('\n').slice(1)) {
		const [id, titulo, grupo] = line.split(',');
		map.set(id, { titulo, grupo });
	}
	return map;
}

/** Limpa um artigo. `matriz` resolve IDs relacionados para títulos. */
export function cleanArticle(markdown, matriz) {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const h1 = lines.findIndex((l) => l.startsWith('# '));
	const rawTitle = lines[h1].slice(2).trim();
	const id = rawTitle.match(ID_PREFIX)?.[1];
	const title = rawTitle.replace(ID_PREFIX, '').trim();
	let body = lines.slice(h1 + 1).join('\n');

	const synth = body.match(/\*\*Frase-síntese:\*\*\s*(.+)/);
	const description = synth ? synth[1].trim() : '';

	// "Relacionados" vive dentro da seção 13; extrai antes de remover a seção.
	const related = (body.match(/\*\*Relacionados:\*\*\s*(.+)/)?.[1] ?? '')
		.split(/[,.]/)
		.map((s) => s.trim())
		.filter((s) => matriz.has(s))
		.map((s) => matriz.get(s).titulo);

	body = body.replace(/\n## 13\. Infográfico 16:9[\s\S]*$/, '\n');
	body = body.replace(/^\*\*Autor curto:\*\*.*\n?/m, '');
	body = body.replace(/^- \[[^\]]*Knowledge Pack[^\]]*\]\([^)]*\).*\n?/m, '');
	if (id) body = body.replaceAll(`[${id}]`, `[${title}]`);

	body = body.trimEnd() + '\n';
	if (related.length) {
		body += `\n## Relacionados\n\n${related.map((t) => `- [[${t}]]`).join('\n')}\n`;
	}

	const frontmatter = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---\n`;
	return { id, title, content: frontmatter + body.replace(/^\n+/, '\n') };
}

export function importPack(packDir, vaultDir) {
	const matriz = parseMatriz(fs.readFileSync(path.join(packDir, '03-indices/MATRIZ_RASTREABILIDADE.csv'), 'utf8'));
	fs.mkdirSync(path.join(vaultDir, '.obsidian'), { recursive: true });
	const appJson = path.join(vaultDir, '.obsidian/app.json');
	if (!fs.existsSync(appJson)) fs.writeFileSync(appJson, '{}\n');

	const written = [];
	for (const sub of ['01-conceitos', '02-artigos']) {
		for (const file of fs.readdirSync(path.join(packDir, sub)).filter((f) => f.endsWith('.md')).sort()) {
			const src = fs.readFileSync(path.join(packDir, sub, file), 'utf8');
			const { id, title, content } = cleanArticle(src, matriz);
			if (!id || !FILE_ID_PREFIX.test(file)) throw new Error(`Arquivo fora do padrão: ${file}`);
			// Conceitos ficam em pastas por macrogrupo (viram grupos da sidebar); o artigo master fica na raiz.
			const grupo = sub === '01-conceitos' ? matriz.get(id)?.grupo : '';
			const dest = path.join(vaultDir, grupo ?? '', `${title}.md`);
			fs.mkdirSync(path.dirname(dest), { recursive: true });
			fs.writeFileSync(dest, content);
			written.push(path.relative(vaultDir, dest));
		}
	}
	return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const [packDir, vaultDir = 'vault'] = process.argv.slice(2);
	if (!packDir) {
		console.error('Uso: node scripts/import-content.mjs <pasta-do-pacote> [pasta-do-vault]');
		process.exit(1);
	}
	const written = importPack(packDir, vaultDir);
	console.log(`${written.length} artigos importados para ${vaultDir}/`);
}
