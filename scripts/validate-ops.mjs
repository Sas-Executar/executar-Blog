#!/usr/bin/env node
/**
 * Valida as definições versionadas em ops/ (ADR-015, DEC-08): o CI roda isto antes do merge, que é
 * a aprovação humana. Workflows pelo schema do Worker; rotinas pelo contrato mínimo e pelos crons
 * declarados no wrangler do Copiloto; áreas com slug válido.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { WorkflowSchema } from '../apps/copiloto/worker/workflow.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ops = path.join(root, 'ops');

export function validarOps(dir = ops, wranglerTexto = fs.readFileSync(path.join(root, 'apps/copiloto/wrangler.jsonc'), 'utf8')) {
	const erros = [];
	const ler = (rel) => parse(fs.readFileSync(path.join(dir, rel), 'utf8'));
	const crons = new Set([...wranglerTexto.matchAll(/"crons":\s*\[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])));
	for (const f of fs.existsSync(path.join(dir, 'workflows')) ? fs.readdirSync(path.join(dir, 'workflows')) : []) {
		if (!f.endsWith('.yaml')) continue;
		const r = WorkflowSchema.safeParse(ler(`workflows/${f}`));
		if (!r.success) erros.push(`workflows/${f}: ${r.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
		else if (`${r.data.id}.yaml` !== f) erros.push(`workflows/${f}: nome do arquivo deve ser ${r.data.id}.yaml`);
	}
	const indice = fs.existsSync(path.join(dir, 'routines/index.yaml')) ? ler('routines/index.yaml').rotinas ?? [] : [];
	for (const id of indice) {
		const f = `routines/${id}.yaml`;
		if (!fs.existsSync(path.join(dir, f))) {
			erros.push(`${f}: listada em routines/index.yaml mas não existe`);
			continue;
		}
		const r = ler(f);
		if (r.id !== id) erros.push(`${f}: id deve ser ${id}`);
		if (!['ATIVO', 'PAUSADO', 'PROPOSTO', 'ARQUIVADO'].includes(r.estado)) erros.push(`${f}: estado inválido`);
		if (typeof r.comando !== 'string' || !r.comando.startsWith('/')) erros.push(`${f}: comando deve começar com /`);
		if (!crons.has(r.gatilho?.cron_utc)) erros.push(`${f}: cron_utc "${r.gatilho?.cron_utc}" não está em triggers.crons do apps/copiloto/wrangler.jsonc`);
	}
	if (fs.existsSync(path.join(dir, 'areas.yaml'))) for (const slug of Object.keys(ler('areas.yaml').areas ?? {})) if (!/^[a-z0-9-]+$/.test(slug)) erros.push(`areas.yaml: slug inválido ${slug}`);
	return erros;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const erros = validarOps();
	if (erros.length) {
		console.error(`validate-ops: ${erros.length} problema(s)\n- ${erros.join('\n- ')}`);
		process.exit(1);
	}
	console.log('validate-ops: ok (workflows, rotinas e áreas)');
}
