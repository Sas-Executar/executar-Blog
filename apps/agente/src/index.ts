import { Sandbox as BaseSandbox, getSandbox } from '@cloudflare/sandbox';

export { ContainerProxy } from '@cloudflare/sandbox';

// Padrão do template oficial claude-code: container sem internet, só api.anthropic.com liberado,
// e a chave real injetada na saída — o container vê apenas um placeholder.
export class Sandbox extends BaseSandbox<Env> {
	interceptHttps = true;
	enableInternet = false;
	allowedHosts = ['api.anthropic.com'];
}

Sandbox.outboundByHost = {
	'api.anthropic.com': async (request: Request, env: Env) => {
		const url = new URL(request.url);
		const headers = new Headers(request.headers);
		headers.set('x-api-key', env.ANTHROPIC_API_KEY);
		// AI Gateway (opcional) aplica spend limit e logs; sem ele, vai direto à Anthropic.
		const base = env.AI_GATEWAY_URL || 'https://api.anthropic.com';
		return fetch(`${base}${url.pathname}${url.search}`, {
			method: request.method,
			headers,
			body: request.body,
		});
	},
};

const shellQuote = (s: string) => `'${s.replaceAll("'", "'\\''")}'`;

export const MAX_PERGUNTA = 500;

export async function perguntar(request: Request, env: Env): Promise<Response> {
	let pergunta: unknown;
	try {
		({ pergunta } = await request.json<{ pergunta?: unknown }>());
	} catch {
		return Response.json({ erro: 'JSON inválido' }, { status: 400 });
	}
	if (typeof pergunta !== 'string' || pergunta.trim().length < 3 || pergunta.length > MAX_PERGUNTA) {
		return Response.json({ erro: `pergunta deve ter de 3 a ${MAX_PERGUNTA} caracteres` }, { status: 400 });
	}

	const sandbox = getSandbox(env.Sandbox, 'agente');
	const result = await sandbox.exec(`node /app/agente.mjs ${shellQuote(pergunta.trim())}`, {
		env: { IS_SANDBOX: '1', ANTHROPIC_API_KEY: 'proxy-injected' },
	});
	try {
		const body = JSON.parse(result.stdout);
		return Response.json(body, { status: result.success ? 200 : 502 });
	} catch {
		console.error('agente: saída inválida', result.stderr.slice(0, 500));
		return Response.json({ erro: 'agente indisponível' }, { status: 502 });
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname !== '/perguntar') return new Response('not found', { status: 404 });
		if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
		return perguntar(request, env);
	},
};
