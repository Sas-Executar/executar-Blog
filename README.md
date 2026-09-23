# EXECUTAR — Blog

Blog sobre **fatores de risco cognitivo na execução**: 21 artigos, busca, gráficos e um assistente que responde **só com base nos artigos**. Roda no **Cloudflare Workers**.

- **Shell editorial:** [Starlight](https://starlight.astro.build) + CSS/componentes do [Starlight Obsidian Theme](https://github.com/Fevol/starlight-theme-obsidian) + [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css)
- **Conteúdo:** Markdown em `vault/` (abre no Obsidian), publicado pelo [starlight-obsidian](https://github.com/HiDeoo/starlight-obsidian)
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
| `npm run content:sync` | Regenera as páginas a partir do `vault/` |
| `npm run update:upstream` | Atualiza dependências e revalida |

## Estrutura

```
vault/            artigos (fonte editorial, compatível com Obsidian)
apps/blog/        site Starlight + Worker de borda (/api/perguntar)
apps/agente/      Worker + container do assistente (Claude Agent SDK)
scripts/          setup-env, import-content, guard, check-contrast
tests/            unit (node:test) e e2e (Playwright + axe)
docs/             ADRs, plano de testes, deploy, runbook, estado do pipeline
```

## Documentação
- [Onboarding](docs/06-docs/onboarding.md) · [Runbook](docs/06-docs/runbook.md) · [Deploy](docs/05-deploy/checklist.md)
- [Decisões (ADRs)](docs/02-adr/) · [Estado do pipeline](docs/07-execucao/ESTADO.md)
- Regras para agentes: [CLAUDE.md](CLAUDE.md)
