#!/usr/bin/env node
/**
 * Gera o .env de cada app a partir do .env.example (ADR-009). Roda no postinstall.
 * Idempotente: nunca sobrescreve um .env existente e nunca grava segredos reais.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function setupEnv(appsDir = path.join(root, 'apps')) {
	const created = [];
	if (!fs.existsSync(appsDir)) return created;
	for (const app of fs.readdirSync(appsDir)) {
		const example = path.join(appsDir, app, '.env.example');
		const target = path.join(appsDir, app, '.env');
		if (fs.existsSync(example) && !fs.existsSync(target)) {
			fs.copyFileSync(example, target);
			created.push(path.relative(root, target));
		}
	}
	return created;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const created = setupEnv();
	console.log(created.length ? `setup-env: criado ${created.join(', ')}` : 'setup-env: .env já presentes');
}
