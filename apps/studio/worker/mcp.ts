/**
 * Servidor MCP do Studio (ADR-014), transporte Streamable HTTP (POST /mcp, JSON-RPC 2.0, resposta
 * application/json). Mesmas regras da Publish API: autenticação pelo Cloudflare Access (service
 * token para agentes), validação no servidor e credencial do GitHub só no Worker.
 */
import { z } from 'zod';
import { validarLeve } from '@executar/content-schema';
import { criarIndice, idDoCaminho, lerFrontmatter } from '@executar/markdown-parser';
import type { GitHub } from './github.ts';
import { MODOS, type EnvPublicar, ErroPedido, caminhoSeguro, publicar } from './publicar.ts';

export const VERSAO_PROTOCOLO = '2025-06-18';

const FERRAMENTAS = [
	{
		name: 'listar_artigos',
		title: 'Listar artigos do vault',
		description: 'Lista os artigos (arquivos .md) do vault do blog EXECUTAR, com a URL pública de cada um.',
		inputSchema: { type: 'object', properties: {}, additionalProperties: false },
		annotations: { readOnlyHint: true },
	},
	{
		name: 'ler_artigo',
		title: 'Ler artigo',
		description: 'Lê o Markdown completo de um artigo do vault.',
		inputSchema: { type: 'object', properties: { caminho: { type: 'string', description: 'Caminho no vault, ex.: "Pessoa e cognição/Fadiga decisória.md"' } }, required: ['caminho'], additionalProperties: false },
		annotations: { readOnlyHint: true },
	},
	{
		name: 'validar_artigo',
		title: 'Validar artigo',
		description: 'Valida frontmatter, propriedades tipadas, gráficos e links internos de um Markdown antes de publicar.',
		inputSchema: { type: 'object', properties: { markdown: { type: 'string' } }, required: ['markdown'], additionalProperties: false },
		annotations: { readOnlyHint: true },
	},
	{
		name: 'pre_visualizar',
		title: 'Pré-visualizar no site',
		description: 'Envia o artigo para um ramo de prévia e devolve a URL onde ele aparece com o visual do blog (pronta em 1 a 2 minutos). Não altera o site publicado.',
		inputSchema: { type: 'object', properties: { caminho: { type: 'string' }, markdown: { type: 'string' } }, required: ['caminho', 'markdown'], additionalProperties: false },
		annotations: { readOnlyHint: false, destructiveHint: false },
	},
	{
		name: 'publicar',
		title: 'Publicar artigo',
		description: 'Grava o artigo no GitHub. modo: draft (rascunho, não aparece no site), preview (prévia), pr (abre pull request) ou publish (publica no site).',
		inputSchema: {
			type: 'object',
			properties: { caminho: { type: 'string' }, markdown: { type: 'string' }, modo: { type: 'string', enum: [...MODOS] }, mensagem: { type: 'string' } },
			required: ['caminho', 'markdown', 'modo'],
			additionalProperties: false,
		},
		annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
	},
];

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method: string; params?: Record<string, unknown> };

const resultado = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const erro = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const texto = (dados: unknown, isError = false) => ({ content: [{ type: 'text', text: typeof dados === 'string' ? dados : JSON.stringify(dados, null, 2) }], structuredContent: typeof dados === 'object' ? dados : undefined, isError });

async function chamar(nome: string, args: Record<string, unknown>, gh: GitHub, env: EnvPublicar, autor: string) {
	const str = (k: string) => {
		const v = args[k];
		if (typeof v !== 'string') throw new ErroPedido(`Parâmetro obrigatório: ${k}`);
		return v;
	};
	switch (nome) {
		case 'listar_artigos': {
			const arquivos = (await gh.listarVault()).filter((a) => a.caminho.endsWith('.md') && !a.caminho.split('/').some((p) => p.startsWith('_')));
			return texto({ artigos: arquivos.map((a) => ({ caminho: a.caminho, url: `${env.BLOG_URL}/${idDoCaminho(a.caminho)}/` })) });
		}
		case 'ler_artigo': {
			const arq = await gh.lerArquivo(caminhoSeguro(str('caminho')));
			return arq ? texto(arq.conteudo) : texto('Artigo não encontrado.', true);
		}
		case 'validar_artigo': {
			const vault = await gh.listarVault();
			const indice = criarIndice(vault.map((a) => ({ caminho: a.caminho, conteudo: '' })));
			return texto(validarLeve(str('markdown'), { z, lerFrontmatter, indice }));
		}
		case 'pre_visualizar':
			return texto(await publicar({ modo: 'preview', caminho: str('caminho'), markdown: str('markdown') }, gh, env, autor));
		case 'publicar': {
			const modo = str('modo');
			const r = await publicar({ modo: modo as never, caminho: str('caminho'), markdown: str('markdown'), mensagem: typeof args.mensagem === 'string' ? args.mensagem : undefined }, gh, env, autor);
			return texto(r, !r.ok);
		}
		default:
			return null;
	}
}

export async function tratarMcp(request: Request, gh: GitHub, env: EnvPublicar, autor: string): Promise<Response> {
	if (request.method === 'GET') return new Response(null, { status: 405, headers: { allow: 'POST' } });
	if (request.method !== 'POST') return new Response(null, { status: 405 });
	let corpo: Rpc | Rpc[];
	try {
		corpo = await request.json();
	} catch {
		return Response.json(erro(null, -32700, 'JSON inválido'), { status: 400 });
	}
	const lote = Array.isArray(corpo) ? corpo : [corpo];
	const respostas = [];
	for (const msg of lote) {
		if (msg?.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
			respostas.push(erro(msg?.id, -32600, 'Requisição JSON-RPC inválida'));
			continue;
		}
		if (msg.id === undefined) continue; // notificação (ex.: notifications/initialized): sem resposta
		try {
			switch (msg.method) {
				case 'initialize':
					respostas.push(resultado(msg.id, { protocolVersion: VERSAO_PROTOCOLO, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'executar-studio', title: 'EXECUTAR Studio', version: '1.0.0' }, instructions: 'Escreva artigos em Obsidian Flavored Markdown (ver docs/06-docs/EDITORIAL-SYNTAX-SPEC.md). Valide antes de publicar; prefira preview ou pr antes de publish.' }));
					break;
				case 'ping':
					respostas.push(resultado(msg.id, {}));
					break;
				case 'tools/list':
					respostas.push(resultado(msg.id, { tools: FERRAMENTAS }));
					break;
				case 'tools/call': {
					const nome = String(msg.params?.name ?? '');
					const r = await chamar(nome, (msg.params?.arguments as Record<string, unknown>) ?? {}, gh, env, autor);
					respostas.push(r ? resultado(msg.id, r) : erro(msg.id, -32602, `Ferramenta desconhecida: ${nome}`));
					break;
				}
				default:
					respostas.push(erro(msg.id, -32601, `Método não suportado: ${msg.method}`));
			}
		} catch (e) {
			const mensagem = e instanceof Error ? e.message : String(e);
			respostas.push(e instanceof ErroPedido ? resultado(msg.id, texto(mensagem, true)) : erro(msg.id, -32603, mensagem));
		}
	}
	if (!respostas.length) return new Response(null, { status: 202 });
	return Response.json(Array.isArray(corpo) ? respostas : respostas[0], { headers: { 'mcp-protocol-version': VERSAO_PROTOCOLO } });
}
