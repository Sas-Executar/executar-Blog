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
	// ADR-017: bloco de decisão/reflexão (lista numerada de perguntas e respostas, sem caixa).
	decision: 'decisao', decisao: 'decisao', 'decisão': 'decisao', reflection: 'decisao', reflexao: 'decisao', 'reflexão': 'decisao',
};
const TITULOS = { nota: 'Nota', dica: 'Dica', sucesso: 'Sucesso', pergunta: 'Pergunta', atencao: 'Ponto de atenção', perigo: 'Perigo', exemplo: 'Exemplo', citacao: 'Citação', decisao: 'Decisão' };

export function grupoCallout(tipo) {
	return GRUPOS[tipo.toLowerCase()] ?? 'nota';
}

/** Grupo → variante visual da biblioteca de callouts da referência (ADR-019): ícone e superfície. */
const VARIANTES = { nota: 'note', dica: 'evidence callout--soft', sucesso: 'approved', pergunta: 'question', atencao: 'attention', perigo: 'attention callout--danger', exemplo: 'action', citacao: 'note' };

/** Bloco de decisão (ADR-019, .decision-card): cada item "**Pergunta** resposta" vira pergunta + resposta. */
function decisao(titulo, corpo) {
	const itens = [];
	const resto = [];
	for (const no of corpo) {
		if (no.type === 'list' && !itens.length) {
			no.children.forEach((item, i) => {
				const [primeiro, ...demais] = item.children ?? [];
				const inl = primeiro?.type === 'paragraph' ? [...primeiro.children] : [];
				const temPergunta = inl[0]?.type === 'strong';
				const pergunta = temPergunta ? inl[0].children : inl;
				const resposta = temPergunta ? inl.slice(1) : [];
				if (resposta[0]?.type === 'text') resposta[0] = texto(resposta[0].value.replace(/^\s+/, ''));
				itens.push(
					bloco('li', { class: 'decision-item' }, [
						inline('span', { class: 'decision-number', 'aria-hidden': 'true' }, [texto(String(i + 1).padStart(2, '0'))]),
						bloco('div', { class: 'decision-copy' }, [
							bloco('p', { class: 'decision-question' }, pergunta),
							...(resposta.length ? [bloco('p', { class: 'decision-answer' }, resposta)] : []),
							...demais,
						]),
					]),
				);
			});
		} else resto.push(no);
	}
	return bloco('section', { class: 'decision-card callout--decisao', 'aria-label': textoDe({ children: titulo }).trim() }, [
		bloco('p', { class: 'decision-label callout__titulo' }, titulo),
		...(itens.length ? [bloco('ol', { class: 'decision-list' }, itens)] : []),
		...(resto.length ? [bloco('div', { class: 'callout__corpo' }, resto)] : []),
	]);
}

/**
 * Callout (Obsidian `> [!tipo]` e diretiva :::callout). dobra: '' fixo, '+' aberto, '-' fechado.
 * Markup da biblioteca de callouts da referência (ADR-019): ícone + linha de título + corpo.
 * Exceções da própria referência: atenção sem título = "Ponto de atenção" (.aside-note: rótulo,
 * frase e filetes) e decisão = .decision-card.
 * @param {string} tipo @param {any[]} tituloNos @param {any[]} corpo @param {''|'+'|'-'} dobra
 */
export function callout(tipo, tituloNos, corpo, dobra = '') {
	const grupo = grupoCallout(tipo);
	const semTitulo = !(tituloNos.length && textoDe({ children: tituloNos }).trim());
	const titulo = semTitulo ? [texto(TITULOS[grupo])] : tituloNos;
	const rotulo = textoDe({ children: titulo }).trim();
	if (grupo === 'decisao') return decisao(titulo, corpo);
	if (grupo === 'atencao' && semTitulo && !dobra) {
		return bloco('aside', { class: 'aside-note callout--atencao', 'data-callout': tipo.toLowerCase(), 'aria-label': rotulo }, [
			inline('span', { class: 'label callout__titulo' }, titulo),
			bloco('div', { class: 'callout__corpo' }, corpo),
		]);
	}
	const props = { class: `callout callout--${VARIANTES[grupo]} callout--${grupo}`, 'data-callout': tipo.toLowerCase() };
	const icone = inline('span', { class: 'callout-icon', 'aria-hidden': 'true' }, []);
	if (dobra) {
		return bloco('details', { ...props, ...(dobra === '+' ? { open: '' } : {}) }, [
			bloco('summary', { class: 'callout-line' }, [icone, inline('strong', { class: 'callout__titulo' }, titulo)]),
			bloco('div', { class: 'callout-body callout__corpo' }, corpo),
		]);
	}
	return bloco('aside', { ...props, 'aria-label': rotulo }, [
		icone,
		bloco('div', { class: 'callout-content' }, [
			bloco('p', { class: 'callout-line' }, [inline('strong', { class: 'callout__titulo' }, titulo)]),
			bloco('div', { class: 'callout-body callout__corpo' }, corpo),
		]),
	]);
}
