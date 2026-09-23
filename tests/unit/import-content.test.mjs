import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { cleanArticle, importPack, parseMatriz } from '../../scripts/import-content.mjs';

const matriz = parseMatriz(
	'id,titulo,macrogrupo,arquivo,status\nFRC-01,Tailoring do projeto,Sistema,a.md,PREPARED\nFRC-02,Perfil cognitivo do executor,Pessoa,b.md,PREPARED\n',
);

const ARTIGO = `# FRC-01 Tailoring do projeto

> **Frase-síntese:** Adaptar o método reduz esforço. — síntese a partir de ISO

## 4. Referência padrão-ouro

ISO é a referência.

**Autor curto:** ISO

## 8. Visão do sistema

\`\`\`mermaid
flowchart TD
  B --> C[FRC-01]
\`\`\`

## 12. Fontes e aprofundamento

- [ISO 31000](https://www.iso.org/) — ISO.
- [RC-KNW-001 Knowledge Pack TP-001](../../00-fonte/RC-KNW-001-INVENTARIO.md) — corpus canônico.

## 13. Infográfico 16:9

**Premissa 1 — Problema:** x
**Relacionados:** FRC-02, FRC-99.
`;

test('limpa título, frontmatter e remove ID do corpo', () => {
	const { id, title, content } = cleanArticle(ARTIGO, matriz);
	assert.equal(id, 'FRC-01');
	assert.equal(title, 'Tailoring do projeto');
	assert.match(content, /^---\ntitle: "Tailoring do projeto"\ndescription: "Adaptar o método reduz esforço. — síntese a partir de ISO"\n---\n/);
	assert.doesNotMatch(content, /^# /m);
	assert.match(content, /C\[Tailoring do projeto\]/);
});

test('remove seção 13, "Autor curto" e link do Knowledge Pack', () => {
	const { content } = cleanArticle(ARTIGO, matriz);
	assert.doesNotMatch(content, /FRC-\d|TP-?001|RC-KNW|Autor curto|Infográfico|Premissa/);
	assert.match(content, /\[ISO 31000\]/);
});

test('converte relacionados conhecidos em wikilinks e ignora IDs desconhecidos', () => {
	const { content } = cleanArticle(ARTIGO, matriz);
	assert.match(content, /## Relacionados\n\n- \[\[Perfil cognitivo do executor\]\]\n$/);
});

test('importPack grava por macrogrupo, cria .obsidian e é idempotente', () => {
	const pack = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-'));
	const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'vault-'));
	for (const d of ['01-conceitos', '02-artigos', '03-indices']) fs.mkdirSync(path.join(pack, d));
	fs.writeFileSync(path.join(pack, '03-indices/MATRIZ_RASTREABILIDADE.csv'), 'id,titulo,macrogrupo\nFRC-01,Tailoring do projeto,Sistema\n');
	fs.writeFileSync(path.join(pack, '01-conceitos/FRC-01__tailoring-do-projeto.md'), ARTIGO);
	fs.writeFileSync(path.join(pack, '02-artigos/ARTICLE-MASTER-TP001-V1__x.md'), '# ARTICLE-MASTER-TP001-V1 Fatores\n\n> **Frase-síntese:** y\n');
	fs.writeFileSync(path.join(pack, 'Sem título.md'), 'log de chat');
	const first = importPack(pack, vault);
	const second = importPack(pack, vault);
	assert.deepEqual(first, ['Sistema/Tailoring do projeto.md', 'Fatores.md']);
	assert.deepEqual(second, first);
	assert.ok(fs.existsSync(path.join(vault, '.obsidian/app.json')));
	assert.ok(!fs.existsSync(path.join(vault, 'Sem título.md')));
});
