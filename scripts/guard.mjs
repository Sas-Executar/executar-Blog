#!/usr/bin/env node
/**
 * Guardrails do repositório (CLAUDE.md, ADR-004/008/009). Falha se:
 *  - arquivos proibidos estiverem versionados (app.css, .env, .dev.vars);
 *  - IDs internos do pacote de origem aparecerem no conteúdo publicado;
 *  - segredos aparecerem no build do cliente.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const INTERNAL_ID = /FRC-\d+|TP-?001|RC-KNW|ARTICLE-MASTER/;
export const SECRET = /sk-ant-[A-Za-z0-9_-]{8,}/;
const FORBIDDEN_FILE = /(^|\/)(app\.css|\.env|\.env\.(?!example$)[^/]+|\.dev\.vars(\..+)?)$/;

export function forbiddenTracked(files) {
	return files.filter((f) => FORBIDDEN_FILE.test(f));
}

function* walk(dir) {
	if (!fs.existsSync(dir)) return;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) yield* walk(full);
		else yield full;
	}
}

export function scan(dirs, pattern, exts) {
	const hits = [];
	for (const dir of dirs) {
		for (const file of walk(dir)) {
			if (exts && !exts.includes(path.extname(file))) continue;
			if (pattern.test(fs.readFileSync(file, 'utf8'))) hits.push(path.relative(root, file));
		}
	}
	return hits;
}

/** Valores reais de segredos locais (.env) não podem vazar para o build do cliente. */
function localSecretValues() {
	const values = [];
	for (const envFile of ['apps/blog/.env', 'apps/agente/.env']) {
		const full = path.join(root, envFile);
		if (!fs.existsSync(full)) continue;
		for (const [, key, value] of fs.readFileSync(full, 'utf8').matchAll(/^([A-Z_]+)=(.+)$/gm)) {
			if (!key.startsWith('PUBLIC_') && value.trim().length >= 8) values.push(value.trim());
		}
	}
	return values;
}

export function runGuard() {
	const problems = [];
	const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
	for (const f of forbiddenTracked(tracked)) problems.push(`arquivo proibido versionado: ${f}`);

	const content = [path.join(root, 'vault'), path.join(root, 'apps/blog/src/content'), path.join(root, 'apps/blog/dist')];
	for (const f of scan(content, INTERNAL_ID, ['.md', '.mdx', '.html'])) problems.push(`ID interno publicado: ${f}`);

	const client = [path.join(root, 'apps/blog/dist')];
	const clientExts = ['.html', '.js', '.css', '.json'];
	for (const f of scan(client, SECRET, clientExts)) problems.push(`chave Anthropic no build do cliente: ${f}`);
	for (const value of localSecretValues()) {
		const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		for (const f of scan(client, new RegExp(escaped), clientExts)) problems.push(`segredo do .env no build do cliente: ${f}`);
	}
	return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const problems = runGuard();
	if (problems.length) {
		console.error(`guard: ${problems.length} problema(s)\n- ${problems.join('\n- ')}`);
		process.exit(1);
	}
	console.log('guard: ok (sem arquivos proibidos, IDs internos ou segredos no cliente)');
}
