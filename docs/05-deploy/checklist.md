# Deploy checklist — Blog EXECUTAR (Cloudflare Workers)

**Skill:** `engineering:deploy-checklist` · **Data:** 2026-09-23 · **Deployer:** usuário (painel) + Claude Code (preparação/verificação)

> O blog sobe sozinho: o service binding `AGENTE` fica fora do `apps/blog/wrangler.jsonc` até o Worker `executar-agente` existir (a Cloudflare recusa binding para Worker inexistente — erro 10143). Depois do agente publicado, reacrescente o binding (comentário no `wrangler.jsonc`) e rode `npm run cf-typegen -w apps/blog`.

## Pré-deploy
- [ ] CI verde no PR (check, build, conteúdo em dia, e2e) — ver aba Checks do PR
- [ ] Code review sem 🔴 (`docs/07-execucao/05-code-review.md`)
- [ ] Conta Cloudflare no **Workers Paid** (US$ 5/mês) — exigido por Containers (agente)
- [ ] `ANTHROPIC_API_KEY` criada em console.anthropic.com
- [ ] Widget **Turnstile** criado (Painel → Turnstile → Add widget; hostname `*.workers.dev` ou domínio) → anotar *site key* e *secret key*
- [ ] (Opcional, recomendado) **AI Gateway** criado com *spend limit* → URL `https://gateway.ai.cloudflare.com/v1/<account>/<gateway>/anthropic`
- [ ] Rollback entendido (abaixo)

## Configuração única no painel (Workers & Pages → Create → Import a repository → `Sas-Executar/executar-Blog`)

| Campo | Worker `executar-agente` | Worker `executar-blog` |
|---|---|---|
| Project name | `executar-agente` (igual ao `name` do wrangler) | `executar-blog` |
| Root directory | `apps/agente` | `apps/blog` |
| Build command | `cd ../.. && npm ci` | `cd ../.. && npm ci && npm run build -w apps/blog` |
| Deploy command | `npx wrangler deploy` | `npx wrangler deploy` |
| Non-production branch deploy | desligado (sem URL pública) | `npx wrangler versions upload` (preview por PR) |
| Build variables | — | `PUBLIC_TURNSTILE_SITE_KEY=<site key real>` |
| Secrets (Settings → Variables and Secrets) | `ANTHROPIC_API_KEY` | `TURNSTILE_SECRET_KEY` |
| Variables | `AI_GATEWAY_URL` (opcional) | — |

Alternativa por terminal (com `CLOUDFLARE_API_TOKEN`): `cd apps/agente && npx wrangler secret put ANTHROPIC_API_KEY && npx wrangler deploy`; depois `cd apps/blog && npx wrangler secret put TURNSTILE_SECRET_KEY && PUBLIC_TURNSTILE_SITE_KEY=... npm run deploy`.

## Deploy
- [ ] Deploy do agente concluído (Builds → log sem erro; primeira subida do container leva 2–3 min)
- [ ] Deploy do blog concluído
- [ ] Smoke: `BASE_URL=https://executar-blog.<conta>.workers.dev npm run test:e2e`
- [ ] Pergunta real em `/perguntar/` responde com fonte; anotar latência (fria e quente) no `ESTADO.md`
- [ ] Web Analytics ativado (Painel → Web Analytics → Add site → hostname do blog)

## Pós-deploy
- [ ] Workers Logs sem erros por 15 min (Painel → Worker → Logs)
- [ ] AI Gateway mostrando requisições e custo
- [ ] `ESTADO.md` atualizado com URLs e evidências

## Gatilhos de rollback
- Página inicial ou artigo retorna ≠ 200
- axe/e2e falhando contra a URL pública
- `/api/perguntar` com erro 5xx > 20% em 15 min (agente pode ser desativado sem afetar o blog)

## Rollback
- Painel → Worker → **Deployments** → versão anterior → *Rollback*; ou `npx wrangler rollback` no diretório do app.
- Agente com problema: remover o secret/rota não é necessário — o blog responde 503 amigável e segue servindo artigos.
