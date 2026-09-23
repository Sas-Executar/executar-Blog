import assert from 'node:assert/strict';
import { test } from 'node:test';
import { forbiddenTracked, INTERNAL_ID, runGuard, SECRET } from '../../scripts/guard.mjs';

test('detecta arquivos proibidos e permite .env.example', () => {
	const files = ['public/app.css', 'apps/blog/.env', 'apps/x/.env.production', 'apps/a/.dev.vars', 'apps/blog/.env.example', 'src/app.ts'];
	assert.deepEqual(forbiddenTracked(files), ['public/app.css', 'apps/blog/.env', 'apps/x/.env.production', 'apps/a/.dev.vars']);
});

test('padrões de ID interno e segredo', () => {
	for (const s of ['FRC-01', 'TP001', 'TP-001', 'RC-KNW-001', 'ARTICLE-MASTER-TP001-V1']) assert.match(s, INTERNAL_ID);
	assert.doesNotMatch('Tailoring do projeto', INTERNAL_ID);
	assert.match('sk-ant-api03-abcdefghijk', SECRET);
});

test('repositório atual passa no guard', () => {
	assert.deepEqual(runGuard(), []);
});
