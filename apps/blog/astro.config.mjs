// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { RECURSOS, hastEditorial, pluginsEditoriais } from '@executar/markdown-parser';
import { indice, urlAsset } from './src/vault.mjs';

// Tema Obsidian referenciado do pacote npm (ADR-003): CSS + overrides, sem o plugin/Graph View,
// que é incompatível com Astro 7 (ver docs/07-execucao/04a-spike-shell.md).
const theme = (/** @type {string} */ file) => `starlight-theme-obsidian/${file}`;

export default defineConfig({
	// Gramática editorial única (ADR-013): Obsidian + diretivas + chart + math + mermaid, lida
	// direto do vault — a mesma usada pelo Studio (@executar/markdown-parser).
	markdown: {
		processor: satteri({
			features: RECURSOS,
			mdastPlugins: pluginsEditoriais({ indice, urlAsset, avisar: (m) => console.warn(`[vault] ${m}`) }),
			hastPlugins: [hastEditorial()],
		}),
	},
	site: process.env.SITE_URL ?? 'https://executar-blog.sas-executar.workers.dev',
	integrations: [
		starlight({
			title: 'EXECUTAR',
			description: 'Fatores de risco cognitivo na execução: conceitos, processos e controles.',
			defaultLocale: 'root',
			locales: { root: { label: 'Português', lang: 'pt-BR' } },
			// Shell do Showroom: sem barra lateral nem sumário (ADR-012).
			routeMiddleware: './src/route-data.ts',
			customCss: [
				theme('styles/layers.css'),
				theme('styles/theme.css'),
				theme('styles/centered-reading.css'),
				theme('styles/common.css'),
				'@fontsource-variable/geist',
				'@fontsource-variable/geist-mono',
				'@executar/theme/ds/variables.css',
				'@executar/theme/ds/theme.css',
				'@executar/theme/cores.css',
				'katex/dist/katex.min.css',
				'@executar/theme/editorial.css',
				'./src/styles/github.css',
				'./src/styles/tokens.css',
			],
			components: {
				Sidebar: theme('overrides/Sidebar.astro'),
				PageFrame: theme('overrides/PageFrame.astro'),
				Pagination: './src/components/Pagination.astro',
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
				ThemeSelect: theme('overrides/ThemeSelect.astro'),
				PageTitle: './src/components/ArticleHero.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				Head: './src/components/Head.astro',
			},
			// wrap: linhas longas quebram em vez de rolar na horizontal (sem rolagem lateral no celular,
			// e sem região rolável inalcançável por teclado — WCAG 2.1.1 / axe scrollable-region-focusable).
			expressiveCode: { themes: ['github-dark', 'github-light'], defaultProps: { wrap: true } },
		}),
	],
});
