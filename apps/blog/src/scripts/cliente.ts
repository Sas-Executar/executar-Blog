// Comportamento de página comum (ADR-012): Copiar link e Salvar nos artigos.
import { iniciarEditorial, iniciarMermaid } from '@executar/ui';
import { alternarSalvo, anunciar, estaSalvo, type Salvo } from '../lib/salvos';

function iniciar() {
	document.querySelectorAll<HTMLButtonElement>('[data-copiar-link]').forEach((botao) => {
		if (botao.dataset.pronto) return;
		botao.dataset.pronto = 'true';
		const rotulo = botao.querySelector('[data-rotulo]');
		botao.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(location.href.split('#')[0]);
				if (rotulo) rotulo.textContent = 'Link copiado';
				anunciar('Link copiado para a área de transferência.');
			} catch {
				if (rotulo) rotulo.textContent = 'Não foi possível copiar';
				anunciar('Não foi possível copiar o link. Copie o endereço pela barra do navegador.');
			}
			setTimeout(() => rotulo && (rotulo.textContent = 'Copiar link'), 2500);
		});
	});

	document.querySelectorAll<HTMLButtonElement>('[data-salvar]').forEach((botao) => {
		if (botao.dataset.pronto) return;
		botao.dataset.pronto = 'true';
		const item = JSON.parse(botao.dataset.salvar!) as Salvo;
		const rotulo = botao.querySelector('[data-rotulo]');
		const pintar = (salvo: boolean) => {
			botao.setAttribute('aria-pressed', String(salvo));
			if (rotulo) rotulo.textContent = salvo ? 'Salvo' : 'Salvar';
		};
		pintar(estaSalvo(item.url));
		botao.addEventListener('click', () => {
			const { salvo, ok } = alternarSalvo(item);
			if (!ok) return anunciar('Não foi possível salvar neste navegador. Verifique se o armazenamento está bloqueado.');
			pintar(salvo);
			anunciar(salvo ? 'Artigo salvo. Ele aparece em Salvos.' : 'Artigo removido de Salvos.');
		});
	});
}

function tudo() {
	iniciar();
	iniciarEditorial();
}

tudo();
document.addEventListener('astro:page-load', tudo);
// Diagramas Mermaid acompanham a troca de tema (claro/escuro).
new MutationObserver(() => void iniciarMermaid()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
