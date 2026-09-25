# EXECUTAR — Blog

Blog sobre **fatores de risco cognitivo na execução**: artigos, busca, gráficos e um assistente que responde **só com base nos artigos**. Roda no **Cloudflare Workers**.

- **Shell editorial:** [Starlight](https://starlight.astro.build) + CSS/componentes do [Starlight Obsidian Theme](https://github.com/Fevol/starlight-theme-obsidian) + [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css)
- **Conteúdo:** um arquivo Markdown por artigo em `vault/` (abre no Obsidian), lido direto pelo blog com a gramática editorial única ([ADR-013](docs/02-adr/ADR-013.md), [sintaxe](docs/06-docs/EDITORIAL-SYNTAX-SPEC.md))
- **Studio:** editor com preview idêntico ao blog, validação, publicação no GitHub e MCP ([ADR-014](docs/02-adr/ADR-014.md))
- **Design:** regras do [Apple HIG](https://developer.apple.com/design/human-interface-guidelines) aplicadas por tokens e verificadas por testes
- **Assistente:** [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk) em [Cloudflare Sandbox](https://developers.cloudflare.com/sandbox/)
- **Gráficos:** [Apache ECharts](https://echarts.apache.org)

## Quick start (< 5 min)

```bash
npm install          # instala tudo e cria os .env de desenvolvimento
npm run dev          # abre o blog em http://localhost:4321
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run check` | Tipos, testes unitários, contraste HIG e guardrails |
| `npm run build` | Build do blog e validação do agente |
| `npm run test:e2e` | Testes no navegador (acessibilidade, HIG, busca, assistente) |
| `npm run export:epub -- "vault/…md"` | Gera EPUB 3 (`export:pdf` gera PDF a partir do blog local) |
| `npm run update:upstream` | Atualiza dependências e revalida |
| `npm run ops:validate` | Valida workflows, rotinas e áreas em `ops/` (também roda no `check`) |
| `npm run report:sync -- --de ../Copiloto` | Traz templates e tokens de relatório da skill `executar-relatorios` (commit fixado) |

## Estrutura

```
vault/            artigos (fonte editorial, compatível com Obsidian)
apps/blog/        site Starlight + Worker de borda (/api/perguntar)
apps/agente/      Worker + container do assistente (Claude Agent SDK)
apps/studio/      EXECUTAR Studio: editor, preview, Publish API e MCP
apps/copiloto/    Copiloto Operacional: comandos por e-mail, campanhas com gates, reports HTML/PDF (ADR-015)
ops/              workflows, rotinas, runbooks e áreas versionados (mudam só por PR)
packages/         markdown-parser, editorial-renderer, content-schema, theme, ui
scripts/          setup-env, guard, check-contrast, export
tests/            unit (node:test) e e2e (Playwright + axe)
docs/             ADRs, plano de testes, deploy, runbook, estado do pipeline
```

## Documentação
- [Onboarding](docs/06-docs/onboarding.md) · [Runbook](docs/06-docs/runbook.md) · [Deploy](docs/05-deploy/checklist.md) · [Copiloto Operacional](docs/06-docs/COPILOTO-OPERACIONAL.md)
- [Decisões (ADRs)](docs/02-adr/) · [Estado do pipeline](docs/07-execucao/ESTADO.md)
- Regras para agentes: [CLAUDE.md](CLAUDE.md)
