# Estágio 6 — skill `engineering:tech-debt`

## OBJECTIVE
Identificar e priorizar dívida técnica introduzida ou latente.

## CONTEXT
Projeto novo: dívida relevante tende a ser dependência, duplicação do
upstream e documentação.

## INPUT
Repositório após code-review aprovado.

## CONSTRAINTS
Categorias da skill: código, arquitetura, teste, dependência, documentação,
infraestrutura. Fórmula: Prioridade = (Impacto + Risco) × (6 − Esforço).
Foco especial: **duplicações do critério arquitetural do ADR-001**.

## EXECUTION
1. Listar itens por categoria.
2. Pontuar Impacto, Risco e Esforço (1–5).
3. Calcular prioridade e ordenar.
4. Propor plano faseado que caiba junto de trabalho de feature.

## OUTPUT CONTRACT
`07-execucao/06-tech-debt.md`: lista priorizada, esforço estimado,
justificativa de negócio, plano faseado.

## VALIDATION
Todo item tem os três scores e a prioridade calculada.

## STOP CONDITIONS
Concluir com a lista ordenada. Não refatorar neste estágio.
