// @executar/content-schema (ADR-013 FRD): frontmatter tipado do vault — campos editoriais, propriedades
// do Obsidian e tipos no estilo Notion — e validate(), usado pelo blog (build) e pelo Studio (antes de
// publicar). Recebe a instância do Zod para funcionar com o zod do Astro e com o zod puro.

export const PILARES = { P1: 'Problemas e fenômenos', P2: 'Métodos e gestão', P3: 'Aplicação e sistemas' };
export const CONSCIENCIA = { C1: 'Descoberta', C2: 'Compreensão', C3: 'Decisão' };

/** Tipos de propriedade aceitos em `propriedades:` (Obsidian + Notion). */
export const TIPOS = ['text', 'number', 'boolean', 'date', 'datetime', 'list', 'tags', 'links', 'select', 'multiSelect', 'status', 'relation', 'formula', 'rollup', 'person', 'file', 'url', 'email', 'phone', 'id', 'place'];

/** @param {typeof import('zod').z} z */
export function esquemaEditorial(z) {
	const lista = z.union([z.array(z.string()), z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))]);
	const propriedade = z.union([
		z.object({
			tipo: z.enum(TIPOS),
			valor: z.unknown(),
			opcoes: z.array(z.string()).optional(),
			formula: z.string().optional(),
		}),
		z.string(),
		z.number(),
		z.boolean(),
		z.array(z.unknown()),
		z.date(),
	]);
	return z
		.object({
			autor: z.string().optional(),
			papel: z.string().optional(),
			pilar: z.enum(['P1', 'P2', 'P3']).optional(),
			consciencia: z.enum(['C1', 'C2', 'C3']).optional(),
			data: z.coerce.date().optional(),
			// Propriedades nativas do Obsidian.
			tags: lista.optional(),
			aliases: lista.optional(),
			cssclasses: lista.optional(),
			links: lista.optional(),
			publish: z.boolean().optional(),
			// Propriedades tipadas no estilo Notion (select, status, relation, url, email...).
			propriedades: z.record(z.string(), propriedade).optional(),
		})
		.catchall(z.unknown());
}

const FORMATOS = {
	url: (v) => /^https?:\/\/\S+$/.test(String(v)),
	email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)),
	phone: (v) => /^\+?[\d\s().-]{8,}$/.test(String(v)),
	number: (v) => typeof v === 'number' || !Number.isNaN(Number(v)),
	boolean: (v) => typeof v === 'boolean',
	date: (v) => v instanceof Date || /^\d{4}-\d{2}-\d{2}$/.test(String(v)),
	datetime: (v) => v instanceof Date || !Number.isNaN(Date.parse(String(v))),
};

/** Normaliza uma propriedade para exibição: { nome, tipo, valor } (tipo inferido se não declarado). */
export function normalizarPropriedade(nome, bruto) {
	if (bruto && typeof bruto === 'object' && !Array.isArray(bruto) && !(bruto instanceof Date) && 'tipo' in bruto) return { nome, tipo: bruto.tipo, valor: bruto.valor, opcoes: bruto.opcoes };
	if (typeof bruto === 'boolean') return { nome, tipo: 'boolean', valor: bruto };
	if (typeof bruto === 'number') return { nome, tipo: 'number', valor: bruto };
	if (bruto instanceof Date) return { nome, tipo: 'date', valor: bruto };
	if (Array.isArray(bruto)) return { nome, tipo: nome === 'tags' ? 'tags' : 'list', valor: bruto };
	const s = String(bruto ?? '');
	if (FORMATOS.url(s)) return { nome, tipo: 'url', valor: s };
	if (FORMATOS.email(s)) return { nome, tipo: 'email', valor: s };
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { nome, tipo: 'date', valor: s };
	return { nome, tipo: 'text', valor: s };
}

/** Chaves que o layout já mostra ou que são técnicas — não entram no painel de propriedades. */
export const CHAVES_DE_LAYOUT = new Set(['title', 'description', 'autor', 'papel', 'pilar', 'consciencia', 'data', 'aliases', 'cssclasses', 'publish', 'draft', 'editUrl', 'template', 'hero', 'head', 'sidebar', 'pagefind', 'tableOfContents', 'lastUpdated', 'prev', 'next', 'banner', 'slug', 'propriedades']);

/** Lista de propriedades exibíveis (frontmatter plano + bloco `propriedades:`). */
export function propriedadesExibiveis(dados) {
	const planas = Object.entries(dados).filter(([k, v]) => !CHAVES_DE_LAYOUT.has(k) && v !== undefined && v !== null && v !== '');
	const tipadas = Object.entries(dados.propriedades ?? {});
	return [...planas, ...tipadas].map(([k, v]) => normalizarPropriedade(k, v));
}

/**
 * Valida um artigo antes de publicar. Erros bloqueiam; avisos só informam.
 * @param {string} markdown
 * @param {{ z: typeof import('zod').z, render: (md: string) => Promise<{ avisos: string[], dados: Record<string, unknown> }> }} deps
 */
export async function validarArtigo(markdown, { z, render }) {
	const erros = [];
	const avisos = [];
	if (!/^---\r?\n[\s\S]*?\r?\n---/.test(markdown)) erros.push('Falta o frontmatter (bloco entre --- no início do arquivo).');
	let resultado;
	try {
		resultado = await render(markdown);
	} catch (e) {
		erros.push(`O Markdown não pôde ser processado: ${e instanceof Error ? e.message : e}`);
		return { ok: false, erros, avisos };
	}
	const { dados } = resultado;
	if (!dados.title) erros.push('Falta o título (title).');
	if (!dados.description) erros.push('Falta a descrição (description).');
	const r = esquemaEditorial(z).safeParse(dados);
	if (!r.success) for (const i of r.error.issues) erros.push(`Propriedade “${i.path.join('.')}”: ${i.message}`);
	for (const p of Object.entries(dados.propriedades ?? {}).map(([k, v]) => normalizarPropriedade(k, v))) {
		const ok = FORMATOS[p.tipo];
		if (ok && p.valor != null && !ok(p.valor)) erros.push(`Propriedade “${p.nome}” não é um ${p.tipo} válido.`);
		if ((p.tipo === 'select' || p.tipo === 'status') && p.opcoes && !p.opcoes.includes(String(p.valor))) avisos.push(`“${p.nome}”: valor fora das opções (${p.opcoes.join(', ')}).`);
	}
	avisos.push(...resultado.avisos);
	return { ok: erros.length === 0, erros, avisos };
}

/** Fórmula aritmética segura sobre propriedades numéricas da própria nota (ex.: "horas * custo"). */
export function avaliarFormula(expr, dados) {
	const valores = { ...dados, ...Object.fromEntries(Object.entries(dados.propriedades ?? {}).map(([k, v]) => [k, v && typeof v === 'object' && 'valor' in v ? v.valor : v])) };
	if (!/^[\p{L}\p{N}_\s+\-*/().,]+$/u.test(expr)) return null;
	let invalido = false;
	const js = expr.replace(/[\p{L}_][\p{L}\p{N}_]*/gu, (nome) => {
		const n = Number(valores[nome]);
		if (Number.isNaN(n)) invalido = true;
		return `(${n})`;
	});
	if (invalido) return null;
	try {
		const r = Function(`"use strict";return (${js});`)();
		return typeof r === 'number' && Number.isFinite(r) ? Math.round(r * 100) / 100 : null;
	} catch {
		return null;
	}
}

/** Rollup sobre as notas de uma pasta: { from, campo, funcao: count|sum|avg|min|max }. */
export function calcularRollup({ from, campo, funcao = 'count' }, notas) {
	const alvo = notas.filter((n) => !from || n.pasta === from || n.pasta.startsWith(`${from}/`));
	if (funcao === 'count') return alvo.length;
	const nums = alvo.map((n) => Number(n.dados[campo])).filter((n) => !Number.isNaN(n));
	if (!nums.length) return null;
	const soma = nums.reduce((a, b) => a + b, 0);
	return { sum: soma, avg: Math.round((soma / nums.length) * 100) / 100, min: Math.min(...nums), max: Math.max(...nums) }[funcao] ?? null;
}

/**
 * Validação leve, sem renderizar (Worker do Studio e MCP): frontmatter + schema, gráficos com
 * título/resumo, wikilinks e caminho. A validação completa (com render) roda no Studio e no build.
 * @param {string} markdown
 * @param {{ z: typeof import('zod').z, lerFrontmatter: (md: string) => { dados: any, erro?: string }, indice?: { porNome: Map<string, unknown> } }} deps
 */
export function validarLeve(markdown, { z, lerFrontmatter, indice }) {
	const erros = [];
	const avisos = [];
	if (!/^---\r?\n[\s\S]*?\r?\n---/.test(markdown)) erros.push('Falta o frontmatter (bloco entre --- no início do arquivo).');
	const { dados, erro } = lerFrontmatter(markdown);
	if (erro) erros.push('O frontmatter não é um YAML válido.');
	if (!dados.title) erros.push('Falta o título (title).');
	if (!dados.description) erros.push('Falta a descrição (description).');
	const r = esquemaEditorial(z).safeParse(dados);
	if (!r.success) for (const i of r.error.issues) erros.push(`Propriedade “${i.path.join('.')}”: ${i.message}`);
	for (const bloco of markdown.matchAll(/```chart\n([\s\S]*?)```/g)) {
		if (!/^title:/m.test(bloco[1]) || !/^summary:/m.test(bloco[1])) erros.push('Gráfico sem title ou summary (obrigatórios para acessibilidade).');
	}
	if (indice) {
		const semCodigo = markdown.replace(/```[\s\S]*?```/g, '');
		for (const m of semCodigo.matchAll(/!?\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g)) {
			const alvo = m[1].trim();
			if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(alvo)) continue;
			if (!indice.porNome.has(alvo.toLowerCase())) avisos.push(`Link interno não encontrado: [[${alvo}]]`);
		}
	}
	return { ok: erros.length === 0, erros, avisos: [...new Set(avisos)] };
}
