/**
 * Worker do EXECUTAR Studio (ADR-014). A interface é estática (assets); só /api/* e /mcp executam
 * código. Todas as rotas exigem identidade do Cloudflare Access; a credencial do GitHub nunca sai daqui.
 */
import { z } from 'zod';
import { validarLeve } from '@executar/content-schema';
import { criarIndice, lerFrontmatter } from '@executar/markdown-parser';
import { type EnvAuth, identificar } from './auth.ts';
import { type EnvGithub, ErroGithub, GitHub, tokenGithub } from './github.ts';
import { tratarMcp } from './mcp.ts';
import { type EnvPublicar, ErroPedido, type PedidoPublicar, caminhoSeguro, publicar } from './publicar.ts';

export interface EnvStudio extends EnvAuth, EnvGithub, EnvPublicar {
	ASSETS: Fetcher;
	LIMITE?: RateLimit;
}

const json = (dados: unknown, status = 200) => Response.json(dados, { status, headers: { 'cache-control': 'no-store' } });

export async function tratar(request: Request, env: EnvStudio, buscar: typeof fetch = fetch): Promise<Response> {
	const url = new URL(request.url);
	const eu = await identificar(request, env, buscar);
	if (!eu) return json({ erro: 'acesso negado: entre pelo Cloudflare Access' }, 403);

	if (env.LIMITE && request.method !== 'GET') {
		const { success } = await env.LIMITE.limit({ key: eu.email });
		if (!success) return json({ erro: 'muitas operações; tente em um minuto' }, 429);
	}
	const gh = new GitHub(env, buscar);

	try {
		if (url.pathname === '/mcp') return await tratarMcp(request, gh, env, eu.email);

		if (url.pathname === '/api/eu') return json({ email: eu.email, repo: env.GITHUB_REPO, blog: env.BLOG_URL });

		if (url.pathname === '/api/artigos' && request.method === 'GET') {
			const arquivos = await gh.listarVault();
			return json({ artigos: arquivos.filter((a) => a.caminho.endsWith('.md') && !a.caminho.split('/').some((p) => p.startsWith('_'))).map((a) => a.caminho).sort((a, b) => a.localeCompare(b, 'pt-BR')) });
		}

		if (url.pathname === '/api/artigo' && request.method === 'GET') {
			const caminho = caminhoSeguro(url.searchParams.get('caminho') ?? '');
			const arq = await gh.lerArquivo(caminho);
			return arq ? json({ caminho, conteudo: arq.conteudo }) : json({ erro: 'artigo não encontrado' }, 404);
		}

		// Índice para o preview resolver [[wikilinks]] e embeds: notas (só frontmatter) + imagens.
		if (url.pathname === '/api/indice' && request.method === 'GET') {
			const arquivos = await gh.listarVault();
			const notas = await Promise.all(
				arquivos
					.filter((a) => a.caminho.endsWith('.md'))
					.slice(0, 300)
					.map(async (a) => {
						const arq = await gh.lerArquivo(a.caminho);
						const fm = /^---\r?\n[\s\S]*?\r?\n---/.exec(arq?.conteudo ?? '')?.[0] ?? '';
						return { caminho: a.caminho, conteudo: fm };
					}),
			);
			const imagens = arquivos.filter((a) => /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(a.caminho)).map((a) => ({ caminho: a.caminho }));
			return json({ arquivos: [...notas, ...imagens] });
		}

		if (url.pathname === '/api/imagem' && request.method === 'GET') {
			const caminho = url.searchParams.get('caminho') ?? '';
			if (!/^[^.][^\0]*\.(png|jpe?g|gif|webp|avif|svg)$/i.test(caminho) || caminho.includes('..')) return json({ erro: 'caminho inválido' }, 400);
			const token = await tokenGithub(env, buscar);
			const res = await buscar(`${env.GITHUB_API ?? 'https://api.github.com'}/repos/${env.GITHUB_REPO}/contents/${encodeURI(`vault/${caminho}`)}?ref=${gh.ramo}`, {
				headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github.raw', 'user-agent': 'executar-studio' },
			});
			if (!res.ok) return json({ erro: 'imagem não encontrada' }, 404);
			return new Response(res.body, { headers: { 'content-type': res.headers.get('content-type') ?? 'application/octet-stream', 'cache-control': 'private, max-age=300', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } });
		}

		if (url.pathname === '/api/validar' && request.method === 'POST') {
			const { markdown } = (await request.json()) as { markdown?: string };
			const vault = await gh.listarVault();
			return json(validarLeve(String(markdown ?? ''), { z, lerFrontmatter, indice: criarIndice(vault.map((a) => ({ caminho: a.caminho, conteudo: '' }))) }));
		}

		if (url.pathname === '/api/publicar' && request.method === 'POST') {
			const pedido = (await request.json()) as PedidoPublicar;
			const r = await publicar(pedido, gh, env, eu.email);
			return json(r, r.ok ? 200 : 422);
		}

		return json({ erro: 'rota não encontrada' }, 404);
	} catch (e) {
		if (e instanceof ErroPedido) return json({ erro: e.message }, 400);
		if (e instanceof ErroGithub) {
			console.error(e.message);
			const conflito = e.status === 422 || e.status === 409;
			return json({ erro: conflito ? 'A main mudou enquanto você editava. Tente publicar de novo.' : 'O GitHub recusou a operação. Veja os logs do Worker.' }, 502);
		}
		console.error('studio:', e);
		return json({ erro: e instanceof Error ? e.message : 'erro interno' }, 500);
	}
}

export default {
	async fetch(request, env): Promise<Response> {
		const { pathname } = new URL(request.url);
		if (pathname.startsWith('/api/') || pathname === '/mcp') return tratar(request, env);
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<EnvStudio>;
