# Sob demanda — skill `engineering:debug`

**Quando acionar:** um gate falhou duas vezes seguidas, ou o comportamento
diverge do esperado sem causa óbvia.

## OBJECTIVE
Achar a causa-raiz (não o sintoma) e corrigir.

## EXECUTION (4 passos da skill)
1. **Reproduce**: esperado vs. real, passos exatos, escopo.
2. **Isolate**: componente, mudanças recentes (deploy, config, dependência), logs.
3. **Diagnose**: hipóteses testadas, caminho de código, causa-raiz.
4. **Fix**: correção, efeitos colaterais, teste de regressão.

## CONSTRAINTS
Cole mensagens de erro **exatas**. Suspeitos prioritários neste projeto:
`pull-css` falhando, submodule desatualizado, versão de Node, variável de
ambiente ausente.

## OUTPUT CONTRACT
Debug Report: Reproduction, Root Cause, Fix, Prevention.
Salvar em `07-execucao/debug-<data>.md`.

## STOP CONDITIONS
Concluir com correção verificada e teste de regressão adicionado.
