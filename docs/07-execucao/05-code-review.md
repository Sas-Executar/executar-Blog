# Estágio 5 — Code review

**Skills:** `engineering:code-review` (segurança, performance, correção, manutenção) + `design:accessibility-review` + `security-guidance` · **Data:** 2026-09-23 · **Gate:** zero 🔴 — ✅

## Resumo
Mudança pequena em código próprio (~450 linhas entre scripts, Workers e componentes); o restante é configuração de upstream. Três achados corrigidos na própria revisão; nenhum crítico em aberto.

## Achados

| # | Arquivo | Achado | Severidade | Status |
|---|---|---|---|---|
| 1 | `apps/blog/worker/index.ts` | Falha de rede no Turnstile lançava exceção (500) em vez de negar | 🟡 Médio | ✅ corrigido: fail closed (403) + teste |
| 2 | `apps/blog/worker/index.ts` | Token Turnstile sem limite de tamanho | 🟢 Baixo | ✅ corrigido (≤ 2048) |
| 3 | `apps/agente/src/index.ts` | Container sem internet: tráfego não essencial do Agent SDK causaria esperas | 🟡 Médio | ✅ `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1` |
| 4 | `apps/blog/public/_headers` | Sem cabeçalhos de segurança | 🟢 Baixo | ✅ nosniff, referrer, frame DENY, permissions |
| 5 | `Grafico.astro` | ECharts sobrescrevia `aria-label` com texto automático em inglês (HIG: título + resumo) | 🟡 Médio | ✅ corrigido durante e2e |
| 6 | `Perguntar.astro` | Botão em dark com contraste 3,65:1 | 🟡 Médio | ✅ token `--on-accent` + `check-contrast` |

## Verificações de segurança
| Item | Resultado |
|---|---|
| Injeção de shell na pergunta | `shellQuote` (padrão do template oficial); pergunta limitada a 500 caracteres |
| XSS na resposta do agente | Renderização via `textContent`; URLs das fontes geradas por `toArticle` (sempre `/artigos/...`) |
| Segredos | Chave só no Worker; container vê placeholder; `guard` varre `dist/` por `sk-ant-` e valores do `.env` |
| Prompt injection | Agente só tem Read/Grep/Glob sobre conteúdo já público; sem rede exceto `api.anthropic.com` |
| Abuso/custo | Turnstile + rate limit 5/min/IP + `maxTurns: 12` + spend limit no AI Gateway (configuração no painel) |
| Arquivos proibidos | `guard`: sem `app.css`, `.env`, `.dev.vars` versionados |

## Acessibilidade (design:accessibility-review)
axe sem violações sérias/críticas em 5 páginas × 2 temas; regras HIG testadas (17 pt, 44 pt, 4,5:1, 200%, reduce motion, increase contrast).

## Evidência
`npm run check` (0 erros, 21/21 unit, contraste, guard) · `npm run build` · `npm run test:e2e` 16/16.
