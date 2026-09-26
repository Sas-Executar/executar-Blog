// Dados editoriais derivados da coleção de artigos (ADR-012). Nada escrito à mão: título,
// resumo, autor, pilar e consciência vêm do frontmatter do vault; categoria vem da pasta.
import { getCollection, type CollectionEntry } from 'astro:content';

export const PILARES = { P1: 'Problemas e fenômenos', P2: 'Métodos e gestão', P3: 'Aplicação e sistemas' } as const;
export const CONSCIENCIA = { C1: 'Descoberta', C2: 'Compreensão', C3: 'Decisão' } as const;
export const ICONES = ['grafico', 'documento', 'pessoas', 'cubo'] as const;
export type Icone = (typeof ICONES)[number];

export interface Artigo {
	id: string;
	url: string;
	titulo: string;
	resumo: string;
	categoria: string;
	categoriaSlug: string;
	autor: string;
	papel?: string;
	iniciais: string;
	minutos: number;
	pilar?: keyof typeof PILARES;
	consciencia?: keyof typeof CONSCIENCIA;
	icone: Icone;
	/** Data de publicação (frontmatter `data`), para a byline. */
	data?: Date;
	/** Temas do artigo: `tags` do frontmatter ou, na falta, categoria, pilar e consciência. */
	temas: string[];
	/** Frase de destaque da barra lateral (frontmatter `destaque`, ADR-019). */
	destaque?: string;
}

const rotulo = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll('-', ' ');
const minutosDe = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
const iniciaisDe = (nome: string) =>
	nome
		.split(/\s+/)
		.filter((p) => p.length > 2 || /^[A-Z]/.test(p))
		.slice(0, 2)
		.map((p) => p[0].toUpperCase())
		.join('');

export function eArtigo(id: string) {
	return id.startsWith('blog/');
}

export function paraArtigo(entry: CollectionEntry<'docs'>): Artigo {
	const partes = entry.id.split('/');
	const categoriaSlug = partes.length > 2 ? partes[1] : 'fundamentos';
	const autor = entry.data.autor ?? 'Equipe EXECUTAR';
	const icone = ICONES[[...categoriaSlug].reduce((n, c) => n + c.charCodeAt(0), 0) % ICONES.length];
	return {
		id: entry.id,
		url: `/${entry.id}/`,
		titulo: entry.data.title,
		resumo: entry.data.description ?? '',
		categoria: rotulo(categoriaSlug),
		categoriaSlug,
		autor,
		papel: entry.data.papel,
		iniciais: iniciaisDe(autor),
		minutos: minutosDe(entry.body),
		pilar: entry.data.pilar,
		consciencia: entry.data.consciencia,
		icone,
		data: entry.data.data,
		temas: entry.data.tags?.length
			? entry.data.tags
			: [rotulo(categoriaSlug), entry.data.pilar && PILARES[entry.data.pilar], entry.data.consciencia && CONSCIENCIA[entry.data.consciencia]].filter((t): t is string => Boolean(t)),
		destaque: entry.data.destaque,
	};
}

/** Artigos em ordem de progressão editorial: Descoberta → Compreensão → Decisão. */
export async function artigos(): Promise<Artigo[]> {
	const lista = (await getCollection('docs', ({ id }) => eArtigo(id))).map(paraArtigo);
	return lista.sort((a, b) => (a.consciencia ?? 'C9').localeCompare(b.consciencia ?? 'C9') || a.titulo.localeCompare(b.titulo, 'pt-BR'));
}

export async function categorias() {
	const mapa = new Map<string, string>();
	for (const a of await artigos()) mapa.set(a.categoriaSlug, a.categoria);
	return [...mapa].map(([slug, nome]) => ({ slug, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
