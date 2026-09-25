#!/usr/bin/env node
/**
 * Empacota o servidor MCP do plugin Copiloto Operacional (ADR-016) num arquivo só:
 * plugins/copiloto-operacional/dist/servidor.mjs = núcleo de apps/copiloto/worker + yaml + zod.
 * O plugin é copiado para o cache do Claude Code sem o resto do repositório, então tudo o que ele
 * executa precisa estar dentro dele. O arquivo gerado não é editado à mão.
 *
 * Uso: npm run plugin:build            (regera)
 *      node scripts/build-plugin.mjs --checar   (falha se o dist/ não corresponde ao código-fonte)
 */
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'plugins/copiloto-operacional/dist/servidor.mjs');

export async function empacotar() {
	const r = await build({
		absWorkingDir: raiz,
		entryPoints: ['plugins/copiloto-operacional/src/servidor.ts'],
		bundle: true,
		platform: 'node',
		format: 'esm',
		target: 'node22',
		write: false,
		legalComments: 'none',
		loader: { '.sql': 'text' },
		external: ['node:*'],
		// yaml vem em CommonJS e faz require('process'): o bundle ESM precisa de um require real.
		banner: { js: "// GERADO por scripts/build-plugin.mjs a partir de apps/copiloto/worker e plugins/copiloto-operacional/src — não editar.\nimport { createRequire as __criarRequire } from 'node:module';\nconst require = __criarRequire(import.meta.url);" },
		logLevel: 'silent',
	});
	return r.outputFiles[0].text;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const novo = await empacotar();
	if (process.argv.includes('--checar')) {
		const atual = fs.existsSync(destino) ? fs.readFileSync(destino, 'utf8') : '';
		if (atual !== novo) {
			console.error('plugin: dist/servidor.mjs desatualizado — rode `npm run plugin:build` e faça commit.');
			process.exit(1);
		}
		console.log('plugin: dist/servidor.mjs em dia com o código-fonte');
	} else {
		fs.mkdirSync(path.dirname(destino), { recursive: true });
		fs.writeFileSync(destino, novo);
		console.log(`plugin: ${path.relative(raiz, destino)} (${(novo.length / 1024).toFixed(0)} KB)`);
	}
}
