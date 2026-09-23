# Estágio 1 — System design

**Skill:** `engineering:system-design` · **Data:** 2026-09-23 · **Status:** ✅

## 1. Requisitos

### Funcionais
| ID | Requisito | Origem |
|---|---|---|
| F1 | Publicar os 21 artigos (20 conceitos + 1 master) sem IDs internos, briefings ou metadados técnicos | usuário |
| F2 | Experiência editorial Obsidian + GitHub Markdown: sidebar, TOC, busca, dark/light, tabelas, código, callouts | correção "BR — Shell Editorial" |
| F3 | Gráficos/dashboards open source embutíveis nos artigos | D4 |
| F4 | "Pergunte aos artigos": agente Claude Agent SDK que responde só a partir do conteúdo, citando links | decisão "Agent SDK vence" |
| F5 | Publicar novos artigos escrevendo Markdown no `vault/` (compatível com Obsidian) | R-05 / minimal code |

### Não funcionais
| ID | Requisito | Meta |
|---|---|---|
| N1 | Apple HIG transversal | 17px body, alvo 44px, contraste ≥ 4,5:1, texto a 200%, reduce motion, increase contrast, dark |
| N2 | Responsividade | 375 / 768 / 1280 px sem overflow horizontal |
| N3 | Custo | Blog: US$ 0 (assets estáticos grátis e ilimitados). Agente: Workers Paid US$ 5/mês + Containers + tokens com spend limit |
| N4 | Segurança | Chave Anthropic nunca no cliente nem no container; Turnstile no formulário; agente só leitura, sem internet |
| N5 | Operabilidade | `npm run check` / `build` / `test:e2e`; CI; preview por PR; atualização upstream por comando |
| N6 | Disponibilidade | Edge Cloudflare; blog independe do agente (falha do agente não derruba leitura) |

### Restrições
Usuário iniciante e solo · minimal code, max upstream · Cloudflare como hosting · nada de `app.css` · proxy da sessão bloqueia tarballs GitHub (usar `git clone`).

## 2. Visão de alto nível

```
                    ┌──────────────────── Cloudflare edge ────────────────────┐
 Leitor ──HTTPS──►  │ Worker "executar-blog"                                  │
                    │  ├─ assets (dist/ estático, Starlight)  ← 99% do tráfego│
                    │  └─ /api/* (run_worker_first) ─ verifica Turnstile      │
                    │         │ service binding (não público)                 │
                    │         ▼                                               │
                    │ Worker "executar-agente" (Sandbox Durable Object)       │
                    │         │ exec                                          │
                    │         ▼                                               │
                    │ Container: node agente.mjs (Claude Agent SDK)           │
                    │   cwd=/vault (somente leitura) · tools Read/Grep/Glob   │
                    │   rede fechada; saída só api.anthropic.com              │
                    │         │ outboundByHost injeta ANTHROPIC_API_KEY       │
                    └─────────┼───────────────────────────────────────────────┘
                              ▼
                  AI Gateway (spend limit, logs) ─► Anthropic API
```

### Componentes
| Componente | Tecnologia (upstream) | Nosso código |
|---|---|---|
| Shell editorial | Starlight 0.42 + CSS/overrides `starlight-theme-obsidian` (sem grafo, decisão (d)) | config |
| Conteúdo | `starlight-obsidian` lê `vault/` | `scripts/import-content.mjs` (execução única, limpeza) |
| Markdown | `github-markdown-css` + Expressive Code tema GitHub | override `MarkdownContent` (≈10 linhas) |
| Tokens HIG | — | `tokens.css` (≈60 linhas) |
| Gráficos | Apache ECharts | `Grafico.astro` (≈40 linhas) |
| Borda do blog | Workers Static Assets | `worker.ts` (≈30 linhas: Turnstile + encaminha `/api/*`) |
| Agente | `cloudflare/sandbox-sdk/examples/claude-code` + `@anthropic-ai/claude-agent-sdk` | `agente.mjs` (runner) + ajustes do template |

## 3. Fluxos de dados

**Publicação (build):** `vault/*.md` → `starlight-obsidian` gera `src/content/docs/artigos/` → `astro build` → `dist/` (HTML, Pagefind) → Workers Builds → deploy. Mermaid: renderizado com Chromium; se o build Cloudflare não tiver navegador, geração no CI e `skipGeneration` no build Cloudflare (ADR-004).

**Leitura:** request → asset estático no edge (cache automático). Sem Worker invocado → grátis.

**Pergunta ao agente:** página → `POST /api/perguntar {pergunta, turnstileToken}` → Worker blog valida Turnstile (siteverify) e tamanho → service binding `AGENTE.fetch` → Worker agente → `getSandbox()` → `exec node agente.mjs` com a pergunta como argumento (shell-quoted) → Agent SDK lê `/vault` com Read/Grep/Glob → resposta JSON `{resposta, fontes[]}` → leitor.

## 4. Contratos de API

`POST /api/perguntar`
- Request: `{ "pergunta": string (3–500 chars), "token": string }`
- 200: `{ "resposta": string (markdown), "fontes": [{ "titulo": string, "url": string }] }`
- 400 validação · 403 Turnstile inválido · 429 limite · 503 agente indisponível (blog continua funcionando)

## 5. Escala, confiabilidade, custo
- Blog: estático, escala infinita pelo edge, custo zero.
- Agente: 1 container `basic`, estado quente entre requisições; cold start medido no preview. Limites: Turnstile + rate limit por IP no Worker + spend limit no AI Gateway + `maxTurns` no SDK.
- Falha do agente → 503 com mensagem amigável; leitura não é afetada.
- Observabilidade: Workers Logs nos dois Workers; AI Gateway logs.

## 6. Trade-offs
| Decisão | Ganho | Custo |
|---|---|---|
| Blog estático + Worker mínimo (em vez de adapter SSR) | Evita bug upstream Starlight 0.42 × adapter; custo zero; mais simples | ~30 linhas próprias no `worker.ts` |
| Tema sem Graph View (opção d) | Stack atual e atualizável | Perde grafo/backlinks até o tema ser atualizado |
| Agent SDK em container | Decisão do usuário; ferramentas reais de leitura | Workers Paid, cold start, Docker no build |
| Vault compatível com Obsidian | Usuário escreve no Obsidian | Limpeza precisa rodar antes |

## 7. O que revisitar ao crescer
- Voltar ao plugin completo do tema quando `starlight-site-graph` suportar Astro 7.
- Cache de respostas frequentes do agente (AI Gateway cache).
- Domínio próprio (Custom Domain).
