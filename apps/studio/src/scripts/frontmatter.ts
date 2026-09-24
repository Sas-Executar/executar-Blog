// Utilitários puros do editor (testados em tests/unit/studio.test.mjs).
import { parseDocument } from 'yaml';

export function contarPalavras(md: string): number {
	const corpo = md.replace(/^---\r?\n[\s\S]*?\r?\n---/, '');
	return (corpo.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

/** Atualiza uma chave do frontmatter preservando o resto do YAML (comentários e ordem). */
export function definirPropriedade(md: string, nome: string, valor: unknown): string {
	const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
	const doc = parseDocument(m ? m[1] : '');
	if (valor === '' || (Array.isArray(valor) && valor.length === 0 && nome !== 'tags')) doc.delete(nome);
	else doc.set(nome, valor);
	const fm = `---\n${String(doc).trimEnd()}\n---`;
	return m ? fm + md.slice(m[0].length) : `${fm}\n\n${md}`;
}
