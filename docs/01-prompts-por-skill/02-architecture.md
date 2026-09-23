# Estágio 2 — skill `engineering:architecture` (ADR)

## OBJECTIVE
Finalizar o ADR-001 e derivar ADRs adicionais no formato da skill.

## CONTEXT
O ADR-001 existe como rascunho fiel ao Blueprint. O usuário pediu que R-08..R-13
entrem no ADR.

## INPUT
`02-adr/ADR-001.md`, `07-execucao/01-system-design.md`,
`07-execucao/00-verificacao.md`, decisões D1–D6 respondidas pelo usuário.

## CONSTRAINTS
- Formato obrigatório da skill: Status, Date, Deciders, Context, Decision,
  Options Considered (com tabela de dimensões), Trade-off Analysis,
  Consequences, Action Items.
- Para cada decisão, **no mínimo duas opções** com prós/contras reais.
- Não marcar `Accepted` sem resposta do usuário às decisões abertas.

## EXECUTION
1. Atualizar ADR-001 com o resultado do Estágio 0 (marcar `Accepted` só se
   tudo confirmado e D1–D6 respondidas).
2. Criar ADRs separados:
   - ADR-002 Astro + Tailwind vs. camada Arrow/Obsidian (resolve D1, D2)
   - ADR-003 Apple HIG + Fluent vs. "sem design system próprio" (resolve D3)
   - ADR-004 Power BI embed (resolve D4)
   - ADR-005 Agent SDK Anthropic (onde roda, chaves, custo)
   - ADR-006 Uso de `app.css` em produção (resolve D5)
   - ADR-007 Responsividade mobile/web
3. Cada ADR lista o que fica mais fácil, mais difícil e o que revisitar.

## OUTPUT CONTRACT
`02-adr/ADR-001.md` (atualizado) e `02-adr/ADR-002.md` … `ADR-007.md`.

## VALIDATION
- Todo ADR tem ≥ 2 opções e trade-off explícito.
- Nenhum ADR contradiz outro sem registrar `Supersedes`.
- D1–D6 têm decisão do usuário registrada.

## STOP CONDITIONS
Se D1 ou D5 não tiver resposta, pare: mudam a arquitetura inteira.
