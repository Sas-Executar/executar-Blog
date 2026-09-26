// Blocos de código especiais (ADR-013): ```mermaid (desenhado no navegador, lazy) e $$math$$/$math$
// (KaTeX no build). Mermaid sem JS continua legível: o texto do diagrama aparece como código.
// ```sh|bash, ```text e ```ascii (ADR-019): blocos de texto puro da referência editorial —
// "Plain txt · terminal", "Plain txt" e "Plain txt · infográfico" (ou o title="…" do bloco).
import katex from 'katex';
import { escapar, html } from './nos.mjs';

const TERMINAL = new Set(['sh', 'bash', 'shell', 'zsh', 'console', 'terminal', 'shellsession']);
const TEXTO = new Set(['text', 'txt', 'plaintext', 'plain']);

export default function codigo() {
	const tex = (valor, displayMode) => katex.renderToString(valor, { displayMode, throwOnError: false, output: 'htmlAndMathml', strict: 'ignore' });
	return {
		name: 'executar-codigo',
		code(node) {
			// Blocos de texto puro da referência (ADR-019): terminal, plain text e infográfico ASCII.
			// Rótulo em caixa alta pelo CSS; espaço em branco preservado; rolagem só dentro do bloco.
			const lang = (node.lang ?? '').toLowerCase();
			const titulo = /title="([^"]+)"/.exec(node.meta ?? '')?.[1];
			if (TERMINAL.has(lang)) return html(`<pre class="terminal" tabindex="0"><span class="term-title">${escapar(titulo ?? 'Plain txt · terminal')}</span>${escapar(node.value)}</pre>`);
			if (TEXTO.has(lang)) return html(`<pre class="plaintext" tabindex="0"><span class="block-title">${escapar(titulo ?? 'Plain txt')}</span>${escapar(node.value)}</pre>`);
			if (lang === 'ascii') return html(`<pre class="ascii-art" tabindex="0"><span class="block-title">${escapar(titulo ?? 'Plain txt · infográfico')}</span><span class="ascii-body">${escapar(node.value)}</span></pre>`);
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
