# Estágio 8 — skill `engineering:documentation`

## OBJECTIVE
Documentar o projeto para um mantenedor iniciante.

## CONTEXT
O dono é iniciante e opera sozinho. A documentação é o que permite voltar
ao projeto meses depois.

## INPUT
Repositório, ADRs, checklist de deploy.

## CONSTRAINTS
Princípios da skill: escrever para o leitor, começar pelo mais útil, mostrar
comandos, manter atual, **linkar em vez de duplicar** (aponte para os ADRs).

## EXECUTION
Produzir em `06-docs/`:
- **README**: o que é, quick start < 5 min, configuração, como contribuir.
- **Onboarding**: setup do ambiente, sistemas-chave e como se conectam,
  tarefas comuns com passo a passo.
- **Runbook**: quando usar, pré-requisitos, procedimento, rollback,
  escalonamento — incluindo o fluxo de **atualização do upstream**
  (bloco "Atualização" do ADR-001).

## OUTPUT CONTRACT
`06-docs/README.md`, `06-docs/onboarding.md`, `06-docs/runbook.md`.

## VALIDATION
Um iniciante consegue rodar o projeto local seguindo só o README, em < 5 min.

## STOP CONDITIONS
Concluir quando os três documentos existem e os comandos foram executados
de fato ao menos uma vez.
