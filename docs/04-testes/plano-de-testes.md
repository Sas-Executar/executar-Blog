# Plano de testes

**Skill:** `engineering:testing-strategy` · **Data:** 2026-09-23 · **Status:** ✅ definido antes do código

## Pirâmide

```
        /  E2E (Playwright + axe)  \     ~10 casos · CI · preview
       /  Integração (build, guard)  \    build completo + varreduras de dist/
      /   Unit (node:test, rápido)     \  scripts e lógica pura
```

Ferramentas: `node:test` (zero dependência) para unit; `@playwright/test` + `@axe-core/playwright` para e2e (Chromium pré-instalado no ambiente/CI). Nenhum framework extra.

## O que testar

| Área | Tipo | Casos | Meta |
|---|---|---|---|
| `scripts/import-content.mjs` | Unit | remove IDs do título/corpo; remove seção 13; remove "Autor curto"; remove link do Knowledge Pack; converte "Relacionados: FRC-xx" em wikilinks; nome de arquivo sem ID; frontmatter title/description; exclui `Sem título.md`; idempotência | 100% das regras de limpeza |
| `scripts/setup-env.mjs` | Unit | cria `.env` se ausente; não sobrescreve existente; ignora app sem `.env.example` | 100% |
| `scripts/guard.mjs` | Unit + integração | detecta IDs internos; detecta `app.css` versionado; detecta `sk-ant-` e nomes de segredo no `dist/` cliente; passa em árvore limpa | 100% |
| `scripts/check-contrast.mjs` | Unit | pares de tokens light/dark/increase-contrast ≥ 4,5:1 | todos os pares |
| `apps/blog/worker.ts` | Unit | 400 validação; 403 Turnstile inválido; encaminha ao agente; 503 quando agente falha; não-`/api` vai para assets | caminhos críticos + erros |
| `apps/agente/agente.mjs` | Unit (SDK mockado) | só ferramentas de leitura; cwd `/vault`; saída JSON `{resposta, fontes}`; erro vira JSON de erro | contrato |
| `apps/agente/src/index.ts` | Typecheck | tipos do Worker/Sandbox | `tsc --noEmit` |
| Build blog | Integração | `astro check` + `astro build`; 21 páginas de artigo; Pagefind indexado | 0 erros |
| Conteúdo gerado | Integração (CI) | `content:sync` não gera diff (páginas commitadas = vault) | 0 diff |
| HIG (ADR-006) | E2E | corpo ≥ 17px; nada < 11px; alvos ≥ 44px; zoom 200% sem scroll horizontal; `prefers-reduced-motion`; `prefers-contrast: more`; dark/light | todas as regras |
| Acessibilidade | E2E | axe sem violações `serious`/`critical` em home, artigo, página de dados — light e dark | 0 |
| Responsivo | E2E | 375 / 768 / 1280 px sem overflow horizontal | 0 |
| Markdown visual | E2E | tabela com estilo GitHub (bordas), código com Expressive Code | presença de classes |
| Busca | E2E | Pagefind retorna artigo para termo conhecido | 1 resultado |
| Agente (UI) | E2E | `/api/perguntar` mockado: estado "pensando", resposta e fontes renderizadas | fluxo feliz + erro |
| Agente (real) | Manual/preview | pergunta real citando artigo; latência registrada em `ESTADO.md` | evidência |

## Fora de escopo
Getters triviais, código de framework (Starlight/Astro), carga/caos (tráfego baixo, edge Cloudflare).

## Comandos
- `npm run check` → astro check + unit + guard + contraste
- `npm run build` → build de todos os workspaces
- `npm run test:e2e` → Playwright contra `dist/` servido localmente (ou `BASE_URL` do preview)

## Gaps conhecidos
- Container real do agente só testável no preview (sem Docker neste ambiente).
- Mermaid só renderiza onde houver Chromium (CI/local), ver ADR-004.
