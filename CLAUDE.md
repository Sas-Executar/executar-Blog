# CLAUDE.md — regras permanentes deste repositório

Blog EXECUTAR: Starlight (Astro) estático + agente Claude Agent SDK, no Cloudflare Workers.
Decisões em `docs/02-adr/`; estado do pipeline em `docs/07-execucao/ESTADO.md`.

## Modo de trabalho
- Comece em **Plan Mode** para qualquer mudança não trivial. O usuário é iniciante: explique em linguagem simples e escolha o caminho de menor atrito.
- Estratégia: **minimal code, max upstream**. Antes de escrever algo, pergunte: isso já existe upstream? Se sim, é duplicação — não escreva.
- Use a skill `engineering:*` do estágio (system-design, architecture, testing-strategy, code-review, tech-debt, deploy-checklist, documentation; debug/incident-response/standup sob demanda). Os plugins estão declarados em `.claude/settings.json`.

## Ordem de reuso (UI)
1. **Apple HIG** define as regras (ADR-006) — vence qualquer conflito visual.
2. Starlight (shell: navegação, TOC, busca, dark/light).
3. `starlight-theme-obsidian` (CSS/overrides referenciados do npm, ADR-003).
4. `github-markdown-css` (tabelas, listas, blockquote, tipografia — ADR-005).
5. Expressive Code (código, tema GitHub).
6. `apps/blog/src/styles/tokens.css` (ponte mínima).
7. CSS próprio só em último caso. **Tailwind nunca reconstrói o shell.**

## Regras invioláveis
1. `app.css` do Obsidian **nunca** entra no Git nem em produção (licença).
2. Nunca editar nem copiar dependências upstream para `src/`; referencie o pacote npm.
3. `.env` nasce por `scripts/setup-env.mjs`; só `.env.example` é versionado.
4. Chave Anthropic **nunca** no cliente nem dentro do container (injetada pelo proxy do Worker).
5. Conteúdo publicado sem IDs internos (`FRC-xx`, `TP001`, `RC-KNW`, `ARTICLE-MASTER`).
6. Não crie pacote de design tokens, cópia de CSS upstream ou abstração equivalente ao tema.
7. Rótulos de UI em sentence case; nada de autoplay de mídia; todo gráfico com título e resumo.

## Antes de agir
- Não invente comandos. Se um comando documentado falhar, pare e reporte.
- Deploy em produção, exclusão e publicação exigem **aprovação explícita** do usuário.
- Nunca declare sucesso sem rodar os comandos e ver o resultado.

## Comandos
```bash
npm install            # instala e gera .env (postinstall)
npm run dev            # blog local
npm run check          # astro check + tsc + unit + contraste HIG + guard
npm run build          # build de todos os apps
npm run test:e2e       # Playwright + axe + regras HIG (PW_CHROMIUM_PATH se o Chromium local for de outra versão)
npm run content:sync   # regenera páginas a partir de vault/ (precisa de Chromium para Mermaid)
npm run update:upstream
git ls-files | grep -cE 'app\.css|\.env$'   # deve imprimir 0
```

## Publicar um artigo
Escreva em `vault/<Grupo>/<Título>.md` (frontmatter `title` e `description`) → `npm run content:sync` → PR → preview → merge.

## Ao terminar cada estágio
Atualize `docs/07-execucao/ESTADO.md` (status, decisões, evidência).
