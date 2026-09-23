// Script pontual: converte o blockquote "Frase-síntese" de cada artigo do vault para um callout
// do Obsidian (`> [!summary] ...`), que o starlight-obsidian já converte automaticamente em um
// aside estilizado do Starlight (ver node_modules/starlight-obsidian/libs/starlight.ts). Só mexe
// no vault/ (fonte); os artigos gerados são recriados depois com `npm run content:sync`.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { globSync } from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vaultDir = path.join(root, 'vault');

const regex = /^> \*\*Frase-síntese:\*\* (.+)$/m;

let alterados = 0;
for (const file of globSync('**/*.md', { cwd: vaultDir })) {
	const p = path.join(vaultDir, file);
	const atual = readFileSync(p, 'utf8');
	const m = atual.match(regex);
	if (!m) continue;
	const texto = m[1];
	const novo = atual.replace(regex, `> [!summary] Frase-síntese\n> ${texto}`);
	if (novo === atual) continue;
	writeFileSync(p, novo);
	alterados++;
}
console.log(`arquivos alterados: ${alterados}`);
