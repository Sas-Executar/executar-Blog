# ESTADO DO PIPELINE

> Atualize a cada estágio. Não dependa da memória da conversa.

**Última atualização:** 2026-09-23 19:45 UTC
**Estágio atual:** 9 — Preview → Produção (⛔ USER_ACTION_REQUIRED — issues #2 a #7)
**Plano aprovado:** BLOG-PLAN-001 v3 (Cloudflare templates + Starlight/Obsidian + Apple HIG + Claude Agent SDK)

## Estágios

| # | Estágio | Skill | Status | Evidência |
|---|---|---|---|---|
| 0 | Verificação | — | ✅ concluído | `07-execucao/00-verificacao.md`; plugins `engineering`, `design`, `security-guidance` instalados e declarados em `.claude/settings.json` |
| 1 | System design | engineering:system-design | ✅ concluído | `07-execucao/01-system-design.md` |
| 2 | ADRs | engineering:architecture | ✅ concluído | `02-adr/ADR-001` (Superseded) … `ADR-009` |
| 3 | Estratégia de testes | engineering:testing-strategy | ✅ concluído | `04-testes/plano-de-testes.md` |
| 4 | Implementação | — | ✅ concluído | `npm run check` (0 erros, 21/21 unit, contraste, guard) · `npm run build` · e2e 16/16 · 21 artigos limpos |
| 5 | Code review | engineering:code-review + design:accessibility-review + security-guidance | ✅ concluído | `07-execucao/05-code-review.md` (0 🔴; 6 achados corrigidos) |
| 6 | Tech debt | engineering:tech-debt | ✅ concluído | `07-execucao/06-tech-debt.md` |
| 7 | Deploy checklist | engineering:deploy-checklist | ✅ concluído | `05-deploy/checklist.md` (rollback definido) |
| 8 | Documentação | engineering:documentation | ✅ concluído | `README.md`, `06-docs/onboarding.md`, `06-docs/runbook.md` |
| 9 | Preview → Produção | — | ⛔ aguardando usuário | PR #1 **mesclado em `main`** (f80a392). Issues #2–#7 abertas, uma por pendência. Deploy direto por mim bloqueado: rede desta sessão nega `api.cloudflare.com` (403 de política, não da Cloudflare) |

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

- Passo 9 depende de ações exclusivas do usuário (conta/segredos/painel Cloudflare) — ver Pendências.
- Gate 4a resolvido: usuário escolheu (d) "Atual, sem grafo" em 2026-09-23.
- **Deploy via `wrangler`/API a partir desta sessão: bloqueado.** O usuário gerou um token de API da Cloudflare e eu confirmei a identidade estava correta, mas o próprio ambiente desta sessão nega (403) qualquer conexão de saída a `api.cloudflare.com` — é uma política de rede da sessão, não uma falha da Cloudflare nem do token. Correção: o usuário amplia o acesso de rede desta sessão (menu da sessão → Network access) ou faz os passos do painel ele mesmo (issues #2–#6), que não dependem da minha rede.

## Pendências de usuário (passo 9) — uma issue detalhada por item

1. [#2](https://github.com/Sas-Executar/executar-Blog/issues/2) Plano Workers Paid (US$ 5/mês) — exigido por Containers.
2. [#3](https://github.com/Sas-Executar/executar-Blog/issues/3) Conectar repo no Workers Builds (root `apps/blog` e `apps/agente`).
3. [#4](https://github.com/Sas-Executar/executar-Blog/issues/4) `ANTHROPIC_API_KEY` como secret do Worker `agente`.
4. [#5](https://github.com/Sas-Executar/executar-Blog/issues/5) Turnstile: widget real (site key + secret) — hoje em chave de teste.
5. [#6](https://github.com/Sas-Executar/executar-Blog/issues/6) Ativar Web Analytics.
6. [#7](https://github.com/Sas-Executar/executar-Blog/issues/7) (Opcional) AI Gateway com spend limit.
6. Confirmar promoção para produção.
