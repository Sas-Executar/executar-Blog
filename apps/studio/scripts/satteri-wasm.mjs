#!/usr/bin/env node
/**
 * Preview no navegador com o MESMO parser do blog (ADR-014): o Sätteri tem build WebAssembly
 * (@bruits/satteri-wasm32-wasi), mas o pacote declara cpu "wasm32" e o npm se recusa a instalá-lo
 * numa máquina x64. Este passo baixa o tarball oficial do registro npm (versão fixa) e o extrai em
 * node_modules antes do build do Studio. Idempotente.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PACOTE = '@bruits/satteri-wasm32-wasi';
const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
// Mesma versão do satteri instalado (o par nativo/wasm precisa casar).
const VERSAO = JSON.parse(fs.readFileSync(path.join(raiz, 'node_modules/satteri/package.json'), 'utf8')).version;
const destino = path.join(raiz, 'node_modules', PACOTE);

const atual = fs.existsSync(path.join(destino, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(destino, 'package.json'), 'utf8')).version : null;
if (atual === VERSAO) {
	console.log(`satteri-wasm: ${PACOTE}@${VERSAO} já presente`);
	process.exit(0);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'satteri-wasm-'));
const tgz = execFileSync('npm', ['pack', `${PACOTE}@${VERSAO}`, '--pack-destination', tmp, '--silent'], { encoding: 'utf8' }).trim().split('\n').pop();
fs.rmSync(destino, { recursive: true, force: true });
fs.mkdirSync(destino, { recursive: true });
execFileSync('tar', ['-xzf', path.join(tmp, tgz), '-C', destino, '--strip-components=1']);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`satteri-wasm: ${PACOTE}@${VERSAO} extraído em node_modules`);
