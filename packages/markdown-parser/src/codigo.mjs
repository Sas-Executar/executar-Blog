// Blocos de código especiais (ADR-013): ```mermaid (desenhado no navegador, lazy) e $$math$$/$math$
// (KaTeX no build). Mermaid sem JS continua legível: o texto do diagrama aparece como código.
import katex from 'katex';
import { escapar, html } from './nos.mjs';

export default function codigo() {
	const tex = (valor, displayMode) => katex.renderToString(valor, { displayMode, throwOnError: false, output: 'htmlAndMathml', strict: 'ignore' });
	return {
		name: 'executar-codigo',
		code(node) {
			if (node.lang !== 'mermaid') return;
			return html(`<figure class="diagrama"><pre class="mermaid" data-mermaid>${escapar(node.value)}</pre></figure>`);
		},
		math(node) {
			return html(`<div class="formula">${tex(node.value, true)}</div>`);
		},
		inlineMath(node) {
			return html(tex(node.value, false));
		},
	};
}
