// EXECUTAR Studio (ADR-014): editar → preview com o mesmo renderer do blog → validar → publicar.
// O Worker/GitHub é simulado com page.route; o teste cobre a interface e o contrato da Publish API.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const STUDIO = process.env.STUDIO_URL ?? 'http://localhost:4400';
const ARTIGO = '---\ntitle: Um\ndescription: Resumo.\n---\n\n> [!tip] Dica\n> ok ==destaque== [[Outro]]\n\n:::toggle[Abrir]\ncorpo\n:::\n\n$x^2$\n';

/**
 * Abre um artigo e espera o conteúdo chegar: o clique dispara fetch('/api/artigo') e só depois
 * abrir() preenche o editor. Sem esta espera, um fill() feito antes é sobrescrito (corrida que
 * aparece no runner do CI, mais lento que a máquina local).
 */
async function abrirArtigo(page: import('@playwright/test').Page, caminho: string) {
	await page.getByRole('button', { name: caminho }).click();
	await expect(page.locator('#caminho')).toHaveValue(caminho);
	await expect(page.getByRole('button', { name: caminho })).toHaveAttribute('aria-current', 'true');
}

test.beforeEach(async ({ page }) => {
	await page.route('**/api/eu', (r) => r.fulfill({ json: { email: 'eu@executar.dev', papel: 'editor', blog: 'https://blog.test' } }));
	await page.route('**/api/artigos', (r) => r.fulfill({ json: { artigos: ['Lab/Um.md', 'Lab/Dois.md'] } }));
	await page.route('**/api/indice', (r) => r.fulfill({ json: { arquivos: [{ caminho: 'Lab/Outro.md', conteudo: '---\ntitle: Outro\n---' }] } }));
	await page.route('**/api/artigo?*', (r) => {
		const dois = r.request().url().includes('Dois');
		return r.fulfill({ json: { caminho: dois ? 'Lab/Dois.md' : 'Lab/Um.md', conteudo: dois ? ARTIGO.replace('title: Um', 'title: Dois') : ARTIGO, sha: 'aaa111' } });
	});
	await page.goto(STUDIO);
	await page.evaluate(() => localStorage.clear());
	// O Studio só fica pronto depois de carregar o parser em WebAssembly e a lista de artigos.
	await expect(page.locator('#eu')).toContainText('@');
	await expect(page.locator('#preview')).not.toBeEmpty();
});

test('abre artigo e o preview usa a gramática editorial (WebAssembly)', async ({ page }) => {
	expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
	await abrirArtigo(page, 'Lab/Um.md');
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
	await abrirArtigo(page, 'Lab/Um.md');
	await page.locator('#markdown').fill('---\ntitle: Só título\n---\n\nTexto');
	await expect(page.locator('#validacao .erro')).toContainText('description');
	await page.locator('#p-description').fill('Agora tem.');
	await page.locator('#p-description').blur();
	await expect(page.locator('#markdown')).toHaveValue(/description: Agora tem\./);
	await expect(page.locator('#validacao')).toHaveText('Tudo certo.');
});

test('publicar em rascunho envia o contrato da Publish API e mostra o resultado', async ({ page }) => {
	let pedido: Record<string, unknown> = {};
	await page.route('**/api/status?*', (r) => r.fulfill({ json: { estado: 'sucesso', runs: [] } }));
	await page.route('**/api/publicar', async (r) => {
		pedido = r.request().postDataJSON();
		await r.fulfill({ json: { ok: true, modo: 'draft', ramo: 'rascunho/lab-um', commit: 'abc1234def', nota: 'Rascunho guardado no GitHub (não aparece no site).', url: null } });
	});
	await abrirArtigo(page, 'Lab/Um.md');
	await page.getByRole('button', { name: 'Rascunho' }).click();
	await expect(page.getByRole('status')).toContainText('Rascunho guardado');
	await expect(page.getByRole('status')).toContainText('Commit abc1234 · build: sucesso');
	expect(pedido).toMatchObject({ modo: 'draft', caminho: 'Lab/Um.md', markdown: ARTIGO, assets: [], shaOriginal: 'aaa111' });
});

test('rascunho local sobrevive ao recarregar', async ({ page }) => {
	await abrirArtigo(page, 'Lab/Um.md');
	await page.locator('#markdown').fill(`${ARTIGO}\nParágrafo novo.`);
	// Espera o autosave de fato gravar (debounce + render em WebAssembly), em vez de um tempo fixo.
	await expect.poll(() => page.evaluate(() => localStorage.getItem('studio-rascunho:Lab/Um.md') ?? '')).toContain('Parágrafo novo.');
	await page.reload();
	await abrirArtigo(page, 'Lab/Um.md');
	await expect(page.locator('#markdown')).toHaveValue(/Parágrafo novo\./);
});

test('rota prevista, preview abaixo de 1 s e conflito explicado', async ({ page }) => {
	await page.route('**/api/publicar', (r) => r.fulfill({ status: 409, json: { erro: 'Este artigo foi alterado por outra pessoa depois que você o abriu.', conflito: true } }));
	await abrirArtigo(page, 'Lab/Um.md');
	await expect(page.locator('#rota')).toHaveText('Endereço: https://blog.test/blog/lab/um/');
	await expect(page.locator('#tempo-preview')).toHaveText(/preview em \d+ ms/);
	const ms = Number((await page.locator('#tempo-preview').innerText()).match(/\d+/)![0]);
	expect(ms).toBeLessThan(1000);
	page.once('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'Publicar', exact: true }).click();
	await expect(page.getByRole('status')).toContainText('alterado por outra pessoa');
});

test('autor não vê o botão Publicar (RBAC)', async ({ page }) => {
	await page.route('**/api/eu', (r) => r.fulfill({ json: { email: 'a@x', papel: 'autor', blog: 'https://blog.test' } }));
	await page.reload();
	await expect(page.locator('#eu')).toContainText('autor');
	await expect(page.getByRole('button', { name: 'Abrir PR' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Publicar', exact: true })).toBeHidden();
});

test('comando "/" insere bloco pelo teclado', async ({ page }) => {
	const editor = page.locator('#markdown');
	await editor.fill('---\ntitle: x\ndescription: y\n---\n\n');
	await editor.press('End');
	await editor.pressSequentially('/aba');
	await expect(page.getByRole('option', { name: 'Abas' })).toBeVisible();
	await editor.press('Enter');
	await expect(editor).toHaveValue(/::::tabs\n:::tab\[Primeira\]/);
	await expect(page.locator('#preview [role="tablist"]')).toBeVisible();
});

test('histórico abre versão antiga para restaurar', async ({ page }) => {
	await page.route('**/api/historico?*', (r) => r.fulfill({ json: { versoes: [{ sha: 'bbb2222', data: '2026-09-20T10:00:00Z', autor: 'eu@x', mensagem: 'conteúdo: publica', url: 'u' }] } }));
	await page.route('**/api/versao?*', (r) => r.fulfill({ json: { conteudo: ARTIGO.replace('Resumo.', 'Resumo antigo.'), sha: 'x' } }));
	await abrirArtigo(page, 'Lab/Um.md');
	await page.getByRole('button', { name: 'Ver versões' }).click();
	await page.getByRole('button', { name: 'Abrir esta versão' }).click();
	await expect(page.locator('#markdown')).toHaveValue(/Resumo antigo\./);
	await expect(page.getByRole('status')).toContainText('Publique para restaurá-la');
});

test('eBook: escolhe artigos, ordena capítulos e baixa EPUB', async ({ page }) => {
	await page.getByRole('checkbox', { name: 'Incluir “Lab/Um.md” no eBook' }).check();
	await page.getByRole('checkbox', { name: 'Incluir “Lab/Dois.md” no eBook' }).check();
	await page.getByRole('button', { name: 'Subir: Dois' }).click();
	await expect(page.locator('#livro li span')).toHaveText(['Dois', 'Um']);
	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: 'EPUB', exact: true }).click();
	const arquivo = await download;
	expect(arquivo.suggestedFilename()).toBe('EXECUTAR.epub');
	const bytes = await (await import('node:fs')).promises.readFile((await arquivo.path())!);
	const texto = bytes.toString('utf8');
	expect(texto.indexOf('>Dois</a>')).toBeLessThan(texto.indexOf('>Um</a>'));
	expect(texto).toContain('OEBPS/capitulo-2.xhtml');
});
