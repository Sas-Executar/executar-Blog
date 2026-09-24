/**
 * RBAC do Studio. Quem entra já passou pelo Cloudflare Access; o papel define o que a pessoa pode
 * fazer. PAPEIS é um JSON opcional { "email": "autor" | "editor" | "admin", "*": "<padrão>" }.
 * Sem PAPEIS, todo usuário autenticado é editor (o Access já restringe os e-mails).
 */
import type { Modo } from './publicar.ts';

export const PAPEIS = ['leitor', 'autor', 'editor', 'admin'] as const;
export type Papel = (typeof PAPEIS)[number];

export interface EnvPapeis {
	PAPEIS?: string;
}

export class ErroPermissao extends Error {}

export function papelDe(email: string, env: EnvPapeis): Papel {
	if (!env.PAPEIS) return 'editor';
	let mapa: Record<string, string> = {};
	try {
		mapa = JSON.parse(env.PAPEIS);
	} catch {
		return 'leitor'; // configuração inválida: menor privilégio
	}
	const papel = mapa[email.toLowerCase()] ?? mapa['*'] ?? 'leitor';
	return (PAPEIS as readonly string[]).includes(papel) ? (papel as Papel) : 'leitor';
}

/** leitor: só lê e valida · autor: rascunho, preview e PR · editor/admin: também publica. */
export function autorizar(papel: Papel, modo: Modo) {
	const permitido = papel === 'editor' || papel === 'admin' || (papel === 'autor' && modo !== 'publish');
	if (!permitido) throw new ErroPermissao(modo === 'publish' ? 'Seu papel não permite publicar direto. Use “Abrir PR” para pedir revisão.' : 'Seu papel só permite leitura.');
}
