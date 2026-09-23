# Onboarding

**Skill:** `engineering:documentation`

## 1. Ambiente (5 min)
1. Node 22+ (`node -v`).
2. `npm install` — cria `apps/blog/.env` e `apps/agente/.env` a partir dos `.env.example` (chaves de **teste** do Turnstile; nenhuma chave real).
3. `npm run dev` → http://localhost:4321.

## 2. Como as peças se conectam
```
vault/*.md ──starlight-obsidian──► apps/blog/src/content/docs/artigos ──astro build──► dist/ (estático)
leitor ──► Worker executar-blog ──assets──► páginas
             └─ /api/perguntar ─Turnstile─► Worker executar-agente ─► container (Agent SDK lê /vault) ─► Anthropic
```
Detalhes: `docs/07-execucao/01-system-design.md` e ADR-002…009.

## 3. Tarefas comuns
| Tarefa | Como |
|---|---|
| Publicar/editar artigo | Ver runbook "Publicar artigo" |
| Adicionar gráfico | Criar página `.mdx` em `apps/blog/src/content/docs/` com `<Grafico titulo resumo opcoes={...} />` (dados reais, título e resumo obrigatórios) |
| Mudar cores/tamanhos | Só em `apps/blog/src/styles/tokens.css`; rode `npm run check` (contraste 4,5:1) |
| Atualizar dependências | `npm run update:upstream` (ou aprovar PR do Dependabot com CI verde) |

## 4. Regras
Leia `CLAUDE.md`. Em resumo: nada de `app.css`/`.env` no Git, nada de copiar upstream, HIG vence, chave Anthropic nunca no cliente.

## 5. Quem decide o quê
- **Usuário (owner):** conteúdo, aprovação de deploy em produção, contas e chaves.
- **Claude Code:** implementação, testes, PRs, documentação — sempre por PR com CI verde.
