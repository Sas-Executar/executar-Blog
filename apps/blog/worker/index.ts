/**
 * Borda do blog (ADR-002): valida Turnstile e limite por IP, depois encaminha ao Worker do agente
 * por service binding. Qualquer falha do agente vira 503 sem afetar a leitura do site.
 */
/** AGENTE é opcional: o binding só entra no wrangler.jsonc depois que o Worker do agente existir. */
type EnvBlog = Omit<Env, 'AGENTE'> & { AGENTE?: Fetcher };

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function turnstileValido(token: string, secret: string, ip: string | null): Promise<boolean> {
	const form = new FormData();
	form.append('secret', secret);
	form.append('response', token);
	if (ip) form.append('remoteip', ip);
	try {
		const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
		const data = await res.json<{ success?: boolean }>();
		return data.success === true;
	} catch (error) {
		// Falha do Turnstile nunca libera o agente (fail closed).
		console.error('turnstile:', error);
		return false;
	}
}

export async function perguntar(request: Request, env: EnvBlog): Promise<Response> {
	if (request.method !== 'POST') return Response.json({ erro: 'use POST' }, { status: 405 });
	const ip = request.headers.get('CF-Connecting-IP');

	const { success } = await env.LIMITE.limit({ key: ip ?? 'anon' });
	if (!success) return Response.json({ erro: 'muitas perguntas; tente em um minuto' }, { status: 429 });

	let body: { pergunta?: unknown; token?: unknown };
	try {
		body = await request.json();
	} catch {
		return Response.json({ erro: 'JSON inválido' }, { status: 400 });
	}
	if (typeof body.token !== 'string' || body.token.length > 2048 || !(await turnstileValido(body.token, env.TURNSTILE_SECRET_KEY, ip))) {
		return Response.json({ erro: 'verificação anti-robô falhou' }, { status: 403 });
	}

	if (!env.AGENTE) return Response.json({ erro: 'o assistente está indisponível agora' }, { status: 503 });

	try {
		const res = await env.AGENTE.fetch('https://agente/perguntar', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ pergunta: body.pergunta }),
		});
		if (res.status >= 500) throw new Error(`agente ${res.status}`);
		return new Response(res.body, { status: res.status, headers: { 'content-type': 'application/json' } });
	} catch (error) {
		console.error('perguntar:', error);
		return Response.json({ erro: 'o assistente está indisponível agora' }, { status: 503 });
	}
}

export default {
	async fetch(request: Request, env: EnvBlog): Promise<Response> {
		if (new URL(request.url).pathname === '/api/perguntar') return perguntar(request, env);
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<EnvBlog>;
