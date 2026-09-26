import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ARTIGO = '/blog/fatores-de-riscos-cognitivos/';
const SINTAXE = '/blog/laboratório/sintaxe-completa/';
const PAGINAS = ['/', ARTIGO, SINTAXE, '/blog/pessoa-e-cognição/competição-pela-atenção/', '/blog/', '/explorar/', '/buscar/', '/salvos/', '/preferencias/', '/perguntar/', '/teste-grafico/', '/guia-de-estilo/'];

for (const tema of ['light', 'dark'] as const) {
	test(`acessibilidade (axe) sem violações sérias — ${tema}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: tema });
		for (const url of PAGINAS) {
			await page.goto(url);
			const { violations } = await new AxeBuilder({ page }).exclude('.cf-turnstile').analyze();
			const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes[0]?.target}`);
			expect(graves, url).toEqual([]);
		}
	});
}

// O botão claro/escuro fica no cabeçalho (também no celular) e os diagramas Mermaid seguem o tema
// escolhido, não o do sistema. Sistema em "dark" de propósito: o botão precisa vencer o aparelho.
test('botão claro/escuro no celular: tema troca e diagrama acompanha', async ({ browser }) => {
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
	const page = await ctx.newPage();
	await page.goto(ARTIGO);
	const toggle = page.locator('.cabecalho .theme-toggle').first();
	await expect(toggle).toBeInViewport();
	const antes = await page.evaluate(() => document.documentElement.dataset.theme);
	await toggle.click();
	await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).not.toBe(antes);
	const depois = await page.evaluate(() => document.documentElement.dataset.theme);
	// Mermaid é redesenhado no navegador com a paleta do tema escolhido (--brand-soft, ADR-017).
	const diagrama = page.locator('pre.mermaid[data-desenhado] svg').first();
	await expect(diagrama).toBeVisible({ timeout: 15_000 });
	const fundo = () => diagrama.locator('.node rect, .node polygon').first().evaluate((el) => getComputedStyle(el).fill);
	await expect.poll(fundo).toBe(depois === 'dark' ? 'rgb(31, 51, 71)' : 'rgb(238, 243, 248)');
	await page.reload();
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(depois);
	await ctx.close();
});

test('artigos do vault publicados em /blog, sem IDs internos', async ({ page }) => {
	await page.goto('/blog/');
	for (const t of ['Competição pela atenção', 'Fatores de Riscos Cognitivos', 'Externalização cognitiva']) await expect(page.locator('.post-card', { hasText: t })).toHaveCount(1);
	for (const href of await page.locator('.post-card a').evaluateAll((els) => els.map((a) => a.getAttribute('href')!))) {
		await page.goto(href);
		await expect(page.locator('body')).not.toContainText(/FRC-\d|TP-?001|RC-KNW|ARTICLE-MASTER/);
	}
});

test('endereços antigos /artigos redirecionam para /blog', async ({ request }) => {
	const res = await request.get('/artigos/fatores-de-riscos-cognitivos/', { maxRedirects: 0 });
	expect(res.status()).toBe(301);
	expect(res.headers().location).toContain('/blog/fatores-de-riscos-cognitivos/');
});

test('tabela editorial (filetes) e diagrama renderizado', async ({ page }) => {
	await page.goto(ARTIGO);
	// ADR-018: tabela editorial — só filetes horizontais, sem grade vertical.
	const borda = await page.locator('.markdown-body table td').first().evaluate((el) => ({ base: getComputedStyle(el).borderBottomStyle, lado: getComputedStyle(el).borderLeftStyle }));
	expect(borda).toEqual({ base: 'solid', lado: 'none' });
	await expect(page.locator('pre.mermaid[data-desenhado] svg').first()).toBeVisible({ timeout: 15_000 });
});

test('Busca (HF03): encontra artigo e orienta quando não há resultado', async ({ page }) => {
	await page.goto('/buscar/?q=aten%C3%A7%C3%A3o');
	await expect(page.locator('.resultados a').first()).toBeVisible({ timeout: 15_000 });
	await page.getByLabel('Buscar nos artigos').fill('xyzsemresultado');
	// .edit-btn (referência editorial, ADR-019) tem um ícone via ::before; o nome acessível inclui o glifo.
	await page.getByRole('button', { name: 'Buscar' }).click();
	await expect(page.locator('[data-vazio]')).toBeVisible();
	await expect(page.locator('[data-vazio]')).toContainText('Tente outras palavras');
});

test('gráfico ECharts renderiza com rótulo acessível', async ({ page }) => {
	await page.goto('/teste-grafico/');
	const area = page.locator('[data-grafico]');
	await expect(area).toHaveAttribute('data-pronto', 'true', { timeout: 15_000 });
	await expect(area).toHaveAttribute('aria-label', /Fixture de teste/);
	expect(await area.locator('svg').count()).toBeGreaterThan(0);
});

test('Pergunte aos artigos: estado de espera, resposta e fontes', async ({ page }) => {
	await page.route('**/api/perguntar', async (route) => {
		await new Promise((r) => setTimeout(r, 300));
		await route.fulfill({ json: { resposta: 'Agrupe tarefas semelhantes.', fontes: [{ titulo: 'Troca de tarefas', url: '/blog/pessoa-e-cognição/competição-pela-atenção/' }] } });
	});
	await page.goto('/perguntar/');
	await page.getByLabel('Sua pergunta sobre os artigos').fill('Como reduzir a troca de tarefas?');
	await page.getByRole('button', { name: 'Perguntar' }).click();
	await expect(page.getByRole('status')).toContainText('Pensando');
	await expect(page.getByText('Agrupe tarefas semelhantes.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Troca de tarefas' }).last()).toBeVisible();
});

test('Pergunte aos artigos: erro amigável quando o agente falha', async ({ page }) => {
	await page.route('**/api/perguntar', (route) => route.fulfill({ status: 503, json: { erro: 'o assistente está indisponível agora' } }));
	await page.goto('/perguntar/');
	await page.getByLabel('Sua pergunta sobre os artigos').fill('Pergunta qualquer');
	await page.getByRole('button', { name: 'Perguntar' }).click();
	await expect(page.getByRole('status')).toContainText('indisponível');
});

test('Hoje e Artigo (HF01/HF02): destaque, autoria, referências e próximo passo', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.hoje .rc-card--destaque')).toBeVisible();
	await page.locator('.hoje .rc-card--destaque a').first().click();
	await expect(page.locator('.artigo-hero h1')).toBeVisible();
	await expect(page.locator('.meta-bar')).toContainText('Equipe EXECUTAR');
	await expect(page.locator('.markdown-body')).toContainText('Fontes e aprofundamento');
	await expect(page.getByRole('heading', { name: 'Continue lendo' })).toBeVisible();
	expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Inter');
});

test('Explorar (HF01): filtros por pilar e consciência, com estado vazio', async ({ page }) => {
	await page.goto('/explorar/');
	await expect(page.locator('.post-card:visible')).toHaveCount(6);
	await page.getByRole('button', { name: /C1 · Descoberta/ }).click();
	await expect(page.locator('.post-card:visible')).toHaveCount(1);
	await page.getByRole('button', { name: /P3 · Aplicação e sistemas/ }).click();
	await expect(page.locator('[data-vazio]')).toBeVisible();
	await page.goto('/explorar/?pilar=P1');
	await expect(page.locator('.post-card:visible')).toHaveCount(2);
});

test('Salvos (HF04): salvar adiciona, remover exclui, vazio orienta', async ({ page }) => {
	await page.goto(ARTIGO);
	const salvar = page.locator('.meta-bar [data-salvar]');
	await salvar.click();
	await expect(salvar).toHaveAttribute('aria-pressed', 'true');
	await page.goto('/salvos/');
	await expect(page.locator('.salvos li')).toHaveCount(1);
	await page.locator('.salvos li button').click();
	await expect(page.locator('.salvos li')).toHaveCount(0);
	await expect(page.locator('.salvos [data-vazio]')).toContainText('ainda não salvou');
	await expect(page.getByRole('link', { name: 'Explorar artigos' })).toBeVisible();
});

test('Preferências (HF05): tema e tamanho do texto mudam e mostram o estado atual', async ({ page }) => {
	await page.goto('/preferencias/');
	await page.getByRole('radio', { name: 'Escuro' }).check();
	await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
	await expect(page.locator('[data-preferencia="tema"] [data-atual]')).toHaveText('Atual: Escuro');
	await page.getByRole('radio', { name: 'Maior' }).check();
	await page.goto(ARTIGO);
	expect(await page.evaluate(() => document.documentElement.dataset.texto)).toBe('maior');
	// A linha de rótulo e o corpo do callout (anotação, não leitura corrida) ficam fora da medida.
	const corpo = await page
		.locator('.markdown-body p:not(.callout-line):not(.callout__titulo):not(.callout-body p):not(.callout__corpo p)')
		.first()
		.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	expect(corpo).toBeGreaterThan(19);
});

test('Copiar link (HF02) dá retorno visível e para leitor de tela', async ({ page, context }) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await page.goto(ARTIGO);
	await page.locator('[data-copiar-link]').click();
	await expect(page.locator('[data-copiar-link]')).toContainText('Link copiado');
});

test('teclado (HF06): Tab alcança o cabeçalho e o conteúdo principal', async ({ page }) => {
	await page.goto('/');
	for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
	const foco = await page.evaluate(() => document.activeElement?.closest('.cabecalho, main') !== null);
	expect(foco).toBe(true);
});

// ── Gramática editorial única (ADR-013), a partir de tests/fixtures/vault ──
test('família editorial (ADR-017): ponto de atenção, decisão, infográfico e terminal', async ({ page }) => {
	await page.goto(SINTAXE);
	await expect(page.locator('aside.callout--atencao .callout__titulo').first()).toHaveText('Ponto de atenção');
	const decisao = page.locator('section.callout--decisao');
	await expect(decisao.locator('.callout__titulo')).toHaveText('Antes de decidir');
	await expect(decisao.locator('ol > li')).toHaveCount(2);
	const infografico = page.locator('pre.ascii-art');
	await expect(infografico.locator('.block-title')).toHaveText('Plain txt · infográfico');
	// ASCII preserva espaços e não quebra linha: rola dentro do bloco, nunca a página.
	expect(await infografico.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('pre');
	await expect(infografico).toHaveAttribute('tabindex', '0');
	// ```sh (ADR-019) não passa mais pelo Expressive Code: vira o bloco mono da própria referência.
	await expect(page.locator('pre.terminal .term-title').first()).toHaveText('Plain txt · terminal');
});

test('artigo (ADR-018): abertura em duas colunas, sumário lateral e blocos sem caixa', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto(ARTIGO);
	const sumario = page.locator('.leitura__sumario');
	await expect(sumario).toBeVisible();
	await expect(sumario.getByRole('link', { name: /Origem/ })).toHaveAttribute('href', '#origem');
	// Unificação (ADR-018) + biblioteca de callouts igual à referência (ADR-019): ponto de atenção,
	// decisão, terminal e infográfico fecham só com filete; o callout genérico ganha o cartão
	// arredondado com ícone da referência (V9 "callouts persistentes").
	await page.goto(SINTAXE);
	for (const sel of ['aside.callout--atencao', 'section.callout--decisao', '.expressive-code', 'pre.ascii-art', 'figure.diagrama']) {
		const s = await page.locator(`.markdown-body ${sel}`).first().evaluate((el) => {
			const c = getComputedStyle(el);
			return { fundo: c.backgroundColor, raio: c.borderRadius, esquerda: c.borderLeftWidth, base: c.borderBottomWidth };
		});
		expect(s, sel).toEqual({ fundo: 'rgba(0, 0, 0, 0)', raio: '0px', esquerda: '0px', base: '1px' });
	}
	const dica = await page.locator('.markdown-body aside.callout--dica').first().evaluate((el) => {
		const c = getComputedStyle(el);
		return { fundo: c.backgroundColor, raio: c.borderRadius, esquerda: c.borderLeftWidth, base: c.borderBottomWidth };
	});
	expect(dica, 'aside.callout--dica').toEqual({ fundo: 'rgb(238, 243, 248)', raio: '14px', esquerda: '1px', base: '1px' });
	expect(await page.locator('.expressive-code .frame').first().evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
	// No celular a referência não esconde o sumário: ele sobe para o topo da grade de leitura
	// (.sidebar{grid-row:1}, risco-cognitivo.css) e o "Neste artigo" vira 2 colunas.
	await page.setViewportSize({ width: 375, height: 800 });
	await page.goto(ARTIGO);
	await expect(page.locator('.leitura__sumario')).toBeVisible();
});

test('guia de estilo (ADR-017): fundações, componentes, mood board e storyboard', async ({ page }) => {
	await page.goto('/guia-de-estilo/');
	for (const secao of ['Logo', 'Cores', 'Tipografia', 'Botões', 'Controles de formulário', 'Navegação', 'Cartões e listas', 'Componentes editoriais', 'Mood board', 'Storyboard']) {
		await expect(page.getByRole('heading', { name: secao, exact: true })).toBeVisible();
	}
	await expect(page.locator('.storyboard > li')).toHaveCount(7);
	await expect(page.locator('.cabecalho').getByRole('link', { name: 'Risco Cognitivo, página inicial' })).toBeVisible();
	await expect(page.locator('#logo .logo--g')).toHaveCount(2);
	await expect(page.locator('#editorial .callout--decisao')).toBeVisible();
	await expect(page.locator('#editorial pre.ascii-art')).toBeVisible();
	await page.getByRole('switch', { name: 'Texto maior' }).check();
	await expect(page.getByRole('switch', { name: 'Texto maior' })).toBeChecked();
});

test('sintaxe Obsidian: callouts, destaque, wikilinks, tarefas, math e rodapé', async ({ page }) => {
	await page.goto(SINTAXE);
	await expect(page.locator('aside.callout--dica').first()).toContainText('Frase-síntese');
	await expect(page.locator('details.callout--atencao')).not.toHaveAttribute('open', '');
	await expect(page.locator('details.callout--perigo')).toHaveAttribute('open', '');
	await expect(page.locator('mark')).toHaveText('destaque');
	await expect(page.locator('body')).not.toContainText('comentário invisível');
	await expect(page.locator('body')).not.toContainText('Comentário de bloco');
	await page.getByRole('link', { name: 'atenção', exact: true }).click();
	await expect(page).toHaveURL(/competi%C3%A7%C3%A3o-pela-aten%C3%A7%C3%A3o/);
	await page.goto(SINTAXE);
	await expect(page.locator('[data-task="/"] .tarefa__marca')).toHaveAttribute('aria-label', 'Em andamento');
	await expect(page.locator('.katex').first()).toBeVisible();
	await expect(page.locator('#footnote-label')).toHaveText('Notas');
	await expect(page.locator('#bloco-bloco-alvo')).toHaveText('Parágrafo com âncora de bloco.');
});

test('mermaid desenha no navegador e acompanha o tema', async ({ page }) => {
	await page.goto(SINTAXE);
	const d = page.locator('pre.mermaid');
	await expect(d).toHaveAttribute('data-desenhado', 'true', { timeout: 15_000 });
	await expect(d.locator('svg')).toHaveCount(1);
});

test('abas: teclado (setas) troca de painel com ARIA correto', async ({ page }) => {
	await page.goto(SINTAXE);
	const primeira = page.getByRole('tab', { name: 'Primeira' });
	await primeira.focus();
	await page.keyboard.press('ArrowRight');
	const segunda = page.getByRole('tab', { name: 'Segunda' });
	await expect(segunda).toBeFocused();
	await expect(segunda).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('tabpanel', { name: 'Segunda' })).toContainText('Conteúdo da segunda aba');
	await expect(page.getByText('Conteúdo da primeira aba')).toBeHidden();
});

test('diretivas: toggle, métrica, comparação, database, embed seguro e desconhecida preservada', async ({ page }) => {
	await page.goto(SINTAXE);
	await page.getByText('Clique para abrir').click();
	await expect(page.getByText('Conteúdo do toggle.')).toBeVisible();
	await expect(page.locator('.metrica__valor')).toHaveText('42%');
	await expect(page.locator('.comparacao__lado[data-lado="depois"]')).toContainText('Depois ficou assim');
	await expect(page.locator('.database tbody tr')).toHaveCount(1);
	await expect(page.locator('iframe[src^="https://www.youtube-nocookie.com/"]')).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'Site externo' })).toHaveAttribute('href', 'https://exemplo.com/pagina');
	await expect(page.getByText('Conteúdo preservado de diretiva desconhecida.')).toBeVisible();
	// .toc é exclusivo do sumário lateral "Neste artigo" (referência editorial); a diretiva :::toc
	// do Markdown vira .toc-bloco (ADR-019), para não colidir com a numeração do sumário.
	await expect(page.locator('.toc-bloco a')).toHaveCount(8);
});

test('propriedades tipadas: painel com status, url, e-mail e booleano', async ({ page }) => {
	await page.goto(SINTAXE);
	await page.getByText(/Propriedades \(\d+\)/).click();
	const p = page.locator('.propriedades');
	await expect(p.locator('dd[data-tipo="url"] a')).toHaveAttribute('href', 'https://obsidian.md');
	await expect(p.locator('dd[data-tipo="email"] a')).toHaveAttribute('href', 'mailto:equipe@executar.dev');
	await expect(p.locator('dd[data-tipo="boolean"]')).toHaveText('Sim');
	await expect(p.locator('dd[data-tipo="tags"] .selo')).toHaveCount(2);
});

test('impressão (PDF): abas e toggles aparecem por inteiro', async ({ page }) => {
	await page.goto(SINTAXE);
	await page.emulateMedia({ media: 'print' });
	await expect(page.getByText('Conteúdo da segunda aba.')).toBeVisible();
	await expect(page.locator('.tabs__lista')).toBeHidden();
});
