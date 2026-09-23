#!/usr/bin/env node
/**
 * Verifica o contraste mínimo 4,5:1 (Apple HIG / WCAG AA) entre os pares de tokens de cor,
 * nos modos claro, escuro e "Increase Contrast" (ADR-006).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS = path.join(root, 'apps/blog/src/styles/tokens.css');
export const MIN = 4.5;
export const PAIRS = [
	['foreground', 'background'],
	['muted', 'background'],
	['link', 'background'],
	['foreground', 'code-background'],
	['muted', 'code-background'],
	['on-accent', 'accent'],
];

function luminance(hex) {
	const [r, g, b] = hex
		.replace('#', '')
		.match(/../g)
		.map((c) => parseInt(c, 16) / 255)
		.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

function readVars(block) {
	return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

/** Extrai os modos de cor do tokens.css. Blocos de "prefers-contrast" herdam do modo base. */
export function parseModes(css) {
	const [base, more = ''] = css.split('@media (prefers-contrast: more)');
	const block = (src, sel) => src.match(new RegExp(`${sel}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
	const light = readVars(block(base, ":root\\[data-theme='light'\\]"));
	const dark = readVars(block(base, ":root\\[data-theme='dark'\\]"));
	return {
		claro: light,
		escuro: dark,
		'claro + contraste': { ...light, ...readVars(block(more, ":root\\[data-theme='light'\\]")) },
		'escuro + contraste': { ...dark, ...readVars(block(more, ":root\\[data-theme='dark'\\]")) },
	};
}

export function checkContrast(css) {
	const failures = [];
	for (const [mode, vars] of Object.entries(parseModes(css))) {
		for (const [fg, bg] of PAIRS) {
			if (!vars[fg] || !vars[bg]) {
				failures.push(`${mode}: token ausente (${fg}/${bg})`);
				continue;
			}
			const ratio = contrast(vars[fg], vars[bg]);
			if (ratio < MIN) failures.push(`${mode}: ${fg} sobre ${bg} = ${ratio.toFixed(2)}:1`);
		}
	}
	return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const failures = checkContrast(fs.readFileSync(TOKENS, 'utf8'));
	if (failures.length) {
		console.error(`Contraste abaixo de ${MIN}:1 (Apple HIG):\n- ${failures.join('\n- ')}`);
		process.exit(1);
	}
	console.log(`check-contrast: ${PAIRS.length} pares × 4 modos ≥ ${MIN}:1`);
}
