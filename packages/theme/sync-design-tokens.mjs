#!/usr/bin/env node
/**
 * Sincroniza os tokens do Desyng System (ADR-012) para apps/blog/src/styles/ds/.
 * Fonte: repositório Sas-Executar/Desyng-System-ecossitema. no commit fixado abaixo.
 * Os arquivos gerados não são editados à mão; para atualizar, mude COMMIT e rode `npm run tokens:sync`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COMMIT = '5b1418221b37316f7b9ee8b738b2f4c09028de48';
const BASE = `https://raw.githubusercontent.com/Sas-Executar/Desyng-System-ecossitema./${COMMIT}/design-system/tokens`;
const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'src/ds');

fs.mkdirSync(out, { recursive: true });
for (const file of ['variables.css', 'theme.css']) {
	const res = await fetch(`${BASE}/${file}`);
	if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
	let css = await res.text();
	// theme.css importa variables.css relativo; no blog os dois entram pelo customCss, então o @import sai.
	css = css.replace(/@import\s+["']\.\/variables\.css["'];?\s*/, '');
	fs.writeFileSync(path.join(out, file), `/* Desyng System @ ${COMMIT.slice(0, 7)} — gerado por scripts/sync-design-tokens.mjs, não editar. */\n${css}`);
	console.log(`tokens: ${file} ok`);
}
