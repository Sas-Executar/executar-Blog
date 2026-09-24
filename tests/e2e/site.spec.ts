import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ARTIGO = '/artigos/sistema-e-arquitetura-de-suporte/tailoring-do-projeto/';
const PAGINAS = ['/', ARTIGO, '/artigos/fatores-de-riscos-cognitivos/', '/perguntar/', '/teste-grafico/'];

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

// O botão claro/escuro precisa funcionar no celular (fica dentro do menu ☰) e os diagramas Mermaid
// precisam seguir o tema escolhido, não o do sistema. Sistema em "dark" de propósito: o botão
// precisa vencer a preferência do aparelho.
test('botão claro/escuro no celular: menu abre, tema troca, diagrama acompanha', async ({ browser }) => {
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
	const page = await ctx.newPage();
	await page.goto(ARTIGO);
	await page.locator('button[popovertarget="starlight__sidebar"]').click();
	const toggle = page.locator('#starlight__sidebar starlight-obsidian-theme-select button').filter({ visible: true }).first();
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

test('21 artigos publicados sem IDs internos', async ({ page }) => {
	await page.goto(ARTIGO);
	const links = await page.locator('.sidebar-content a[href^="/artigos/"]').count();
	expect(links).toBe(21);
	await expect(page.locator('body')).not.toContainText(/FRC-\d|TP-?001|RC-KNW|ARTICLE-MASTER/);
});

test('tabela com estilo GitHub e diagrama renderizado', async ({ page }) => {
	await page.goto(ARTIGO);
	const borda = await page.locator('.markdown-body table td').first().evaluate((el) => getComputedStyle(el).borderTopStyle);
	expect(borda).toBe('solid');
	expect(await page.locator('.markdown-body svg[id^="mermaid"], .markdown-body img[src^="data:image/svg"], .markdown-body picture svg').count()).toBeGreaterThan(0);
});

test('busca (Pagefind) encontra artigo', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /pesquisar/i }).first().click();
	await page.getByRole('dialog').getByRole('textbox').fill('memória prospectiva');
	await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible({ timeout: 15_000 });
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
		await route.fulfill({ json: { resposta: 'Agrupe tarefas semelhantes.', fontes: [{ titulo: 'Troca de tarefas', url: '/artigos/tarefa-e-fluxo-de-execução/troca-de-tarefas/' }] } });
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

test('design editorial (ADR-010): hero do artigo, página Hoje e fonte Geist', async ({ page }) => {
	await page.goto(ARTIGO);
	await expect(page.locator('.artigo-hero h1')).toBeVisible();
	await expect(page.locator('.artigo-hero')).toContainText('min de leitura');
	expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain('Geist');
	await page.goto('/');
	await expect(page.locator('.hoje .lead')).toBeVisible();
	expect(await page.locator('.hoje .row').count()).toBe(20);
});
