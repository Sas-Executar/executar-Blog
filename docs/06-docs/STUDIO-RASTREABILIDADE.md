# EXECUTAR Studio: rastreabilidade PRD/FRD → implementação → teste

Fonte: especificação "ADR-008 — Editorial Studio Full Stack" (FRD + PRD) do usuário, registrada como ADR-014. Estado em 2026-09-24.

| Requisito | Implementação | Evidência (teste) | Status |
|---|---|---|---|
| FR-01 editar Markdown/Obsidian no navegador | `apps/studio/src/pages/index.astro`, `src/scripts/studio.ts` | e2e `studio.spec.ts` (todos) | VERIFIED |
| FR-02 preview em tempo real | mesmo renderer do blog em WebAssembly (`packages/editorial-renderer`). Componentes Astro/HTML em vez de React (ADR-013) | e2e "preview usa a gramática editorial" | VERIFIED |
| FR-03 frontmatter tipado e validado | `packages/content-schema`; campos de propriedades que editam o YAML | unit `content-schema.test.mjs`; e2e "propriedades reescrevem o frontmatter" | VERIFIED |
| FR-04 slash commands e componentes | `src/scripts/comandos.ts` (callout, tabela, tarefas, abas, colunas, grade, toggle, código, gráfico, Mermaid, embed, wikilink, métrica, passos, sumário) | e2e "comando / insere bloco" | VERIFIED |
| FR-05 imagens e assets | upload → `vault/<pasta>/`, `![[nome]]`, preview local | unit "publish … assets" | VERIFIED |
| FR-06 autosave e drafts | localStorage a cada edição; modo `draft` → ramo `rascunho/<slug>` | e2e "rascunho local sobrevive"; unit "draft cria ramo" | VERIFIED |
| FR-07 salvar em `vault/` | `worker/publicar.ts` (caminhos presos a `vault/`) | unit "caminhos seguros" | VERIFIED |
| FR-08 slug e rota | `idDoCaminho` mostrado como "Endereço" | e2e "rota prevista" | VERIFIED |
| FR-09 validar links, schema e sintaxe | `validarArtigo` (cliente) e `validarLeve` (servidor), com **linha exata** | unit "validação indica a linha exata" | VERIFIED |
| FR-10 publicar direto ou abrir PR | modos `publish` / `pr` | unit "publish avança a main, pr abre PR" | VERIFIED |
| FR-11 commit, status do build e URL | `/api/status` (check runs do Workers Builds) e acompanhamento na interface | unit "status do build"; e2e "Commit … build: sucesso" | VERIFIED (mock) |
| FR-12 versionamento/rollback | `/api/historico`, `/api/versao`; restaurar = abrir e publicar (novo commit) | unit "histórico"; e2e "histórico abre versão antiga" | VERIFIED |
| FR-13/14 selecionar e ordenar capítulos | painel eBook (marcar, ↑/↓) | e2e "eBook: escolhe, ordena e baixa EPUB" | VERIFIED |
| FR-15 Web Book, PDF e EPUB | `gerarLivroWeb`, `gerarEpub` (multicapítulo), impressão; `npm run export:epub -- a.md b.md` | unit "eBook"; XML validado | VERIFIED |
| Autenticação obrigatória | Cloudflare Access + JWT validado no Worker (fail closed) | unit "Access" e "Worker sem Access → 403" | VERIFIED |
| RBAC preparado | `worker/papeis.ts` (`PAPEIS`: leitor/autor/editor/admin) | unit "RBAC"; e2e "autor não vê Publicar" | VERIFIED |
| Logs de auditoria | `auditar()` → Workers Logs; trailer `Studio-Autor:` no commit | unit (mensagem do commit) | VERIFIED |
| Conflitos Git | `shaOriginal` × sha atual (409) e fast-forward sem force na `main` | unit "conflito detectado"; e2e "conflito explicado" | VERIFIED |
| Publicação idempotente | sha do blob igual → sem commit | unit "idempotente" | VERIFIED |
| Secrets só no servidor | GitHub App/PAT em secrets do Worker | revisão + unit (navegador não recebe token) | VERIFIED |
| Preview < 1 s | debounce de 250 ms + render WebAssembly; tempo exibido | e2e "preview abaixo de 1 s" | VERIFIED |
| WCAG AA / responsivo | tokens HIG/DS, alvos de 44 px, layout de 1 coluna < 60 rem | e2e axe | VERIFIED |
| CI/CD + Playwright | `.github/workflows/ci.yml` (check, build, e2e blog + Studio); Workers Builds para `executar-blog` e `executar-studio` | CI | VERIFIED |
| MCP | `/mcp`: listar, ler (com versão), validar, pré-visualizar, publicar, histórico, status | unit "MCP" | VERIFIED |

**Pendências do usuário** (bloqueiam o uso real, não o código): credencial do GitHub (App ou PAT) e Cloudflare Zero Trust com os e-mails autorizados. Ver ADR-014.

**Fase seguinte (PRD "Evolução", fora do MVP):** colaboração, workflow editorial, agendamento, analytics, templates, séries, newsletters e multicanal.
