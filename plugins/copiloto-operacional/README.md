# Copiloto Operacional — plugin do Claude Code

Opera o programa EXECUTAR direto no Claude Code, com **o mesmo núcleo** do Worker do ADR-015
(`apps/copiloto/worker`), sem e-mail nem Cloudflare. Decisão: `docs/02-adr/ADR-016.md`.

## Instalar
No Claude Code (terminal):
```
/plugin marketplace add Sas-Executar/executar-Blog
/plugin install copiloto-operacional@executar-blog
/plugin configure copiloto-operacional@executar-blog     # token do GitHub, repositórios, papel
```
No claude.ai: Settings → Plugins → Add marketplace → `Sas-Executar/executar-Blog`.

Requisito: Node.js ≥ 22.13 no PATH (o servidor usa `node:sqlite` para o ledger local).

## Comandos
| Comando | Faz |
|---|---|
| `/copiloto-operacional:hoje` · `:amanha` | tarefas do dia, atrasadas, WIP · amanhã e dependências abertas |
| `:urgente` | lista; `#n ...` marca; `<area> <texto> dod: ...` cria |
| `:fila <area> "<título>" dod: <critério>` | cria tarefa na fila |
| `:ideia <area> <texto>` | ideia fora do backlog |
| `:progresso <escopo> [alvo]` | o `/%` (por peso) |
| `:feito <#n\|CHAVE\|"título"> [url]` | DONE só com DoD + evidência + verificação |
| `:campanha <WF-ID> iniciar\|estado\|avancar instancia: X` | runbook com gates (`ops/workflows`) |
| `:status-report <tipo> [alvo] [html\|pdf]` | relatório sobre os tokens da skill executar-relatorios, em `reports/AAAA/MM/` |
| `:criar-workflow` · `:criar-rotina` · `:criar-runbook` | PR em `ops/` — o merge humano aprova |
| `:confirmar <token>` · `:cancelar <token>` | planos em lote |
| `:reconciliar` | reverte transição ilegal feita na UI e promove desbloqueadas |
| `:espelho` | espelho GitHub → planilha em CSV |
| `:ajuda` | lista tudo |

## Como funciona
- Servidor MCP `copiloto` (`dist/servidor.mjs`, gerado por `npm run plugin:build`), com 4 ferramentas:
  - `consultar`: só leitura. O próprio servidor recusa comandos que escrevem, então essa ferramenta pode ser pré-aprovada.
  - `executar`: escrita. O Claude Code pede aprovação a cada chamada.
  - `reconciliar` e `espelho`.
- Ledger local (idempotência, tokens de confirmação e auditoria) em `${CLAUDE_PLUGIN_DATA}/ledger.db`, com a mesma migration do D1.
- O relatório tem PDF quando há Chromium/Chrome local (`CHROME_PATH`). Sem ele, o status fica `partial` e o HTML A4 sai pronto para imprimir.
- O hook `SessionStart` mostra o `/hoje` no início da sessão, só se `briefing` estiver ligado. É somente leitura.
- Para agendar as rotinas ROT-001/002/003 (briefing, fechamento, report 72h), use as Routines do Claude Code apontando para estes comandos.

## Desenvolvimento
```
npm run plugin:build          # regera dist/servidor.mjs
npm run check                 # inclui o teste do plugin e a checagem de drift do dist/
claude plugin validate plugins/copiloto-operacional
```
