# ESTADO DO PIPELINE

> Atualize a cada estágio. Não dependa da memória da conversa.

**Última atualização:** 2026-09-25 (design system editorial, ADR-017)
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

## Desyng System + blog completo (ADR-012) — 2026-09-24 — VERIFIED (local)

- Tokens do Desyng System (`5b14182`) via `npm run tokens:sync`, com o shell do Showroom (sem barra lateral, cabeçalho com as seções, barra inferior no celular) e Geist e HIG mantidos.
- Conteúdo: `/blog`, com 3 artigos com pilar e consciência (P1/C1, P1/C2, P3/C3) e 301 de `/artigos/*`.
- Rotas: Hoje, Explorar, Categoria, Artigo, Buscar, Salvos e Preferências (HF01–HF05).
- Evidência: `npm run check` (0 erros, 25 testes unitários, contraste 12 pares × 4 modos, guard ok), `npm run build` ok e `npm run test:e2e` 25/25. Os e2e cobrem Busca com e sem resultado, Explorar com filtros e estado vazio, Salvos (adicionar, remover e vazio), Preferências (tema e texto), Copiar link, redirecionamento, barra inferior de 44pt, axe em 10 páginas nos modos claro e escuro, e teclado.

## Linguagem editorial única + Studio (ADR-013/ADR-014) — 2026-09-24 — VERIFIED (local)
- **Fonte única:** o blog lê `vault/` direto (loader `glob`). O `content:sync`, a cópia em `content/docs/blog` e o `starlight-obsidian` foram removidos. Commit `d2e23da` na `main`.
- **Pacotes:** `markdown-parser` (Obsidian + diretivas + chart, plugins Sätteri; callouts num plugin próprio, para a sintaxe inline funcionar dentro deles), `editorial-renderer` (HTML + EPUB 3 sem dependências), `content-schema` (Zod + propriedades tipadas), `theme` (tokens do DS + `editorial.css`) e `ui` (abas, Mermaid, ECharts).
- **Studio** (`apps/studio`): editor, preview com o mesmo parser em WebAssembly (COOP/COEP), validação, propriedades → frontmatter, imagens, rascunho local, Rascunho/Preview/PR/Publicar, PDF/EPUB. O Worker tem Access JWT (fail closed), GitHub App ou PAT, Publish API (Git Data API) e MCP (`/mcp`).
- **Exports:** `npm run export:epub` (XML validado nos 3 artigos e na fixture) e `npm run export:pdf` (11 páginas geradas a partir do blog local).
- **Evidência:** `npm run check` ok (51 testes unitários, contraste, guard); `npm run build` ok; `npm run test:e2e` com 35/35 (31 do blog + 4 do Studio, axe incluído).
- **FRD/PRD do Studio fechados (commit `38bb427`):** validação com linha exata, RBAC, auditoria, conflitos e idempotência, histórico/rollback, status do build, comandos "/" e eBook multicapítulo. Matriz em `docs/06-docs/STUDIO-RASTREABILIDADE.md`; 56 testes unitários e 40 e2e.
- **Produção (2026-09-24 17:15 UTC):** o build do blog `00a440d0…` (`5dec061`) terminou com sucesso. O Worker `executar-studio` foi criado via API, com gatilho `b5802fab…` na `main`, e o 1º build `f4b290c1…` terminou com sucesso. https://executar-studio.sas-executar.workers.dev serve a interface com COOP/COEP; `/api/eu` e `/mcp` respondem **403** sem Access (fail closed confirmado).
- **Builds do commit `38bb427` ✅ CONCLUÍDOS (2026-09-24 17:45 UTC):** blog build `3ccb5d84` → sucesso; studio build `0b343b7e` → sucesso. Ambos os Workers estão ao vivo em produção (https://executar-blog.sas-executar.workers.dev + https://executar-studio.sas-executar.workers.dev) com a implementação integral de ADR-013/ADR-014.
- **Pendente (usuário):** credencial do GitHub (App ou PAT) e ativação do Zero Trust com os e-mails autorizados; ver ADR-014 e o guia, seção 6.

## Plugin do Claude Code (ADR-016) — 2026-09-25 — VERIFIED (local + GitHub real)
- **Pedido:** o Copiloto Operacional como plugin, com paridade total e sem Cloudflare (handoff genérico rev. 2).
- **O erro do claude.ai não vinha de arquivo ausente.** O `marketplace.json` já estava na `main` desde 24/09 e passa no validador. A causa provável é o marketplace já ter sido adicionado. O nome `executar-blog` foi preservado.
- **Entrega:**
  - marketplace `executar-blog` na raiz (ampliado), com os plugins `copiloto-operacional`, `executar-skills` e `cloudflare`;
  - `plugins/copiloto-operacional` com 17 comandos (15 verbos + reconciliar + espelho), 1 skill, hook `SessionStart` e servidor MCP stdio;
  - o servidor é o mesmo núcleo de `apps/copiloto/worker`, empacotado por `scripts/build-plugin.mjs`;
  - ledger em `node:sqlite`, relatório em arquivos, PDF por Chromium local.
- **Evidência:**
  - `claude plugin validate` passou no marketplace e no plugin;
  - `claude plugin install copiloto-operacional@executar-blog` funcionou;
  - `tests/unit/plugin-copiloto.test.mjs` (11 testes, stdio real contra GitHub simulado) passa;
  - fluxo real somente leitura (H05) OK;
  - mutação reversível real (T11): #502 criada, repetida sem duplicar, compensada para `state/cancelado`.
- **Pendente (usuário):** configurar o token no `/plugin configure` e refazer o "Add marketplace" no claude.ai.

### Extensão: agentes por domínio — 2026-09-25 — VERIFIED (local)
- **Pedido:** subagentes (`agents/*.md`, invocáveis por descrição em linguagem natural), um por área do
  Copiloto, cobrindo tudo que os comandos já cobrem, podendo chamar tanto `consultar` quanto `executar`.
- **Entrega:** 5 agentes em `plugins/copiloto-operacional/agents/` — `agente-backlog`, `agente-campanha`,
  `agente-relatorios`, `agente-definicoes`, `agente-reconciliacao` — cobrindo os 17 verbos sem sobra
  nem lacuna. `ajuda` continua só comando e agora também lista os agentes.
- **Sem ferramenta nova:** só orquestram `consultar`/`executar`/`reconciliar`/`espelho`; `.mcp.json` e
  `plugin.json` não mudaram. Escrita (`executar`) continua pedindo aprovação a cada chamada.
- **Evidência:** `claude plugin validate` (marketplace e plugin) passou; `npm run check` 96/96 +
  contraste + guard + validate-ops; `npm run plugin:check` (tsc + drift do `dist/`) sem divergência;
  teste novo em `tests/unit/plugin-copiloto.test.mjs` confere frontmatter dos 5 agentes e a cobertura
  dos verbos.
- **Pendente (usuário):** depois do push, `claude plugin marketplace update executar-blog` (ou Sync no
  claude.ai) para os 5 agentes aparecerem no inventário do `copiloto-operacional@executar-blog`.

## Copiloto Operacional (ADR-015) — 2026-09-25 — VERIFIED (local)
- **Pedido:** a partir da pasta "Comece aqui" (ADR-001 do copiloto) e dos 8 documentos IDX. Os IDX 01, 05 e 07 (runbook, painel e padrão de campanha) passam a ser controlados pelo agente. Os IDX 02, 03, 04, 06 e 08, junto com a skill `executar-relatorios`, alimentam os reports. Os reports saem por e-mail em HTML ou PDF.
- **Decisões do usuário:**
  - o GitHub é o principal e a planilha espelha;
  - o copiloto roda neste monorepo, na Cloudflare;
  - o Outlook recebe e o Resend envia;
  - commit direto na `main`.
- **Código:**
  - `apps/copiloto`: Worker com D1 (ledger), Queues, Cron e Browser Run (PDF);
  - parser determinístico dos comandos `/`, máquina de estados com CAS, `/feito` com DoD + evidência + verificação (link verificado), `/campanha`, `/status-report html|pdf`, `/criar-*` por PR;
  - webhooks do Graph e do GitHub (a transição ilegal feita na UI é revertida);
  - espelho da planilha;
  - `ops/`: WF-CAMP-001, rotinas, runbooks e áreas;
  - Studio: ferramenta MCP `listar_campanhas`.
- **Relatórios:** a fonte é a skill SK-04 no Copiloto (commit `c03ceb3`, branch `claude/elegant-davinci-gg3e39`), que foi corrigida:
  - o cabeçalho usava LACUNA e saía invisível;
  - o texto de marca não passava em contraste;
  - as fontes não eram IBM Plex;
  - o e-mail HTML não existia.
  - `scripts/sync-report-assets.mjs` gera `relatorio-assets.gen.ts`, com teste de paridade byte a byte contra `render_report.py`.
  - Os IDX 02/03/04/06/08 foram regenerados em `Copiloto/portfolio/{M2.1,S0}/relatorios/`.
- **Evidência:**
  - `npm run check` ok: 84 testes unitários (27 do copiloto), contraste, guard e `validate-ops`;
  - `npm run build` ok (dry-run do `executar-copiloto` com D1, Queue e Browser);
  - `npm run test:e2e` 40/40;
  - `wrangler dev` local: webhook do GitHub assinado → `inbound_event` (dedupe ok), assinatura inválida → 401, handshake do Graph ok, notificação → fila → retry sem credencial.
- **Pendente (usuário), bloqueia só o deploy:** ver ADR-015, seção "Pendências". São elas: Workers Paid, D1 e filas, GitHub App nos 2 repositórios + webhook, app do M365 com certificado, domínio e chave do Resend, service account do Sheets, `RBAC`. Por fim, `EMAIL_ENVIO_ATIVO=1`.

## Design system editorial (ADR-017) — 2026-09-25 — VERIFIED (local)
- **Pedido do usuário:** planejar, desenvolver, aplicar e publicar um design system novo como "ADR final", a partir de `risco-cognitivo-executar-linkedin-v12-dark-mode.html`.
- **Decisões do usuário:**
  - azul substitui o verde;
  - fonte Inter;
  - Tailwind em tudo;
  - stack mais avançado de 2026;
  - publicar direto na `main`.
- **Stack:** Tailwind v4.3 (`@tailwindcss/vite`) + `@astrojs/starlight-tailwind` 5 + `@fontsource-variable/inter`. Saem Geist e Geist Mono.
- **Fundações:**
  - `packages/theme/src/cores.css` tem a paleta nova e 20 pares de contraste × 4 modos;
  - `packages/theme/src/tailwind.css` concentra ordem das camadas, `@theme` e `@layer components`;
  - `editorial.css` foi reescrito na família da referência;
  - `tokens.css` perdeu as regras de aside mortas.
- **Componentes:**
  - wrappers em `apps/blog/src/components/ui/` (Botao, Campo, Chip, Selo, Rotulo, Marca);
  - shell e páginas migrados para utilitários;
  - `PostCard` passou a ser cartão editorial;
  - corrigido o `@media` sem fechar no `Header.astro`;
  - hex fixos trocados por tokens (capa, dashboard, Studio, ECharts, Mermaid).
- **Gramática nova:**
  - `[!attention]` sem título vira "Ponto de atenção";
  - `[!decision]`, `[!decisao]` e `[!reflexao]` viram o bloco de decisão;
  - ` ```ascii ` vira "Plain txt · infográfico";
  - rótulos "Plain txt · terminal" e "Plain txt" no Expressive Code.
- **Guia de estilo:** `/guia-de-estilo/`, com fundações, componentes, família editorial, mood board e storyboard 01–07.
- **Evidência:**
  - `npm run check` passou: astro check com 0 erros, unit 96/96, contraste 20 pares × 4 modos, guard, ops e plugin.
  - `npm run build` passou.
  - e2e 43/43 (antes 40/40), incluindo axe claro e escuro em `/guia-de-estilo/`, alvos de 44 pt e ausência de overflow a 375, 640, 768 e 1280 px.
  - Capturas revisadas em 375 e 1280 px, claro e escuro.
- **Limitações:**
  - o dashboard TDAH segue com Chart.js via CDN (sem rede na sessão, os gráficos não aparecem nas capturas; problema anterior);
  - diagramas antigos em ` ```text ` continuam quebrando linha; o autor migra para ` ```ascii `.

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
