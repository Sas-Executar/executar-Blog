import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agentOptions, perguntar, toArticle } from '../../apps/agente/container/agente.mjs';

test('agente usa só ferramentas de leitura, sem settings locais, no vault', () => {
	const o = agentOptions();
	assert.deepEqual(o.tools, ['Read', 'Grep', 'Glob']);
	assert.deepEqual(o.allowedTools, ['Read', 'Grep', 'Glob']);
	assert.equal(o.permissionMode, 'dontAsk');
	assert.deepEqual(o.settingSources, []);
	assert.equal(o.cwd, '/vault');
	assert.equal(o.model, 'claude-opus-5');
	assert.equal(o.outputFormat.type, 'json_schema');
});

test('converte caminho do vault em URL publicada', () => {
	assert.deepEqual(toArticle('Pessoa e cognição/Memória prospectiva.md'), {
		titulo: 'Memória prospectiva',
		url: '/artigos/pessoa-e-cognição/memória-prospectiva/',
	});
	assert.deepEqual(toArticle('./Fatores de Riscos Cognitivos.md'), {
		titulo: 'Fatores de Riscos Cognitivos',
		url: '/artigos/fatores-de-riscos-cognitivos/',
	});
});

const fakeQuery = (messages) => async function* ({ prompt, options }) {
	assert.equal(typeof prompt, 'string');
	assert.ok(options.cwd);
	yield* messages;
};

test('devolve resposta estruturada com fontes deduplicadas', async () => {
	const out = await perguntar('Como reduzir trocas?', {
		queryFn: fakeQuery([
			{ type: 'assistant' },
			{ type: 'result', subtype: 'success', structured_output: { resposta: 'Agrupe tarefas.', fontes: ['Tarefa e fluxo de execução/Troca de tarefas.md', 'Tarefa e fluxo de execução/Troca de tarefas.md'] } },
		]),
	});
	assert.equal(out.resposta, 'Agrupe tarefas.');
	assert.deepEqual(out.fontes, [{ titulo: 'Troca de tarefas', url: '/artigos/tarefa-e-fluxo-de-execução/troca-de-tarefas/' }]);
});

test('erro quando o agente não conclui', async () => {
	await assert.rejects(perguntar('x', { queryFn: fakeQuery([{ type: 'result', subtype: 'error_max_turns' }]) }), /error_max_turns/);
	await assert.rejects(perguntar('x', { queryFn: fakeQuery([]) }), /sem mensagem/);
});
