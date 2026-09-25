#!/usr/bin/env node
/**
 * Sincroniza os assets de relatório da skill executar-relatorios (fonte de design dos relatórios,
 * Copiloto SK-04, contrato EXECUTAR-REPORT-PRINT-DS-001) para apps/copiloto (ADR-015).
 * Mesmo padrão de packages/theme/sync-design-tokens.mjs (ADR-012): commit fixado, arquivo gerado,
 * nunca editado à mão. Nenhum token é criado aqui — só referenciado.
 *
 * Uso: npm run report:sync                       (baixa do GitHub; Copiloto é privado → GITHUB_TOKEN)
 *      npm run report:sync -- --de ../Copiloto   (lê de um clone local no commit fixado)
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const COMMIT = 'c03ceb38d25b948413159e6d4c27deb305cfb506';
const REPO = 'Sas-Executar/Copiloto';
const SKILL = 'skills/SK-04-executar-relatorios';
export const ARQUIVOS = {
	TOKENS_CSS: 'assets/tokens/tokens.css',
	REPORT_CSS: 'assets/report.css',
	TEMPLATE_IMPRESSAO: 'assets/templates/status-report-v1.html',
	TEMPLATE_EMAIL: 'assets/templates/status-report-v1.email.html',
};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(root, 'apps/copiloto/worker/relatorio-assets.gen.ts');

async function ler(rel, de) {
	if (de) return execFileSync('git', ['-C', de, 'show', `${COMMIT}:${SKILL}/${rel}`], { encoding: 'utf8' });
	const headers = { accept: 'application/vnd.github.raw+json', 'user-agent': 'executar-blog-sync' };
	if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${SKILL}/${rel}?ref=${COMMIT}`, { headers });
	if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`);
	return res.text();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const i = process.argv.indexOf('--de');
	const de = i > 0 ? path.resolve(process.argv[i + 1]) : null;
	const partes = [`/* Assets de relatório da skill executar-relatorios @ ${REPO}#${COMMIT.slice(0, 7)} — gerado por scripts/sync-report-assets.mjs, não editar. */`];
	partes.push(`export const ORIGEM = ${JSON.stringify(`${REPO}@${COMMIT}/${SKILL}`)};`);
	for (const [nome, rel] of Object.entries(ARQUIVOS)) partes.push(`export const ${nome} = ${JSON.stringify(await ler(rel, de))};`);
	fs.writeFileSync(destino, `${partes.join('\n')}\n`);
	console.log(`relatórios: ${Object.keys(ARQUIVOS).length} assets @ ${COMMIT.slice(0, 7)} → ${path.relative(root, destino)}`);
}
