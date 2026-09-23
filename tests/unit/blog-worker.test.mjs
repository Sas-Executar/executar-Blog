import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import worker from '../../apps/blog/worker/index.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

function env({ limit = true, agente } = {}) {
	return {
		TURNSTILE_SECRET_KEY: 'segredo',
		LIMITE: { limit: async () => ({ success: limit }) },
		ASSETS: { fetch: async () => new Response('asset') },
		AGENTE: { fetch: agente ?? (async () => Response.json({ resposta: 'ok', fontes: [] })) },
	};
}
const turnstile = (success) => {
	globalThis.fetch = async () => Response.json({ success });
};
const req = (body, method = 'POST') =>
	new Request('https://blog/api/perguntar', { method, body: method === 'POST' ? JSON.stringify(body) : undefined, headers: { 'CF-Connecting-IP': '1.2.3.4' } });

test('rotas fora de /api vão para os assets', async () => {
	const res = await worker.fetch(new Request('https://blog/artigos/x/'), env());
	assert.equal(await res.text(), 'asset');
});

test('405 para método errado, 429 no limite, 400 em JSON inválido', async () => {
	assert.equal((await worker.fetch(req(null, 'GET'), env())).status, 405);
	assert.equal((await worker.fetch(req({}), env({ limit: false }))).status, 429);
	const bad = new Request('https://blog/api/perguntar', { method: 'POST', body: '{' });
	assert.equal((await worker.fetch(bad, env())).status, 400);
});

test('403 quando Turnstile falha', async () => {
	turnstile(false);
	assert.equal((await worker.fetch(req({ pergunta: 'oi?', token: 't' }), env())).status, 403);
});

test('encaminha ao agente quando Turnstile passa', async () => {
	turnstile(true);
	let enviado;
	const res = await worker.fetch(
		req({ pergunta: 'Como?', token: 't' }),
		env({ agente: async (_url, init) => ((enviado = JSON.parse(init.body)), Response.json({ resposta: 'r', fontes: [] })) }),
	);
	assert.equal(res.status, 200);
	assert.deepEqual(enviado, { pergunta: 'Como?' });
	assert.equal((await res.json()).resposta, 'r');
});

test('503 quando o agente falha', async () => {
	turnstile(true);
	const res = await worker.fetch(req({ pergunta: 'Como?', token: 't' }), env({ agente: async () => new Response('x', { status: 502 }) }));
	assert.equal(res.status, 503);
});
