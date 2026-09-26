import { expect, test } from '@playwright/test';

// Regras mensuráveis do Apple HIG (ADR-006).
const ARTIGO = '/blog/fatores-de-riscos-cognitivos/';

test('texto do corpo ≥ 17 pt e nenhum texto visível < 11 pt', async ({ page }) => {
	await page.goto(ARTIGO);
	// Corpo = parágrafos de texto; o rótulo do callout é overline (11 pt, permitido pelo HIG).
	const corpo = await page.locator('.markdown-body p:not(.callout__titulo)').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	expect(corpo).toBeGreaterThanOrEqual(17);
	const menores = await page.evaluate(() =>
		[...document.querySelectorAll('body *')]
			.filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()))
			.filter((el) => (el as HTMLElement).offsetParent !== null)
			.filter((el) => parseFloat(getComputedStyle(el).fontSize) < 11)
			.map((el) => `${el.tagName}.${el.className}: ${el.textContent!.trim().slice(0, 30)}`),
	);
	expect(menores).toEqual([]);
});

for (const url of [ARTIGO, '/guia-de-estilo/']) {
	test(`alvos de toque da navegação e controles ≥ 44 pt — ${url}`, async ({ page }) => {
		await page.goto(url);
		const pequenos = await page.evaluate(() =>
			[...document.querySelectorAll<HTMLElement>('.cabecalho a, .barra-inferior a, .trilha a, button, starlight-theme-select select')]
				.filter((el) => el.offsetParent !== null)
				.map((el) => ({ t: el.textContent?.trim().slice(0, 30), h: el.getBoundingClientRect().height }))
				.filter((r) => r.h < 44),
		);
		expect(pequenos).toEqual([]);
	});
}

for (const width of [375, 640, 768, 1280]) {
	test(`sem rolagem horizontal em ${width}px (640px ≈ zoom 200%)`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		for (const url of ['/', ARTIGO, '/perguntar/', '/explorar/', '/buscar/', '/salvos/', '/preferencias/', '/guia-de-estilo/']) {
			await page.goto(url);
			const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
			expect(overflow, url).toBeLessThanOrEqual(0);
		}
	});
}

test('Reduce Motion desliga transições', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(ARTIGO);
	const dur = await page.locator('.post-card').first().evaluate((el) => getComputedStyle(el).transitionDuration);
	expect(dur.split(',').every((d) => parseFloat(d) <= 0.001)).toBe(true);
});

test('Increase Contrast escurece o texto', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light', contrast: 'more' } as never);
	await page.goto(ARTIGO);
	await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
	const fg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim());
	expect(['#000', '#000000']).toContain(fg);
});

test('barra inferior no celular: 5 seções com alvo ≥ 44 pt e página atual marcada', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/explorar/');
	const abas = page.locator('.barra-inferior a');
	await expect(abas).toHaveCount(5);
	for (const box of await abas.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(box).toBeGreaterThanOrEqual(44);
	await expect(page.locator('.barra-inferior a[aria-current="page"]')).toHaveText(/Explorar/);
});
