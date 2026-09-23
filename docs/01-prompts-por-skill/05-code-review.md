# Estágio 5 — skill `engineering:code-review`

## OBJECTIVE
Revisar o código implementado em segurança, performance, correção e
manutenibilidade.

## CONTEXT
Implementação concluída. Pontos de risco específicos deste projeto: chave do
Agent SDK, token do Power BI, `.env`, headers de segurança no Cloudflare.

## INPUT
Diff completo do repositório `blog/`.

## CONSTRAINTS
Dimensões da skill: Security (OWASP, segredos em código, SSRF, auth),
Performance, Correctness, Maintainability.
Verificação extra deste projeto:
- Nenhuma chave Anthropic ou token Power BI chega ao bundle do cliente.
- `app.css` fora do Git; `vendor/` intocado.
- Duplicação do "critério arquitetural" do ADR-001.

## EXECUTION
Revisar arquivo a arquivo; classificar achados por severidade.

## OUTPUT CONTRACT
`07-execucao/05-code-review.md` no formato da skill: Summary, Critical Issues
(tabela), Suggestions (tabela), What Looks Good, Verdict
(Approve / Request Changes / Needs Discussion).

## VALIDATION
Todo achado tem arquivo, linha e correção sugerida.

## STOP CONDITIONS
Verdict `Request Changes` com Critical → voltar ao Estágio 4. Só avança com
zero Critical.
