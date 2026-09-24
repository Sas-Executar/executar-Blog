# ESTADO DO PIPELINE

> Atualize a cada estágio. Não dependa da memória da conversa.

**Última atualização:** 2026-09-23 21:15 UTC
**Estágio atual:** 9 — Preview → Produção (⛔ USER_ACTION_REQUIRED — caminho agora é o import pelo painel, issue #3)
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
| 9 | Preview → Produção | — | ⛔ aguardando usuário | PR #1 **mesclado em `main`** (f80a392). Issues #2–#7 abertas. Deploy por `wrangler` a partir de uma sessão Claude Code: **inviável estruturalmente** (ver Bloqueios). Caminho recomendado: import pelo painel (issue #3) |

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

## Design editorial (ADR-010) — 2026-09-24 — VERIFIED (local)

- Decisão do usuário: opções **A+B** do `docs/03-design/plano-refatoracao-design.md`, **manter Astro** (o app Next.js do pacote de design não entra) e **Geist em tudo**.
- Fonte da verdade visual: `docs/03-design/sot/` (telas 02/05/06 + referência editorial + `visual-contract.yml`).
- Feito: Geist (`@fontsource-variable/geist*`), tokens do pacote em `tokens.css`, hero do artigo (`ArticleHero.astro`, override de `PageTitle`), callouts/citações/gráficos em cartões suaves, página Hoje (`Hoje.astro`), bloco ` ```chart ` (`src/plugins/chart.mjs`, plugin do Sätteri) e os 21 gráficos do vault migrados.
- Evidência: `npm run check` (0 erros, 25 testes unitários, contraste 9 pares × 4 modos, guard ok), `npm run build` ok, `npm run test:e2e` 18/18.
- Limitação: `content:sync` não roda nesta sessão, porque o Mermaid precisa do Chromium 1243 e só há o 1194. As páginas geradas receberam a mesma troca figure → chart aplicada ao vault; o próximo `content:sync` com Chromium gera o mesmo resultado. O tema lilás do Mermaid (opção A) fica para quando o sync rodar.
- Fora do escopo: Explorar, Categoria, Salvos, Preferências e BottomNav.

## Nova conta Cloudflare (2026-09-24)

- O usuário criou uma conta nova, `Sas_executar@outlook.com's Account` (`99b69…`), para um build e deploy do zero. A conta antiga (`92fdc…`, Worker `executar-blogg`) fica desativada para este fluxo.
- Estado lido via MCP do plugin `cloudflare`: nenhum Worker e subdomínio `sas-executar`. URL prevista: `https://executar-blog.sas-executar.workers.dev` (padrão de `site` no `astro.config.mjs`).
- `wrangler deploy` a partir da sessão continua inviável: o proxy troca o token pelo da conta antiga (ver Bloqueios). O MCP da Cloudflare não serve para subir os ~5 MB de assets, porque o conteúdo teria de passar pelo próprio código da chamada.
- **Deploy feito (2026-09-24 13:45 UTC):** o usuário importou o repositório (Worker `executar-blog`, branch `main`). O 1º build falhou porque `npx wrangler deploy` rodava na raiz do monorepo ("application detection logic has been run in the root of a workspace"). Corrigido via API no gatilho `4ab7c8d1…`: deploy com `--config apps/blog/wrangler.jsonc`. O build `79d41002…` terminou com sucesso: https://executar-blog.sas-executar.workers.dev (/, artigo e /perguntar respondem 200). `TURNSTILE_SECRET_KEY` cadastrado com a chave de teste oficial. O design novo entra no ar quando o PR #16 for para a `main`.
- **Previews de branch:** o `wrangler preview` também rodava na raiz. Corrigido via API (`previews_base_config` e o preview da branch com `--config apps/blog/wrangler.jsonc`), e o `wrangler.jsonc` ganhou o bloco `previews` (rate limit `1002`, separado da produção). Build `72a5db32…` ok: https://claude-blog-design-system-audit-52wrka-executar-blog.sas-executar.workers.dev, com a página Hoje, o hero e o gráfico ` ```chart ` confirmados no HTML.
- **Produção com o design novo (2026-09-24 ~14:00 UTC):** PR #16 mergeado (`e4e6baa`), com autorização do usuário. O build de produção `18d2407e…` terminou com sucesso, e https://executar-blog.sas-executar.workers.dev serve a página Hoje, o hero e o gráfico ` ```chart `. Daqui em diante, o trabalho vai direto na `main`, sem PR, por instrução do usuário (texto do ADR-011, ainda não versionado).
- Caminho: Workers Builds na conta nova (conectar o GitHub uma vez no painel), com raiz `apps/blog`, build `npm ci && npm run build`, deploy `npx wrangler deploy`. Depois do primeiro deploy, eu cadastro `TURNSTILE_SECRET_KEY` via MCP.

## Bloqueios

- Passo 9 depende de ações exclusivas do usuário (conta/segredos/painel Cloudflare) — ver Pendências.
- Gate 4a resolvido: usuário escolheu (d) "Atual, sem grafo" em 2026-09-23.
- **Deploy via `wrangler` a partir de uma sessão Claude Code: inviável estruturalmente, não só bloqueado.** Duas tentativas, em duas sessões:
  1. Sessão original: rede da sessão negava (403) qualquer saída a `api.cloudflare.com`. Corrigido depois pelo usuário (Network access → Full + credencial de API cadastrada nas configurações do ambiente).
  2. Sessão de deploy (com a rede já liberada e a credencial cadastrada): `wrangler whoami` e `npm run check`/`build` passaram, mas o `wrangler deploy` falhou com 401 no upload dos arquivos do site. Causa: o Workers asset upload usa um **token JWT temporário próprio** (obtido numa chamada prévia à API), diferente do token principal — e o proxy de credenciais desta sessão **substitui o cabeçalho Authorization de toda chamada a `api.cloudflare.com`/`dash.cloudflare.com` pelo token principal fixo**, atropelando esse JWT temporário. Não é um bug de rede pontual: é a forma como a injeção de credencial desta plataforma funciona (por desenho, para o token nunca ficar visível à sessão) colidindo com o fluxo de autenticação em duas etapas do `wrangler` para assets. Não deve funcionar em nenhuma sessão Claude Code com esse tipo de credencial.
  - **Conclusão:** não tentar mais `wrangler deploy` a partir de uma sessão Claude Code para o `apps/blog`. Caminho recomendado: import pelo painel via Workers Builds (issue #3) — a Cloudflare builda e publica nos próprios servidores dela, sem passar pelo proxy desta plataforma.
- **Import pelo painel (Worker `executar-blogg`, com dois "g" porque `executar-blog` já existia como Worker vazio, sobra da tentativa via `wrangler`):** build OK (24 páginas, 31 assets enviados), mas o deploy falhava com `required secrets have not been set: TURNSTILE_SECRET_KEY`. Pela API (leitura), o Worker estava sem secrets e sem versões: o painel não guarda secret antes da primeira versão, e o `secrets.required` impedia a primeira versão. Correção: `secrets.required` removido do blog (ADR-009 atualizado; `/api/perguntar` continua fail closed com 403 sem o secret). Depois do primeiro deploy: cadastrar o secret no painel, na seção de runtime *Variables and Secrets* (não na de Build).
  - 2º bloqueio no mesmo caminho: `Service binding 'AGENTE' references Worker 'executar-agente' which was not found [10143]`. Correção: binding retirado do blog até o agente existir; `/api/perguntar` responde 503 sem ele (teste unitário). `TURNSTILE_SECRET_KEY` já cadastrado no Worker `executar-blogg` via API (autorizado pelo usuário).
  - Se algum dia quisermos automatizar de novo: chamar a API REST da Cloudflare diretamente (sem `wrangler`) pode não sofrer do mesmo problema se o fluxo não depender de um segundo token — não testado.

## Pendências de usuário (passo 9) — uma issue detalhada por item

1. [#2](https://github.com/Sas-Executar/executar-Blog/issues/2) Plano Workers Paid (US$ 5/mês) — exigido por Containers.
2. [#3](https://github.com/Sas-Executar/executar-Blog/issues/3) Conectar repo no Workers Builds (root `apps/blog` e `apps/agente`).
3. [#4](https://github.com/Sas-Executar/executar-Blog/issues/4) `ANTHROPIC_API_KEY` como secret do Worker `agente`.
4. [#5](https://github.com/Sas-Executar/executar-Blog/issues/5) Turnstile: widget real (site key + secret) — hoje em chave de teste.
5. [#6](https://github.com/Sas-Executar/executar-Blog/issues/6) Ativar Web Analytics.
6. [#7](https://github.com/Sas-Executar/executar-Blog/issues/7) (Opcional) AI Gateway com spend limit.
6. Confirmar promoção para produção.
