// Blocos de código especiais (ADR-013): ```mermaid (desenhado no navegador, lazy) e $$math$$/$math$
// (KaTeX no build). Mermaid sem JS continua legível: o texto do diagrama aparece como código.
// ```ascii (ADR-017): infográfico em texto puro — whitespace preservado, sem quebra de linha, rola
// na horizontal dentro do bloco (tabindex para teclado) e leva o rótulo "Plain txt · infográfico"
// ou o title="…" do bloco.
import katex from 'katex';
import { escapar, html } from './nos.mjs';

export default function codigo() {
	const tex = (valor, displayMode) => katex.renderToString(valor, { displayMode, throwOnError: false, output: 'htmlAndMathml', strict: 'ignore' });
	return {
		name: 'executar-codigo',
		code(node) {
			if (node.lang === 'ascii') {
				const titulo = /title="([^"]+)"/.exec(node.meta ?? '')?.[1] ?? 'Plain txt · infográfico';
				return html(`<figure class="infografico"><figcaption>${escapar(titulo)}</figcaption><pre tabindex="0">${escapar(node.value)}</pre></figure>`);
			}
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
