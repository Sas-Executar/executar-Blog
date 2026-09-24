// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { createStarlightObsidianPlugin } from 'starlight-obsidian';

const [starlightObsidian, obsidianSidebarEntries] = createStarlightObsidianPlugin();

// Tema Obsidian referenciado do pacote npm (ADR-003): CSS + overrides, sem o plugin/Graph View,
// que é incompatível com Astro 7 (ver docs/07-execucao/04a-spike-shell.md).
const theme = (/** @type {string} */ file) => `starlight-theme-obsidian/${file}`;

export default defineConfig({
	site: process.env.SITE_URL ?? 'https://executar-blog.workers.dev',
	integrations: [
		starlight({
			title: 'EXECUTAR',
			description: 'Fatores de risco cognitivo na execução: conceitos, processos e controles.',
			defaultLocale: 'root',
			locales: { root: { label: 'Português', lang: 'pt-BR' } },
			plugins: [
				starlightObsidian({
					vault: '../../vault',
					output: 'artigos',
					copyFrontmatter: 'starlight',
					// Páginas geradas são commitadas; o build na Cloudflare não gera (ADR-004).
					skipGeneration: !process.env.OBSIDIAN_GENERATE,
				}),
			],
			sidebar: [{ label: 'Artigos', items: [obsidianSidebarEntries] }],
			customCss: [
				theme('styles/layers.css'),
				theme('styles/theme.css'),
				theme('styles/centered-reading.css'),
				theme('styles/common.css'),
				'./src/styles/github.css',
				'./src/styles/tokens.css',
			],
			components: {
				Sidebar: theme('overrides/Sidebar.astro'),
				PageFrame: theme('overrides/PageFrame.astro'),
				Pagination: theme('overrides/Pagination.astro'),
				ThemeSelect: theme('overrides/ThemeSelect.astro'),
				MarkdownContent: './src/components/MarkdownContent.astro',
				Head: './src/components/Head.astro',
			},
			// wrap: linhas longas quebram em vez de rolar na horizontal (sem rolagem lateral no celular,
			// e sem região rolável inalcançável por teclado — WCAG 2.1.1 / axe scrollable-region-focusable).
			expressiveCode: { themes: ['github-dark', 'github-light'], defaultProps: { wrap: true } },
		}),
	],
});
