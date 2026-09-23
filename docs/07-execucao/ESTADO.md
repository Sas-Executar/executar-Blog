# ESTADO DO PIPELINE

> Atualize a cada estágio. Não dependa da memória da conversa.

**Última atualização:** 2026-09-23
**Estágio atual:** 4 — Implementação
**Plano aprovado:** BLOG-PLAN-001 v3 (Cloudflare templates + Starlight/Obsidian + Apple HIG + Claude Agent SDK)

## Estágios

| # | Estágio | Skill | Status | Evidência |
|---|---|---|---|---|
| 0 | Verificação | — | ✅ concluído | `07-execucao/00-verificacao.md`; plugins `engineering`, `design`, `security-guidance` instalados e declarados em `.claude/settings.json` |
| 1 | System design | engineering:system-design | ✅ concluído | `07-execucao/01-system-design.md` |
| 2 | ADRs | engineering:architecture | ✅ concluído | `02-adr/ADR-001` (Superseded) … `ADR-009` |
| 3 | Estratégia de testes | engineering:testing-strategy | ✅ concluído | `04-testes/plano-de-testes.md` |
| 4 | Implementação | — | 🔄 em andamento | gate 4a resolvido com opção (d) — `07-execucao/04a-spike-shell.md` |
| 5 | Code review | engineering:code-review + design:accessibility-review + security-guidance | ⬜ pendente | |
| 6 | Tech debt | engineering:tech-debt | ⬜ pendente | |
| 7 | Deploy checklist | engineering:deploy-checklist | ⬜ pendente | |
| 8 | Documentação | engineering:documentation | ⬜ pendente | |
| 9 | Preview → Produção | — | ⬜ pendente (USER_ACTION_REQUIRED) | |

Legenda: ⬜ pendente · 🔄 em andamento · ✅ concluído · ⛔ bloqueado

## Decisões abertas

| # | Decisão | Resposta do usuário | Data |
|---|---|---|---|
| D1 | Astro vs. camada Arrow/Vite | Arrow sai. Base = templates Cloudflare (C3) + Astro + Starlight + Starlight Obsidian Theme | 2026-09-23 |
| D2 | Tailwind vs. classes Obsidian/Minimal | Tailwind não reconstrói o shell; não entra no lançamento | 2026-09-23 |
| D3 | HIG + Fluent vs. "sem design system próprio" | **Apple HIG vence**, aplicado transversalmente (tokens + testes). Fluent: só princípios de acessibilidade (pendente confirmação explícita) | 2026-09-23 |
| D4 | Power BI embed | Substituído por alternativa open source → Apache ECharts | 2026-09-23 |
| D5 | Uso de `app.css` em site público | Não usar em produção nem no Git | 2026-09-23 |
| D6 | "twland" / "adotidade" | Tailwind / responsividade e adaptabilidade mobile+web | 2026-09-23 |

## Decisões tomadas

- Limpeza editorial dos artigos (remove IDs, seção 13, "Autor curto", link interno, status; exclui `Sem título.md`, `.obsidian/`, `04-validacao/`).
- Publicação inicial em `*.workers.dev`.
- Tudo no lançamento (gráficos + agente).
- Agente: **Claude Agent SDK** em Cloudflare Sandbox (template oficial `sandbox-sdk/examples/claude-code`), função "Pergunte aos artigos".
- Shell: Starlight + Starlight Obsidian Theme + GitHub Markdown CSS + tokens mínimos.
- Estratégia renomeada: "minimal code, max upstream".
- Gate 4a: opção (d) — Starlight 0.42 estático + CSS/overrides do tema sem Graph View; `/api` via Worker de borda (ADR-002, ADR-003).

## Bloqueios

(vazio) — gate 4a resolvido: usuário escolheu (d) "Atual, sem grafo" em 2026-09-23.

## Pendências de usuário (passo 9)

1. Plano Workers Paid (US$ 5/mês) — exigido por Containers.
2. Conectar repo no Workers Builds (root `apps/blog` e `apps/agente`).
3. `ANTHROPIC_API_KEY` como secret do Worker `agente`.
4. Widget Turnstile (site key + secret).
5. Ativar Web Analytics.
6. Confirmar promoção para produção.
