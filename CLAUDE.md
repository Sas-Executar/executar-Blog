# CLAUDE.md — regras permanentes deste repositório

Blog EXECUTAR: Starlight (Astro) estático + agente Claude Agent SDK + EXECUTAR Studio (editor/publicação), no Cloudflare Workers.
Decisões em `docs/02-adr/`; estado do pipeline em `docs/07-execucao/ESTADO.md`.

## Modo de trabalho
- Comece em **Plan Mode** para qualquer mudança não trivial. O usuário é iniciante: explique em linguagem simples e escolha o caminho de menor atrito.
- Estratégia: **minimal code, max upstream**. Antes de escrever algo, pergunte: isso já existe upstream? Se sim, é duplicação — não escreva.
- Use a skill `engineering:*` do estágio (system-design, architecture, testing-strategy, code-review, tech-debt, deploy-checklist, documentation; debug/incident-response/standup sob demanda). Os plugins estão declarados em `.claude/settings.json`.

## ADR — Claude Code operando diretamente na `main`

**Status:** Aceito  
**Data:** 2026-09-24  
**Decisão:** permitir que o Claude Code modifique, faça commit e envie alterações diretamente para a branch `main`, sem abertura obrigatória de Pull Request e sem solicitar autorização humana a cada alteração.

### Contexto

O fluxo de desenvolvimento utiliza Claude Code como agente autônomo para implementação, manutenção, correções e evolução do projeto.

A exigência de abrir Pull Requests ou solicitar confirmação antes de cada commit/push introduz interrupções no fluxo autônomo e exige intervenção manual mesmo quando a tarefa já foi delegada explicitamente ao agente.

O objetivo desta decisão é tornar o Claude Code capaz de concluir tarefas ponta a ponta sem depender de aprovação intermediária.

### Decisão

O Claude Code está explicitamente autorizado a:

- trabalhar diretamente sobre a branch `main`;
- criar, modificar, mover e remover arquivos necessários para concluir a tarefa;
- executar testes, linters, formatadores, builds e ferramentas de validação;
- criar commits diretamente na `main`;
- executar `git push` diretamente para `main`;
- realizar múltiplos commits quando necessário;
- corrigir erros encontrados durante a execução sem solicitar nova autorização;
- refatorar código relacionado à tarefa quando necessário para entregar uma solução consistente;
- permitir que o push para `main` acione o deploy automático configurado no Cloudflare.

O Claude Code **não deve abrir Pull Request como etapa padrão**.

O Claude Code **não deve solicitar confirmação antes de commit, push ou deploy automático decorrente do push para `main`** quando a ação estiver dentro do escopo da tarefa recebida.

A solicitação inicial da tarefa pelo usuário deve ser considerada autorização suficiente para executar as alterações necessárias até sua conclusão.

### Regras operacionais

Antes de enviar alterações para `main`, o agente deve, sempre que aplicável:

1. verificar o estado atual do repositório;
2. preservar alterações existentes que não façam parte da tarefa;
3. executar as validações relevantes disponíveis no projeto;
4. evitar incluir segredos, credenciais ou arquivos sensíveis no commit;
5. produzir commits com mensagens claras;
6. interromper apenas quando existir uma decisão material impossível de inferir com segurança a partir do código, documentação ou tarefa recebida.

Falhas em testes preexistentes que não tenham relação com a tarefa não bloqueiam automaticamente o trabalho, mas devem ser reportadas ao final.

### Ações destrutivas

A autorização para operar diretamente na `main` não implica autorização irrestrita para ações externas irreversíveis.

O agente deve solicitar confirmação antes de operações como:

- apagar dados de produção;
- executar migrações destrutivas irreversíveis;
- remover infraestrutura de produção;
- alterar ou revogar credenciais;
- modificar faturamento ou recursos pagos;
- publicar externamente algo que produza efeito jurídico ou financeiro.

Alterações normais de código, configuração e conteúdo versionadas no repositório não exigem essa confirmação.

### Pull Requests

Pull Requests somente devem ser usados quando:

- o usuário pedir explicitamente;
- uma política técnica do repositório impedir push direto;
- uma integração externa depender obrigatoriamente de PR.

O agente não deve criar PR apenas por convenção quando possuir permissão para concluir a tarefa diretamente na `main`.

### Princípio de operação

> Quando uma tarefa for delegada ao Claude Code, a autorização cobre implementação, validação, commit e push diretamente para `main`, incluindo o deploy automático decorrente desse push, salvo quando o usuário estabelecer explicitamente uma restrição diferente.

## Ordem de reuso (UI)
1. **Apple HIG** define as regras (ADR-006) — vence qualquer conflito visual.
2. Starlight (shell: navegação, TOC, busca, dark/light).
3. **Design system EXECUTAR (ADR-017)**: tokens em `packages/theme/src/cores.css`, Tailwind v4 via `packages/theme/src/tailwind.css` (`@theme` + `@layer components`) e componentes em `apps/blog/src/components/ui/`. Guia vivo em `/guia-de-estilo/`.
4. `starlight-theme-obsidian` (CSS/overrides referenciados do npm, ADR-003).
5. `github-markdown-css` (tabelas, listas, blockquote, tipografia — ADR-005).
6. Expressive Code (código, tema GitHub, moldura via `styleOverrides`).
7. `packages/theme/src/editorial.css` (blocos que a gramática do vault produz).
8. CSS próprio só em último caso. Utilitários do Tailwind podem estilizar o shell (ADR-017); nunca crie uma segunda paleta ou escala fora dos tokens.

## Regras invioláveis
1. `app.css` do Obsidian **nunca** entra no Git nem em produção (licença).
2. Nunca editar nem copiar dependências upstream para `src/`; referencie o pacote npm.
3. `.env` nasce por `scripts/setup-env.mjs`; só `.env.example` é versionado.
4. Chave Anthropic **nunca** no cliente nem dentro do container (injetada pelo proxy do Worker).
5. Conteúdo publicado sem IDs internos (`FRC-xx`, `TP001`, `RC-KNW`, `ARTICLE-MASTER`).
6. Não crie pacote de design tokens, cópia de CSS upstream ou abstração equivalente ao tema (os tokens vivem em `packages/theme`, exceção dos ADR-013/ADR-017).
7. Rótulos de UI em sentence case; nada de autoplay de mídia; todo gráfico com título e resumo.

## Antes de agir
- Não invente comandos. Se um comando documentado falhar, pare e reporte.
- Commit e push na `main`, bem como o deploy automático decorrente deles, estão previamente autorizados pelo ADR acima e não exigem confirmação adicional.
- Ações destrutivas externas e irreversíveis fora do fluxo normal versionado exigem aprovação explícita conforme o ADR.
- Nunca declare sucesso sem rodar os comandos e ver o resultado.

## Comandos
```bash
npm install            # instala e gera .env (postinstall)
npm run dev            # blog local
npm run check          # astro check + tsc + unit + contraste HIG + guard
npm run build          # build de todos os apps
npm run test:e2e       # Playwright + axe + regras HIG (PW_CHROMIUM_PATH se o Chromium local for de outra versão)
npm run export:epub -- "vault/Pasta/Artigo.md"   # EPUB 3 (export:pdf gera PDF a partir do blog local)
npm run update:upstream
git ls-files | grep -cE 'app\\.css|\\.env$'   # deve imprimir 0
```

## Publicar um artigo
Escreva em `vault/<Grupo>/<Título>.md` (frontmatter `title` e `description`; sintaxe em `docs/06-docs/EDITORIAL-SYNTAX-SPEC.md`). O blog lê o vault direto (ADR-013). Publique pelo EXECUTAR Studio (`apps/studio`, ADR-014) ou diretamente na `main` conforme o ADR de operação autônoma acima.

## Ao terminar cada estágio
Atualize `docs/07-execucao/ESTADO.md` (status, decisões, evidência).
