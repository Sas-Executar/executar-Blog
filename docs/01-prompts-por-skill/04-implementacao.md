# Estágio 4 — Implementação (sem skill dedicada; guiada pelos ADRs)

## OBJECTIVE
Implementar o blog conforme ADRs aprovados e plano de testes.

## CONTEXT
Estágios 0–3 concluídos e com gate verde. Usuário aprovou o plano.

## INPUT
ADRs, `07-execucao/01-system-design.md`, `04-testes/plano-de-testes.md`.

## CONSTRAINTS
- Prioridade de UI: Obsidian → Minimal → Arrow → CSS próprio (último recurso).
- **Nunca** editar `vendor/`. **Nunca** commitar `app.css`.
- `.env` gerados por script junto do código; `.env.example` versionado,
  `.env` real no `.gitignore`. Segredos nunca em saída ou commit.
- Commits pequenos, um por passo lógico.

## EXECUTION
1. Bootstrap conforme ADR-001 (só comandos confirmados no Estágio 0).
2. Script `scripts/setup-env.*` que gera todos os `.env`.
3. Estrutura de conteúdo do blog.
4. Integração Agent SDK (server-side).
5. Integração Power BI (conforme ADR-004).
6. Testes do plano, escritos junto do código.
7. Rodar `npm run check` e `npm run build` a cada passo.

## OUTPUT CONTRACT
Repositório `blog/` funcional + `07-execucao/ESTADO.md` atualizado.

## VALIDATION
`npm run check` verde, `npm run build` verde, testes do plano passando,
`git ls-files | grep app.css` vazio.

## STOP CONDITIONS
Falha do mesmo gate duas vezes → acionar `90-debug.md`. Qualquer ação de
deploy exige aprovação explícita.
