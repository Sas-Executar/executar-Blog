import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ARTIGO = '/blog/fatores-de-riscos-cognitivos/';
const PAGINAS = ['/', ARTIGO, '/blog/pessoa-e-cognição/competição-pela-atenção/', '/blog/', '/explorar/', '/buscar/', '/salvos/', '/preferencias/', '/perguntar/', '/teste-grafico/'];

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
	const toggle = page.locator('.cabecalho starlight-obsidian-theme-select button').first();
	await expect(toggle).toBeInViewport();
	const antes = await page.evaluate(() => document.documentElement.dataset.theme);
	await toggle.click();
	await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).not.toBe(antes);
	const depois = await page.evaluate(() => document.documentElement.dataset.theme);
	const diagrama = page.locator('.markdown-body picture img').first();
	await expect.poll(() => diagrama.evaluate((img: HTMLImageElement) => img.currentSrc.includes('mermaid-dark'))).toBe(depois === 'dark');
	await page.reload();
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(depois);
	await ctx.close();
});

test('3 artigos publicados em /blog, sem IDs internos', async ({ page }) => {
	await page.goto('/blog/');
	await expect(page.locator('.post-card')).toHaveCount(3);
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

test('tabela com estilo GitHub e diagrama renderizado', async ({ page }) => {
	await page.goto(ARTIGO);
	const borda = await page.locator('.markdown-body table td').first().evaluate((el) => getComputedStyle(el).borderTopStyle);
	expect(borda).toBe('solid');
	expect(await page.locator('.markdown-body svg[id^="mermaid"], .markdown-body img[src^="data:image/svg"], .markdown-body picture svg').count()).toBeGreaterThan(0);
});

test('Busca (HF03): encontra artigo e orienta quando não há resultado', async ({ page }) => {
	await page.goto('/buscar/?q=aten%C3%A7%C3%A3o');
	await expect(page.locator('.resultados a').first()).toBeVisible({ timeout: 15_000 });
	await page.getByLabel('Buscar nos artigos').fill('xyzsemresultado');
	await page.getByRole('button', { name: 'Buscar', exact: true }).click();
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
	await expect(page.locator('.hoje .post-card.destaque')).toBeVisible();
	await page.locator('.hoje .post-card.destaque a').first().click();
	await expect(page.locator('.artigo-hero h1')).toBeVisible();
	await expect(page.locator('.meta-bar')).toContainText('Equipe EXECUTAR');
	await expect(page.locator('.markdown-body')).toContainText('Fontes e aprofundamento');
	await expect(page.getByRole('heading', { name: 'Continue lendo' })).toBeVisible();
	expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Geist');
});

test('Explorar (HF01): filtros por pilar e consciência, com estado vazio', async ({ page }) => {
	await page.goto('/explorar/');
	await expect(page.locator('.post-card:visible')).toHaveCount(3);
	await page.getByRole('button', { name: /C1 · Descoberta/ }).click();
	await expect(page.locator('.post-card:visible')).toHaveCount(1);
	await page.getByRole('button', { name: /P2 · Métodos e gestão/ }).click();
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
	const corpo = await page.locator('.markdown-body p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
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
