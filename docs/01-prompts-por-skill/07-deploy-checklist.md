# Estágio 7 — skill `engineering:deploy-checklist`

## OBJECTIVE
Gerar e executar a checklist de pré-deploy para Cloudflare.

## CONTEXT
Primeiro deploy do blog. Usuário iniciante. Deploy em produção é **ação
externa e potencialmente irreversível**.

## INPUT
Repositório revisado, plano de testes, resultado de tech-debt.

## CONSTRAINTS
- Estrutura da skill: Pre-Deploy, Deploy, Post-Deploy, Rollback Triggers.
- **Deploy em preview primeiro.** Produção só com aprovação explícita.
- Definir gatilhos de rollback **antes** de fazer deploy.
- Se algum conector (GitHub, CI, monitoramento) estiver ativo, usá-lo para
  verificar status em vez de assumir.

## EXECUTION
1. Preencher a checklist com dados reais (não placeholders).
2. Confirmar CI verde e variáveis de ambiente configuradas no Cloudflare.
3. Deploy em preview → smoke tests → monitorar.
4. Pedir aprovação para produção.

## OUTPUT CONTRACT
`05-deploy/checklist.md` com itens marcados e limiares de rollback numéricos.

## VALIDATION
Nenhum `[X]` ou `[Critical user flow]` sem preencher. Rollback documentado.

## STOP CONDITIONS
**Sem aprovação explícita do usuário, não promova a produção.**
