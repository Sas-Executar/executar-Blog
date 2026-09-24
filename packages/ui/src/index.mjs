// @executar/ui (ADR-014): comportamento dos componentes editoriais no navegador — o mesmo no blog e
// no Studio. Sem framework; tudo funciona sem JS (abas mostram a 1ª, Mermaid mostra o código).
export { iniciarGraficos, retemarizarGraficos } from './graficos.mjs';
import { iniciarGraficos } from './graficos.mjs';

export function iniciarEditorial(raiz = document) {
	iniciarAbas(raiz);
	iniciarGraficos(raiz);
	void iniciarMermaid(raiz);
}

/** Abas acessíveis (padrão WAI-ARIA): clique, setas, Home/End. */
export function iniciarAbas(raiz = document) {
	raiz.querySelectorAll('[data-tabs]').forEach((grupo) => {
		if (grupo.dataset.pronto) return;
		grupo.dataset.pronto = 'true';
		const abas = [...grupo.querySelectorAll(':scope > .tabs__lista > [role="tab"]')];
		const ativar = (i, foco = true) => {
			abas.forEach((aba, j) => {
				const sel = i === j;
				aba.setAttribute('aria-selected', String(sel));
				aba.tabIndex = sel ? 0 : -1;
				const painel = grupo.querySelector(`#${CSS.escape(aba.getAttribute('aria-controls'))}`);
				if (painel) painel.toggleAttribute('data-ativo', sel);
			});
			if (foco) abas[i].focus();
		};
		abas.forEach((aba, i) => {
			aba.addEventListener('click', () => ativar(i, false));
			aba.addEventListener('keydown', (e) => {
				const mapa = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 };
				if (!(e.key in mapa)) return;
				e.preventDefault();
				ativar((mapa[e.key] + abas.length) % abas.length);
			});
		});
	});
}

let mermaidCarregado;
/** Mermaid só é baixado quando há diagrama na página; redesenha ao trocar o tema. */
export async function iniciarMermaid(raiz = document) {
	const blocos = [...raiz.querySelectorAll('pre.mermaid[data-mermaid]')];
	if (!blocos.length) return;
	for (const b of blocos) b.dataset.fonte ??= b.textContent ?? '';
	mermaidCarregado ??= import('mermaid').then((m) => m.default);
	const mermaid = await mermaidCarregado;
	const escuro = document.documentElement.dataset.theme === 'dark';
	mermaid.initialize({
		startOnLoad: false,
		securityLevel: 'strict',
		theme: 'base',
		fontFamily: getComputedStyle(document.body).fontFamily,
		themeVariables: escuro
			? { primaryColor: '#0d2a1c', primaryTextColor: '#f6f6f6', primaryBorderColor: '#58fbad', lineColor: '#c5c5c5', background: '#262626' }
			: { primaryColor: '#e4f6ed', primaryTextColor: '#4b4a4a', primaryBorderColor: '#007a45', lineColor: '#646363', background: '#ffffff' },
	});
	for (const [i, b] of blocos.entries()) {
		try {
			const { svg } = await mermaid.render(`mermaid-${Date.now()}-${i}`, b.dataset.fonte);
			b.innerHTML = svg;
			b.dataset.desenhado = 'true';
			b.setAttribute('role', 'img');
			b.setAttribute('aria-label', `Diagrama: ${b.dataset.fonte.split('\n')[0]}`);
		} catch {
			b.textContent = b.dataset.fonte;
		}
	}
}
