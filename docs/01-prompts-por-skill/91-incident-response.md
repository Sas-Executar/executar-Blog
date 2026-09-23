# Sob demanda — skill `engineering:incident-response`

**Quando acionar:** somente **pós-deploy em produção**, se algo cair ou
degradar.

## OBJECTIVE
Conduzir triagem, comunicação, mitigação e postmortem.

## EXECUTION (fases da skill)
1. **Triage**: severidade SEV1–4, sistemas e usuários afetados.
2. **Communicate**: atualização interna; comunicação externa se necessário.
3. **Mitigate**: registrar passos e linha do tempo; **rollback conforme
   `05-deploy/checklist.md`** se um gatilho foi atingido.
4. **Postmortem**: sem culpados, linha do tempo, 5 porquês, ações com dono.

## CONSTRAINTS
Atualizações factuais, sem especulação. Rollback só dentro dos limiares
definidos no Estágio 7 ou com aprovação do usuário.

## OUTPUT CONTRACT
Status Update e/ou Postmortem nos formatos da skill em
`07-execucao/incidente-<data>.md`.
