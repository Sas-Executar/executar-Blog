# Gate 4a — Spike do shell (Starlight + Obsidian Theme)

**Data:** 2026-09-23 · **Status:** ⛔ BLOQUEADO — aguarda decisão do usuário
**Local:** scratchpad (fora do repo). Vault de teste: 2 artigos brutos (sem limpeza).

| # | Combinação | Resultado | Causa |
|---|---|---|---|
| 1 | Astro 7.3.4 + Starlight 0.42.3 + `@astrojs/cloudflare` 14.3.3 + tema 0.4.1 (plugin) | ❌ | `starlight-site-graph` 0.5.0 (dependência obrigatória do tema) incompatível com zod 4: "Invalid input: expected map, received object". Override de `astro-integration-kit` → 0.20.0 não resolve |
| 2 | **Baseline oficial** Starlight 0.42.3 + adapter Cloudflare 14.3.3 (sem tema) | ❌ | Bug upstream: Rolldown não resolve `@bruits/satteri-wasm32-wasi` (satteri/browser.js). `rolldownOptions.external` não resolve |
| 3 (a) | **Versões travadas**: Astro 5.16 + Starlight 0.36.3 + adapter 12.6 + tema 0.4.1 + site-graph 0.5.0 + engine 0.10.1 | ✅ build verde | Tema completo com Graph View. Evidência: `evidencias/4a-opcao-a-travada-light.png` |
| 4 (d) | **Estático atual**: Astro 7.3.4 + Starlight 0.42.3 + engine 0.15.0 + CSS e overrides do tema (Sidebar, PageFrame, Pagination, ThemeSelect) sem plugin/grafo, sem adapter | ✅ build verde | Visual Obsidian sem Graph View/backlinks. Evidência: `evidencias/4a-opcao-d-estatico-atual-dark.png` |

## Outros achados
- **Mermaid** (engine) exige Chromium no build (`rehype-mermaid`/Playwright) — falhou por versão de navegador ausente. Plano B do plano (gerar no CI e `skipGeneration`) continua válido.
- Engine exige `.obsidian/app.json` no vault.
- Proxy desta sessão bloqueia tarballs do GitHub (`codeload.github.com` 403); templates obtidos via `git clone` (mesmo conteúdo que o C3 usaria).
