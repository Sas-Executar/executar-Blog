import { expect, test } from '@playwright/test';

// Regras mensuráveis do Apple HIG (ADR-006).
const ARTIGO = '/artigos/sistema-e-arquitetura-de-suporte/tailoring-do-projeto/';

test('texto do corpo ≥ 17 pt e nenhum texto visível < 11 pt', async ({ page }) => {
	await page.goto(ARTIGO);
	const corpo = await page.locator('.markdown-body p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
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

test('alvos de toque da navegação e controles ≥ 44 pt', async ({ page }) => {
	await page.goto(ARTIGO);
	const pequenos = await page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>('.sidebar-content a, .right-sidebar a, button, starlight-theme-select select')]
			.filter((el) => el.offsetParent !== null)
			.map((el) => ({ t: el.textContent?.trim().slice(0, 30), h: el.getBoundingClientRect().height }))
			.filter((r) => r.h < 44),
	);
	expect(pequenos).toEqual([]);
});

for (const width of [375, 640, 768, 1280]) {
	test(`sem rolagem horizontal em ${width}px (640px ≈ zoom 200%)`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		for (const url of ['/', ARTIGO, '/perguntar/']) {
			await page.goto(url);
			const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
			expect(overflow, url).toBeLessThanOrEqual(0);
		}
	});
}

test('Reduce Motion desliga transições', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(ARTIGO);
	const dur = await page.locator('.sidebar-content a').first().evaluate((el) => getComputedStyle(el).transitionDuration);
	expect(dur.split(',').every((d) => parseFloat(d) <= 0.001)).toBe(true);
});

test('Increase Contrast escurece o texto', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light', contrast: 'more' } as never);
	await page.goto(ARTIGO);
	await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
	const fg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim());
	expect(['#000', '#000000']).toContain(fg);
});
