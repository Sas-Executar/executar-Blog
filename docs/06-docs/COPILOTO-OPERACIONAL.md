# Copiloto Operacional: como usar

Resumo do ADR-015. Você manda um e-mail com um comando na primeira linha para a caixa do copiloto e recebe a resposta no mesmo thread. O **GitHub** guarda o estado (issues deste repositório, `Sas-Executar/executar-Blog` — ADR-015/016, emenda 2026-09-26; `Sas-Executar/Copiloto` é o catálogo do ecossistema, só leitura). A planilha só espelha o GitHub. O Studio publica.

## Comandos

| Comando | O que faz |
|---|---|
| `/hoje` · `/amanha` | Tarefas do dia, atrasadas e WIP · o que vem amanhã e as dependências abertas |
| `/urgente` · `/urgente #12 #15` · `/urgente <area> <texto>` | Lista, marca ou cria tarefa urgente (mais de 3 marcações pedem `/confirmar`) |
| `/fila <area> <texto>` + `dod: …` | Cria a tarefa na fila. Sem DoD, não entra |
| `/ideia <area> <texto>` | Registra uma ideia fora do backlog e do percentual |
| `/% <programa\|sprint\|area\|urgente\|hoje\|amanha\|fila\|campanha> [alvo]` | Percentual derivado por peso |
| `/feito <#n\|CHAVE\|"título"> [link]` | Só vira Concluída com DoD, evidência e verificação; senão fica em Verificando |
| `/campanha WF-CAMP-001 iniciar` + `instancia: RC-C01` `data: AAAA-MM-DD` `programa: risco-cognitivo` `epic: #284` | Cria as 34 tarefas do runbook de campanha |
| `/campanha WF-CAMP-001 estado\|avancar` + `instancia: RC-C01` | Onde a campanha está (vista Mermaid) · promove o que destravou |
| `/status-report <72h\|wiki\|programa\|sprint\|roadmap\|campanha> [alvo] [html\|pdf]` | Report por e-mail: **html** no corpo ou **pdf** anexo (A4) |
| `/criar-workflow` · `/criar-rotina` · `/criar-runbook` + definição | Abre um PR em `ops/`; **o merge é a aprovação** |
| `/confirmar <token>` · `/cancelar <token>` · `/ajuda` | Controle e ajuda |

Exemplo: report da campanha em PDF:
```
/status-report campanha WF-CAMP-001 RC-C01 pdf
```

## Campanha (runbook com gates)
`ops/workflows/WF-CAMP-001.yaml` segue a ordem **texto → imagem → vídeo → desmembramento → agendamento → medição**. Cada ENTRYPOINT só abre quando o **gate** do anterior está Concluído. As datas contam a partir do dia de lançamento (D0). Os documentos de origem ficam em `ops/runbooks/`.

## Relatórios
Tudo vem da skill `executar-relatorios` (tokens `EXECUTAR-REPORT-PRINT-DS-001`, IBM Plex). Para mudar cor ou fonte, altere a skill no Copiloto, faça o commit e rode:
```
npm run report:sync -- --de ../Copiloto   # depois de atualizar COMMIT em scripts/sync-report-assets.mjs
```

## Segurança
- Só remetentes do `RBAC` com DMARC `pass` são atendidos. Os demais são ignorados, e o operador recebe um alerta.
- Nada é enviado de verdade enquanto `EMAIL_ENVIO_ATIVO` não for `"1"`.
- Todo efeito no GitHub leva `<!-- cmd:… -->`, rastreável até o e-mail. O `audit_log` é append-only.
