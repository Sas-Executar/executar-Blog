# Estágio 0 — Verificação (sem skill; pré-requisito)

## OBJECTIVE
Confirmar ou refutar cada item "NÃO confirmado" de `00-LEIA-PRIMEIRO/HANDOFF.md`
antes de qualquer decisão de arquitetura.

## CONTEXT
O Blueprint cita comandos e repositórios que não foram verificados. Um handoff
com comando inexistente quebra a execução. Este estágio protege o resto.

## INPUT
Tabela "O que não está verificado" do HANDOFF.md e `02-adr/ADR-001.md`.

## CONSTRAINTS
- Somente leitura: **não instale nada ainda**.
- Fonte primária (repo oficial, npm, docs) vale mais que blog ou resumo.
- Não converta ausência de resultado em fato: "não achei" ≠ "não existe".

## EXECUTION
Para cada item: buscar → abrir a fonte primária → registrar.
1. Repo `kylebrodeur/obsidian-arrow-sandbox` existe? Qual o README diz de
   `create-obsidian-arrow`, `pull-css`, `refresh`, `skills add`?
2. Repo `kepano/obsidian-minimal` existe? Licença?
3. `obsidian-minimal-publish` existe? Licença? Tamanho real?
4. **Licença/termos do `app.css` do Obsidian**: o uso em site público é
   permitido? (Risco D5.) Cite o texto dos termos, não resuma de memória.
5. `Agent SDK` da Anthropic: nome oficial do pacote e versão atual.
6. Power BI embed: pré-requisitos de licença e autenticação.

## OUTPUT CONTRACT
`07-execucao/00-verificacao.md` com tabela:
`Item | Status (CONFIRMADO / REFUTADO / NÃO ENCONTRADO) | Fonte (URL) | Observação`

## VALIDATION
- Todo item tem status e fonte.
- Nenhum status CONFIRMADO sem URL primária.

## STOP CONDITIONS
Se o item 1 ou 2 for REFUTADO, **pare** e reporte: o ADR-001 inteiro depende
deles. Não improvise substituto.
