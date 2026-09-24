import { defineConfig, devices } from '@playwright/test';

// Em CI: `npx playwright install --with-deps chromium`. Em ambientes com Chromium pré-instalado
// de outra versão, defina PW_CHROMIUM_PATH (ex.: /opt/pw-browsers/chromium).
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const baseURL = process.env.BASE_URL ?? 'http://localhost:4321';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: { baseURL, launchOptions: { executablePath } },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } }],
	webServer: [
		...(process.env.BASE_URL
			? []
			: [
					{
						// wrangler dev = mesmo runtime (workerd) e servidor de assets da produção.
						command: 'E2E_FIXTURES=1 npm run build -w apps/blog && cd apps/blog && npx wrangler dev --port 4321',
						url: baseURL,
						reuseExistingServer: !process.env.CI,
						timeout: 300_000,
					},
				]),
		...(process.env.STUDIO_URL
			? []
			: [
					{
						// Studio com os cabeçalhos reais (_headers: COOP/COEP para o WebAssembly); a API é simulada no teste.
						command: 'npm run build -w apps/studio && cd apps/studio && npx wrangler dev --port 4400',
						url: 'http://localhost:4400',
						reuseExistingServer: !process.env.CI,
						timeout: 300_000,
					},
				]),
	],
});
