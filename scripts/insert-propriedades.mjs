// Script pontual (mesmo padrão de insert-graficos.mjs / insert-callouts.mjs): insere, logo após o
// callout "Frase-síntese" de cada artigo do vault, um bloco ```yaml title="fator.yaml"``` com as
// propriedades do fator, extraídas do próprio texto do artigo (nada inventado). O Expressive Code
// renderiza como cartão de código (título, realce, botão de copiar). Idempotente: substitui o bloco
// se já existir. Depois rode `npm run content:sync`.
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vaultDir = path.join(root, 'vault');

const secao = (texto, n) => texto.split(new RegExp(`^## ${n}\\. `, 'm'))[1]?.split(/^## /m)[0] ?? '';
const campo = (bloco, nome) => bloco.match(new RegExp(`^\\*\\*${nome}\\.\\*\\* (.+?)\\s*$`, 'm'))?.[1]?.replace(/\.$/, '');
const yamlStr = (s) => (/[:#\[\]{}&*!|>'"%@`]|^[-?]/.test(s) ? JSON.stringify(s) : s);

function propriedades(texto, arquivo) {
	const termo = campo(secao(texto, 1), 'Termo');
	const referencia = texto.match(/^description: ".*síntese a partir de (.+?)"$/m)?.[1];
	const problema = campo(secao(texto, 5), 'Definição');
	const controle = campo(secao(texto, 6), 'Identificação');
	const quando = texto.match(/^\| Quando\? \| Quando (.+?) (?:aumentarem|se repetirem)\. \|$/m)?.[1];
	const sinais = quando?.split(/, | ou /).map((s) => s.trim());
	const grupo = path.dirname(arquivo) === '.' ? 'Visão geral (todos os grupos)' : path.dirname(arquivo);
	const faltando = Object.entries({ termo, referencia, problema, controle, sinais }).filter(([, v]) => !v).map(([k]) => k);
	if (faltando.length) throw new Error(`${arquivo}: não achei ${faltando.join(', ')}`);
	return [
		'```yaml title="fator.yaml"',
		'fator:',
		`  termo: ${yamlStr(termo)}`,
		`  grupo: ${yamlStr(grupo)}`,
		`  referencia: ${yamlStr(referencia)}`,
		`  problema: ${yamlStr(problema)}`,
		`  controle: ${yamlStr(controle)}`,
		`  sinais: [${sinais.join(', ')}]`,
		'```',
	].join('\n');
}

let alterados = 0;
for (const arquivo of globSync('**/*.md', { cwd: vaultDir })) {
	const p = path.join(vaultDir, arquivo);
	const atual = readFileSync(p, 'utf8');
	const semBloco = atual.replace(/\n```yaml title="fator\.yaml"\n[\s\S]*?\n```\n/, '');
	const callout = /^> \[!summary\] Frase-síntese\n> .+\n/m;
	if (!callout.test(semBloco)) throw new Error(`${arquivo}: callout Frase-síntese não encontrado`);
	const novo = semBloco.replace(callout, (m) => `${m}\n${propriedades(semBloco, arquivo)}\n`);
	if (novo !== atual) {
		writeFileSync(p, novo);
		alterados++;
	}
}
console.log(`arquivos alterados: ${alterados}`);
