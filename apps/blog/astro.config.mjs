// @ts-check
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { RECURSOS, hastEditorial, pluginsEditoriais } from '@executar/markdown-parser';
import { indice, urlAsset } from './src/vault.mjs';

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
	vite: { plugins: [tailwindcss()] },
	site: process.env.SITE_URL ?? 'https://executar-blog.sas-executar.workers.dev',
	integrations: [
		starlight({
			title: 'EXECUTAR',
			description: 'Fatores de risco cognitivo na execução: conceitos, processos e controles.',
			defaultLocale: 'root',
			locales: { root: { label: 'Português', lang: 'pt-BR' } },
			// Shell da referência editorial (ADR-019): sem barra lateral nem sumário de documentação —
			// a página inteira segue a estrutura de risco-cognitivo-executar-linkedin-v12-dark-mode.html.
			routeMiddleware: './src/route-data.ts',
			// Ordem das camadas: Tailwind (utilitários, usados no guia de estilo e no dashboard) → tokens
			// do Desyng System e paleta → folha da referência, sem alterações → integração ao blog
			// (ponte de tokens, HIG e o markup que o Markdown do vault gera) → o que a referência não
			// cobre (editorial.css) → ponte HIG final (tokens.css).
			customCss: [
				'@executar/theme/tailwind.css',
				'@fontsource-variable/inter',
				'@executar/theme/ds/variables.css',
				'@executar/theme/ds/theme.css',
				'@executar/theme/cores.css',
				'katex/dist/katex.min.css',
				'@executar/theme/risco-cognitivo.css',
				'@executar/theme/integracao.css',
				'@executar/theme/editorial.css',
				'./src/styles/tokens.css',
			],
			components: {
				PageFrame: './src/components/PageFrame.astro',
				TwoColumnContent: './src/components/TwoColumnContent.astro',
				ContentPanel: './src/components/ContentPanel.astro',
				Pagination: './src/components/Pagination.astro',
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
				PageTitle: './src/components/ArticleHero.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				Head: './src/components/Head.astro',
			},
			// wrap: linhas longas quebram em vez de rolar na horizontal (sem rolagem lateral no celular,
			// e sem região rolável inalcançável por teclado — WCAG 2.1.1 / axe scrollable-region-focusable).
			// Moldura no design system (ADR-017/ADR-018): o bloco de código é um bloco editorial
			// como os outros — rótulo azul em caixa alta, filete, código, filete. Sem caixa, sem raio,
			// sem fundo e sem sombra; o recuo acompanha a coluna de texto.
			expressiveCode: {
				// Starlight usa o primeiro tema em modo claro e o segundo em modo escuro; invertidos, o
				// Expressive Code aplicava a paleta escura sob luz clara e falhava o contraste (axe).
				themes: ['github-light', 'github-dark'],
				defaultProps: { wrap: true },
				styleOverrides: {
					borderRadius: '0',
					borderWidth: '0',
					borderColor: 'var(--border)',
					codeBackground: 'transparent',
					codeFontFamily: 'var(--font-mono)',
					codeFontSize: '0.875rem',
					codeLineHeight: '1.7',
					codePaddingInline: '0',
					uiFontFamily: 'var(--font-sans)',
					frames: {
						shadowColor: 'transparent',
						frameBoxShadowCssValue: 'none',
						editorTabBarBackground: 'transparent',
						editorActiveTabBackground: 'transparent',
						editorActiveTabForeground: 'var(--brand-text)',
						editorActiveTabIndicatorTopColor: 'transparent',
						editorActiveTabIndicatorBottomColor: 'transparent',
						editorTabBarBorderBottomColor: 'transparent',
						terminalBackground: 'transparent',
						terminalTitlebarBackground: 'transparent',
						terminalTitlebarForeground: 'var(--brand-text)',
						terminalTitlebarBorderBottomColor: 'transparent',
						terminalTitlebarDotsOpacity: '0',
					},
				},
			},
		}),
	],
});
