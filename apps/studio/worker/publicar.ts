/**
 * Publish API (ADR-014): grava o artigo (e imagens) no vault via GitHub e devolve a URL.
 * Modos: draft (ramo rascunho/<slug>), preview (ramo preview/<slug> → prévia do Workers Builds),
 * pr (ramo artigo/<slug> + pull request), publish (commit direto na main → deploy de produção).
 * Sempre revalida no servidor; caminhos presos a vault/; limites de tamanho.
 */
import { z } from 'zod';
import { validarLeve } from '@executar/content-schema';
import { criarIndice, idDoCaminho, lerFrontmatter } from '@executar/markdown-parser';
import type { GitHub } from './github.ts';
import { type EnvPapeis, autorizar, papelDe } from './papeis.ts';

export const MODOS = ['draft', 'preview', 'pr', 'publish'] as const;
export type Modo = (typeof MODOS)[number];

export interface PedidoPublicar {
	modo: Modo;
	caminho: string; // relativo ao vault: "Pessoa e cognição/Meu artigo.md"
	markdown: string;
	assets?: { nome: string; base64: string }[];
	mensagem?: string;
	shaOriginal?: string; // sha do arquivo quando foi aberto no editor (detecção de conflito)
}

export interface EnvPublicar extends EnvPapeis {
	BLOG_URL: string; // https://executar-blog.sas-executar.workers.dev
}

const LIMITE_MD = 1_000_000;
const LIMITE_ASSET = 5_000_000;
const LIMITE_TOTAL = 10_000_000;
const IMAGEM = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

export class ErroPedido extends Error {}
export class ErroConflito extends Error {}

/** sha do blob Git (o mesmo que o GitHub guarda), para idempotência e conflitos. */
export async function shaDoBlob(texto: string): Promise<string> {
	const conteudo = new TextEncoder().encode(texto);
	const cab = new TextEncoder().encode(`blob ${conteudo.length}\0`);
	const tudo = new Uint8Array(cab.length + conteudo.length);
	tudo.set(cab);
	tudo.set(conteudo, cab.length);
	return [...new Uint8Array(await crypto.subtle.digest('SHA-1', tudo))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Registro de auditoria (Workers Logs): quem, o quê, onde e qual commit. */
export function auditar(evento: Record<string, unknown>) {
	console.log(JSON.stringify({ auditoria: 'studio', em: new Date().toISOString(), ...evento }));
}

export function base64Utf8(texto: string): string {
	const bytes = new TextEncoder().encode(texto);
	let bin = '';
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

/** Caminho seguro dentro do vault: sem "..", sem ocultos, termina em .md. */
export function caminhoSeguro(caminho: string): string {
	const limpo = caminho.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^vault\//, '');
	const partes = limpo.split('/');
	if (!limpo.endsWith('.md') || partes.some((p) => !p || p === '.' || p === '..' || p.startsWith('.') || p.startsWith('_')) || partes.length > 4) {
		throw new ErroPedido('Caminho inválido: use "Pasta/Nome do artigo.md" dentro do vault.');
	}
	return limpo;
}

export function nomeAssetSeguro(nome: string): string {
	const base = nome.split(/[\\/]/).pop() ?? '';
	if (!IMAGEM.test(base) || base.startsWith('.') || base.length > 120) throw new ErroPedido(`Imagem inválida: ${nome} (use png, jpg, gif, webp, avif ou svg).`);
	return base;
}

const slugRamo = (caminho: string) => idDoCaminho(caminho).replace(/^blog\//, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9/-]+/g, '-').replace(/\//g, '-').slice(0, 60);
/** Alias de prévia do Workers Builds: nome do ramo em minúsculas, não alfanumérico → "-". */
export const urlPrevia = (ramo: string, blogUrl: string) => {
	const host = new URL(blogUrl).host;
	return `https://${ramo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${host}`;
};

export async function publicar(p: PedidoPublicar, gh: GitHub, env: EnvPublicar, autor: string) {
	if (!MODOS.includes(p.modo)) throw new ErroPedido(`Modo inválido. Use: ${MODOS.join(', ')}.`);
	autorizar(papelDe(autor, env), p.modo);
	if (typeof p.markdown !== 'string' || !p.markdown.trim()) throw new ErroPedido('O artigo está vazio.');
	if (p.markdown.length > LIMITE_MD) throw new ErroPedido('O artigo passa de 1 MB.');
	const caminho = caminhoSeguro(p.caminho);
	const pasta = caminho.includes('/') ? caminho.slice(0, caminho.lastIndexOf('/') + 1) : '';

	const arquivosVault = await gh.listarVault();
	const indice = criarIndice([...arquivosVault.map((a) => ({ caminho: a.caminho, conteudo: '' })), { caminho, conteudo: p.markdown }]);
	const validacao = validarLeve(p.markdown, { z, lerFrontmatter, indice });
	if (!validacao.ok) return { ok: false as const, erros: validacao.erros, avisos: validacao.avisos };

	// Conflito: o arquivo mudou no GitHub depois que foi aberto no editor.
	const atual = arquivosVault.find((a) => a.caminho === caminho);
	const novoSha = await shaDoBlob(p.markdown);
	if (p.shaOriginal && atual && atual.sha !== p.shaOriginal && atual.sha !== novoSha) {
		throw new ErroConflito('Este artigo foi alterado por outra pessoa depois que você o abriu. Abra o histórico, compare e publique de novo.');
	}

	let total = p.markdown.length;
	const arquivos = [{ caminho: `vault/${caminho}`, base64: base64Utf8(p.markdown) }];
	for (const a of p.assets ?? []) {
		const nome = nomeAssetSeguro(a.nome);
		const tamanho = Math.floor((a.base64.length * 3) / 4);
		if (tamanho > LIMITE_ASSET) throw new ErroPedido(`A imagem ${nome} passa de 5 MB.`);
		total += tamanho;
		arquivos.push({ caminho: `vault/${pasta}${nome}`, base64: a.base64 });
	}
	if (total > LIMITE_TOTAL) throw new ErroPedido('O envio passa de 10 MB no total.');

	const { dados } = lerFrontmatter(p.markdown);
	const titulo = String(dados.title ?? caminho);
	const mensagem = p.mensagem?.trim() || `conteúdo: ${p.modo === 'publish' ? 'publica' : 'atualiza'} “${titulo}”`;
	const urlPublica = `${env.BLOG_URL.replace(/\/$/, '')}/${idDoCaminho(caminho)}/`;
	const base = (await gh.shaDoRamo(gh.ramo))!;

	if (p.modo === 'publish') {
		// Idempotente: publicar o mesmo conteúdo de novo não cria commit.
		if (atual?.sha === novoSha && !p.assets?.length) {
			return { ok: true as const, modo: p.modo, commit: base, url: urlPublica, arquivo: novoSha, avisos: validacao.avisos, nota: 'Nada mudou: este conteúdo já está publicado.', idempotente: true };
		}
		const sha = await gh.commitar(base, arquivos, mensagem, autor);
		await gh.moverRamo(gh.ramo, sha); // fast-forward; falha se a main andou (sem force)
		auditar({ evento: 'publicar', autor, modo: p.modo, caminho, commit: sha, conteudo: novoSha });
		return { ok: true as const, modo: p.modo, commit: sha, url: urlPublica, arquivo: novoSha, avisos: validacao.avisos, nota: 'Publicado na main. O site atualiza em cerca de 1 a 2 minutos.' };
	}
	const prefixo = { draft: 'rascunho', preview: 'preview', pr: 'artigo' }[p.modo];
	const ramo = `${prefixo}/${slugRamo(caminho)}`;
	const sha = await gh.commitar(base, arquivos, mensagem, autor);
	await gh.moverRamo(ramo, sha, true);
	auditar({ evento: 'publicar', autor, modo: p.modo, caminho, ramo, commit: sha, conteudo: novoSha });
	if (p.modo === 'pr') {
		const pr = await gh.abrirPR(ramo, `Artigo: ${titulo}`, `Enviado pelo EXECUTAR Studio por ${autor}.\n\nArquivo: \`vault/${caminho}\``);
		return { ok: true as const, modo: p.modo, ramo, commit: sha, url: pr, previa: urlPrevia(ramo, env.BLOG_URL), arquivo: novoSha, avisos: validacao.avisos };
	}
	return {
		ok: true as const,
		modo: p.modo,
		ramo,
		commit: sha,
		url: p.modo === 'preview' ? urlPrevia(ramo, env.BLOG_URL) : null,
		arquivo: novoSha, avisos: validacao.avisos,
		nota: p.modo === 'preview' ? 'A prévia fica pronta em cerca de 1 a 2 minutos.' : 'Rascunho guardado no GitHub (não aparece no site).',
	};
}
