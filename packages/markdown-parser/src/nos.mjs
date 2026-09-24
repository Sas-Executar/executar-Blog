// Construtores de nós mdast com elemento HTML definido (data.hName), padrão usado pelo próprio
// Starlight nos plugins do Sätteri. "bloco" aceita filhos de bloco; "inline" vai dentro de parágrafos.
export const bloco = (tag, props = {}, children = []) => ({ type: 'paragraph', data: { hName: tag, hProperties: props }, children });
export const inline = (tag, props = {}, children = []) => ({ type: 'emphasis', data: { hName: tag, hProperties: props }, children });
export const texto = (value) => ({ type: 'text', value });
export const html = (value) => ({ type: 'html', value });

export const escapar = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

/** Texto simples de um nó (para rótulos, títulos e ids). */
export function textoDe(no) {
	if (!no) return '';
	if (typeof no.value === 'string') return no.value;
	return (no.children ?? []).map(textoDe).join('');
}

/** Tipos de callout do Obsidian → grupo visual (cor/ícone) do tema. Desconhecido → "nota". */
const GRUPOS = {
	note: 'nota', info: 'nota', todo: 'nota',
	abstract: 'dica', summary: 'dica', tldr: 'dica', tip: 'dica', hint: 'dica', important: 'dica', insight: 'dica',
	success: 'sucesso', check: 'sucesso', done: 'sucesso',
	question: 'pergunta', help: 'pergunta', faq: 'pergunta',
	warning: 'atencao', caution: 'atencao', attention: 'atencao',
	failure: 'perigo', fail: 'perigo', missing: 'perigo', danger: 'perigo', error: 'perigo', bug: 'perigo',
	example: 'exemplo', quote: 'citacao', cite: 'citacao',
};
const TITULOS = { nota: 'Nota', dica: 'Dica', sucesso: 'Sucesso', pergunta: 'Pergunta', atencao: 'Atenção', perigo: 'Perigo', exemplo: 'Exemplo', citacao: 'Citação' };

export function grupoCallout(tipo) {
	return GRUPOS[tipo.toLowerCase()] ?? 'nota';
}

/**
 * Callout (Obsidian `> [!tipo]` e diretiva :::callout). dobra: '' fixo, '+' aberto, '-' fechado.
 * @param {string} tipo @param {any[]} tituloNos @param {any[]} corpo @param {''|'+'|'-'} dobra
 */
export function callout(tipo, tituloNos, corpo, dobra = '') {
	const grupo = grupoCallout(tipo);
	const titulo = tituloNos.length && textoDe({ children: tituloNos }).trim() ? tituloNos : [texto(TITULOS[grupo])];
	const props = { class: `callout callout--${grupo}`, 'data-callout': tipo.toLowerCase() };
	if (dobra) {
		return bloco('details', { ...props, ...(dobra === '+' ? { open: '' } : {}) }, [
			bloco('summary', { class: 'callout__titulo' }, titulo),
			bloco('div', { class: 'callout__corpo' }, corpo),
		]);
	}
	return bloco('aside', { ...props, 'aria-label': textoDe({ children: titulo }).trim() }, [
		bloco('p', { class: 'callout__titulo' }, titulo),
		bloco('div', { class: 'callout__corpo' }, corpo),
	]);
}
