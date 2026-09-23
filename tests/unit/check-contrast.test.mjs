import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { checkContrast, contrast, TOKENS } from '../../scripts/check-contrast.mjs';

test('calcula contraste WCAG', () => {
	assert.equal(contrast('#000000', '#ffffff').toFixed(1), '21.0');
	assert.ok(contrast('#0a84ff', '#ffffff') < 4.5);
});

test('tokens do blog atendem 4,5:1 em todos os modos', () => {
	assert.deepEqual(checkContrast(fs.readFileSync(TOKENS, 'utf8')), []);
});

test('falha quando um par fica abaixo do mínimo', () => {
	const css = ":root[data-theme='light'] { --foreground: #999999; --background: #ffffff; } :root[data-theme='dark'] {}";
	assert.ok(checkContrast(css).some((f) => f.includes('foreground sobre background')));
});
