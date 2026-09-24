// Gráficos ```chart (ADR-007/ADR-013) desenhados com ECharts no navegador — o mesmo no blog e no
// Studio. Carrega o ECharts só quando um gráfico entra na tela; redesenha ao trocar o tema.
const PALETA = ['#00BF63', '#1F93FF', '#007A45', '#0B6FD3', '#7C7B7B']; // Desyng System (ADR-012)
const graficos = new Map();

const reduzirMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimento === 'reduzido';

async function desenhar(el) {
	const echarts = await import('echarts');
	const escuro = document.documentElement.dataset.theme === 'dark';
	graficos.get(el)?.dispose();
	const chart = echarts.init(el, escuro ? 'dark' : undefined, { renderer: 'svg' });
	chart.setOption({
		backgroundColor: 'transparent',
		color: PALETA,
		animation: !reduzirMovimento(),
		// HIG: a descrição acessível é o título + resumo do autor, não a gerada automaticamente.
		aria: { enabled: true, label: { description: el.dataset.descricao } },
		...JSON.parse(el.dataset.grafico),
	});
	el.dataset.pronto = 'true';
	graficos.set(el, chart);
	if (!el.dataset.observado) {
		el.dataset.observado = 'true';
		new ResizeObserver(() => graficos.get(el)?.resize()).observe(el);
	}
}

export function iniciarGraficos(raiz = document) {
	for (const [el] of graficos) if (!el.isConnected) graficos.delete(el);
	const observer = new IntersectionObserver((entradas) => {
		for (const e of entradas) {
			if (!e.isIntersecting) continue;
			observer.unobserve(e.target);
			void desenhar(e.target);
		}
	});
	raiz.querySelectorAll('[data-grafico]:not([data-pronto])').forEach((el) => observer.observe(el));
}

/** Recria os gráficos já desenhados com a paleta do tema atual (claro/escuro). */
export async function retemarizarGraficos() {
	for (const [el] of graficos) if (el.isConnected) await desenhar(el);
}
