// Frontmatter tipado e validação antes de publicar (ADR-013 FRD / ADR-014).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { z } from 'zod';
import { avaliarFormula, calcularRollup, normalizarPropriedade, propriedadesExibiveis, validarArtigo } from '@executar/content-schema';
import { renderMarkdown } from '@executar/editorial-renderer';

const validar = (md) => validarArtigo(md, { z, render: (m) => renderMarkdown(m) });

test('artigo válido passa; avisos não bloqueiam', async () => {
	const r = await validar('---\ntitle: T\ndescription: D\npilar: P1\n---\n[[Não existe]]');
	assert.equal(r.ok, true);
	assert.ok(r.avisos.some((a) => a.includes('Não existe')));
});

test('erros bloqueiam: sem frontmatter, sem título, pilar inválido, gráfico sem resumo', async () => {
	assert.equal((await validar('# só texto')).ok, false);
	const r = await validar('---\ndescription: D\npilar: P9\n---\n');
	assert.ok(r.erros.some((e) => e.includes('título')));
	assert.ok(r.erros.some((e) => e.includes('pilar')));
	const g = await validar('---\ntitle: T\ndescription: D\n---\n```chart\ntype: bar\ntitle: X\n```');
	assert.ok(g.erros.some((e) => e.includes('summary')));
});

test('propriedades tipadas no estilo Notion: formato validado', async () => {
	const md = '---\ntitle: T\ndescription: D\npropriedades:\n  Site: { tipo: url, valor: "não é url" }\n  Fase: { tipo: status, valor: Pronto, opcoes: [Rascunho, Revisão] }\n---\n';
	const r = await validar(md);
	assert.ok(r.erros.some((e) => e.includes('Site')));
	assert.ok(r.avisos.some((a) => a.includes('Fase')));
});

test('tipos inferidos e propriedades exibíveis', () => {
	assert.equal(normalizarPropriedade('x', true).tipo, 'boolean');
	assert.equal(normalizarPropriedade('x', 'https://a.b').tipo, 'url');
	assert.equal(normalizarPropriedade('x', 'a@b.co').tipo, 'email');
	assert.equal(normalizarPropriedade('tags', ['a']).tipo, 'tags');
	const lista = propriedadesExibiveis({ title: 'T', autor: 'A', status: 'Em revisão', propriedades: { Horas: { tipo: 'number', valor: 3 } } });
	assert.deepEqual(lista.map((p) => p.nome), ['status', 'Horas']);
});

test('fórmula segura e rollup', () => {
	assert.equal(avaliarFormula('horas * custo', { horas: 3, custo: 50 }), 150);
	assert.equal(avaliarFormula('horas * alert(1)', { horas: 3 }), null);
	assert.equal(avaliarFormula('constructor', {}), null);
	const notas = [{ pasta: 'P', dados: { h: 2 } }, { pasta: 'P', dados: { h: 4 } }, { pasta: 'Q', dados: { h: 9 } }];
	assert.equal(calcularRollup({ from: 'P', funcao: 'count' }, notas), 2);
	assert.equal(calcularRollup({ from: 'P', campo: 'h', funcao: 'avg' }, notas), 3);
});

test('validação indica a linha exata do problema', async () => {
	const { z } = await import('zod');
	const { validarLeve } = await import('@executar/content-schema');
	const { criarIndice, lerFrontmatter } = await import('@executar/markdown-parser');
	const r = validarLeve('---\ntitle: x\npilar: P9\n---\n\ntexto\n\nver [[Nada]]\n\n```chart\ntype: bar\n```\n', { z, lerFrontmatter, indice: criarIndice([]) });
	assert.ok(r.erros.some((e) => e.startsWith('Linha 3: Propriedade “pilar”')));
	assert.ok(r.erros.some((e) => e.startsWith('Linha 10: gráfico')));
	assert.ok(r.erros.some((e) => e.startsWith('Linha 1: Falta a descrição')));
	assert.deepEqual(r.avisos, ['Linha 8: Link interno não encontrado: [[Nada]]']);
});
