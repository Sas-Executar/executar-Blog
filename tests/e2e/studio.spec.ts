// EXECUTAR Studio (ADR-014): editar → preview com o mesmo renderer do blog → validar → publicar.
// O Worker/GitHub é simulado com page.route; o teste cobre a interface e o contrato da Publish API.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const STUDIO = process.env.STUDIO_URL ?? 'http://localhost:4400';
const ARTIGO = '---\ntitle: Um\ndescription: Resumo.\n---\n\n> [!tip] Dica\n> ok ==destaque== [[Outro]]\n\n:::toggle[Abrir]\ncorpo\n:::\n\n$x^2$\n';

test.beforeEach(async ({ page }) => {
	await page.route('**/api/eu', (r) => r.fulfill({ json: { email: 'eu@executar.dev' } }));
	await page.route('**/api/artigos', (r) => r.fulfill({ json: { artigos: ['Lab/Um.md'] } }));
	await page.route('**/api/indice', (r) => r.fulfill({ json: { arquivos: [{ caminho: 'Lab/Outro.md', conteudo: '---\ntitle: Outro\n---' }] } }));
	await page.route('**/api/artigo?*', (r) => r.fulfill({ json: { caminho: 'Lab/Um.md', conteudo: ARTIGO } }));
	await page.goto(STUDIO);
	await page.evaluate(() => localStorage.clear());
});

test('abre artigo e o preview usa a gramática editorial (WebAssembly)', async ({ page }) => {
	expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
	await page.getByRole('button', { name: 'Lab/Um.md' }).click();
	const preview = page.locator('#preview');
	await expect(preview.locator('aside.callout mark')).toHaveText('destaque');
	await expect(preview.locator('a.wikilink')).toHaveAttribute('href', '/blog/lab/outro/');
	await expect(preview.locator('details.toggle summary')).toHaveText('Abrir');
	await expect(preview.locator('.katex')).toBeVisible();
	await expect(page.locator('#validacao')).toHaveText('Tudo certo.');
	await expect(page.locator('#p-title')).toHaveValue('Um');
	expect((await new AxeBuilder({ page }).analyze()).violations.map((v) => v.id)).toEqual([]);
});

test('validação aponta erro e propriedades reescrevem o frontmatter', async ({ page }) => {
	await page.getByRole('button', { name: 'Lab/Um.md' }).click();
	await page.locator('#markdown').fill('---\ntitle: Só título\n---\n\nTexto');
	await expect(page.locator('#validacao .erro')).toContainText('description');
	await page.locator('#p-description').fill('Agora tem.');
	await page.locator('#p-description').blur();
	await expect(page.locator('#markdown')).toHaveValue(/description: Agora tem\./);
	await expect(page.locator('#validacao')).toHaveText('Tudo certo.');
});

test('publicar em rascunho envia o contrato da Publish API e mostra o resultado', async ({ page }) => {
	let pedido: Record<string, unknown> = {};
	await page.route('**/api/publicar', async (r) => {
		pedido = r.request().postDataJSON();
		await r.fulfill({ json: { ok: true, modo: 'draft', ramo: 'rascunho/lab-um', nota: 'Rascunho guardado no GitHub (não aparece no site).', url: null } });
	});
	await page.getByRole('button', { name: 'Lab/Um.md' }).click();
	await page.getByRole('button', { name: 'Rascunho' }).click();
	await expect(page.getByRole('status')).toContainText('Rascunho guardado');
	expect(pedido).toMatchObject({ modo: 'draft', caminho: 'Lab/Um.md', markdown: ARTIGO, assets: [] });
});

test('rascunho local sobrevive ao recarregar', async ({ page }) => {
	await page.getByRole('button', { name: 'Lab/Um.md' }).click();
	await page.locator('#markdown').fill(`${ARTIGO}\nParágrafo novo.`);
	await page.waitForTimeout(400);
	await page.reload();
	await page.getByRole('button', { name: 'Lab/Um.md' }).click();
	await expect(page.locator('#markdown')).toHaveValue(/Parágrafo novo\./);
});
