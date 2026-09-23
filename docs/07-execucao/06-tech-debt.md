# Estágio 6 — Tech debt

**Skill:** `engineering:tech-debt` · **Data:** 2026-09-23 · **Gate:** duplicações do critério arquitetural listadas — ✅

## Duplicações de upstream (critério arquitetural)
| Item | Onde | Por que existe | Plano |
|---|---|---|---|
| Esconder sumário mobile duplicado | `tokens.css` (`.right-sidebar-container mobile-starlight-toc`) | O `PageSidebar` do tema depende do Graph View incompatível; usamos o padrão do Starlight + `PageFrame` do tema | Remover quando `starlight-theme-obsidian` suportar Astro 7 e o plugin completo voltar (ADR-003) |
| Ajuste de títulos (wrapper) | `tokens.css` | Starlight renderiza `h2` inline dentro de wrapper; o GitHub CSS assume bloco | Manter; revisar se Starlight mudar o markup |
| Variáveis GitHub mapeadas por `data-theme` | `tokens.css` | `github-markdown-css` só troca cores por `prefers-color-scheme` | Manter (ponte mínima) |

Nenhuma cópia de CSS/JS upstream; nenhum pacote de tokens; nenhum componente que o Starlight já ofereça.

## Dívidas registradas
| # | Dívida | Impacto | Esforço | Prioridade |
|---|---|---|---|---|
| 1 | Graph View/backlinks ausentes (tema × Astro 7) | Médio (navegação Obsidian) | Baixo quando upstream corrigir | Acompanhar `starlight-site-graph` |
| 2 | Container do agente não testado localmente (sem Docker nesta sessão) | Médio | Baixo (preview) | Validar no primeiro preview |
| 3 | URLs com acentos (`/pessoa-e-cognição/`) | Baixo (compartilhamento mostra %C3%A7) | Médio (renomear pastas do vault) | Decidir com o usuário |
| 4 | Aviso `collection "i18n" does not exist` no build | Nenhum | Baixo | Opcional |
| 5 | Mermaid depende de Chromium na geração | Baixo (CI tem) | — | Aceito (ADR-004) |
