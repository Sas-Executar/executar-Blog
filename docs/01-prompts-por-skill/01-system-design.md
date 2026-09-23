# Estágio 1 — skill `engineering:system-design`

## OBJECTIVE
Produzir o design de sistema do blog seguindo o framework da skill:
requisitos → design de alto nível → deep dive → escala/confiabilidade →
trade-offs.

## CONTEXT
Blog com UI Obsidian/Minimal/Arrow, hospedado no Cloudflare, com dashboard
Power BI e Agent SDK da Anthropic. Usuário iniciante; equipe de uma pessoa.
Leia `03-design/requisitos.md` e `02-adr/ADR-001.md`.

## INPUT
`03-design/requisitos.md`, `02-adr/ADR-001.md`,
`07-execucao/00-verificacao.md`.

## CONSTRAINTS
- Minimal code, max arrow.
- Precedência de UI do ADR-001.
- Onde houver dependência nova, priorizar integração nativa Cloudflare.
- Não decidir D1–D6 sozinho: registre como "decisão pendente" com opções.

## EXECUTION (framework da skill)
1. **Requisitos**: funcionais, não-funcionais (latência, custo, disponibilidade),
   restrições (1 pessoa, iniciante).
2. **Alto nível**: diagrama de componentes (ASCII), fluxo de dados, contratos
   de API, escolhas de armazenamento.
3. **Deep dive**: onde vive o conteúdo do blog; como o Agent SDK é chamado
   (server-side, nunca expor chave no cliente); como o Power BI é embutido;
   modelo de dados se houver.
4. **Escala e confiabilidade**: estimativa de carga realista para um blog;
   cache no edge; monitoramento.
5. **Trade-offs**: complexidade, custo, familiaridade, tempo, manutenção.

## OUTPUT CONTRACT
`07-execucao/01-system-design.md` com: premissas explícitas, diagrama ASCII,
tabela de trade-offs e seção "o que revisitar quando crescer" (exigida pela
skill).

## VALIDATION
- Cada requisito R-01..R-13 mapeado a um componente ou marcado como pendente.
- Nenhuma chave/segredo no cliente.
- Custos recorrentes listados (Cloudflare, Power BI, API Anthropic).

## STOP CONDITIONS
Concluir quando todos os R-xx estão mapeados e as decisões pendentes listadas.
