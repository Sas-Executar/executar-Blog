# Estágio 3 — skill `engineering:testing-strategy`

## OBJECTIVE
Definir a estratégia de testes **antes** da implementação.

## CONTEXT
Blog estático/edge com componentes de UI, integração Power BI e chamadas ao
Agent SDK. Uma pessoa mantém.

## INPUT
`07-execucao/01-system-design.md`, ADRs finalizados.

## CONSTRAINTS
- Pirâmide da skill: muitos unitários, alguns de integração, poucos E2E.
- Cobrir: caminhos críticos, tratamento de erro, bordas, fronteiras de
  segurança, integridade de dados.
- Ignorar: getters/setters triviais, código de framework, scripts descartáveis.
- Custo de manutenção baixo (dono iniciante).

## EXECUTION
Por tipo de componente (tabela da skill):
- **Frontend**: componentes, interação, regressão visual, **acessibilidade**.
- **API/endpoints** (Agent SDK proxy): lógica, integração HTTP, contrato.
- **Infra**: smoke test pós-deploy.
Incluir testes de **responsividade mobile/web** (R-13) e verificação de que
`app.css` **não** está no Git e nenhum arquivo em `vendor/` foi editado.

## OUTPUT CONTRACT
`04-testes/plano-de-testes.md`: o que testar, tipo por área, metas de
cobertura, exemplos de casos, lacunas conhecidas.

## VALIDATION
- Todo requisito R-xx tem ao menos um teste ou justificativa de exclusão.
- Há teste automatizado para as regras de ADR (app.css fora do Git, vendor/
  intocado).

## STOP CONDITIONS
Concluir quando o plano cobre os caminhos críticos e as regras do ADR.
