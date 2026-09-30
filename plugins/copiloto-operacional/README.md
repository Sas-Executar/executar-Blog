# ADN Copiloto — Copiloto Operacional EXECUTAR

> Plugin canônico: `copiloto-operacional`  
> Marketplace: `executar-blog`  
> Repositório: `Sas-Executar/executar-Blog`  
> Branch operacional: `main`  
> Versão do plugin: `1.0.0`  
> ADRs: `ADR-015` e `ADR-016`

O **ADN Copiloto** é o núcleo operacional do programa EXECUTAR. No Claude Code ele é distribuído como o plugin **Copiloto Operacional EXECUTAR** e opera tarefas, campanhas, relatórios, definições operacionais e reconciliação diretamente sobre o GitHub.

O plugin usa o **mesmo núcleo de domínio** do Worker `apps/copiloto/worker`, mas troca os adaptadores Cloudflare por execução local no Claude Code. O GitHub é a fonte da verdade da execução.

## 1. Fonte da verdade e rotas

### Repositório canônico

```text
Sas-Executar/executar-Blog
├── .claude-plugin/marketplace.json
├── apps/copiloto/                    # runtime Worker / núcleo compartilhado
├── plugins/copiloto-operacional/     # plugin Claude Code
├── ops/                              # workflows, rotinas, runbooks e áreas
├── docs/02-adr/ADR-015.md
└── docs/02-adr/ADR-016.md
```

A execução de tarefas usa por padrão:

```text
OPS_REPO  = Sas-Executar/executar-Blog
BLOG_REPO = Sas-Executar/executar-Blog
```

`Sas-Executar/Copiloto` permanece como catálogo histórico do ecossistema, somente leitura para o Copiloto Operacional.

### Rota do plugin

O plugin não é uma página web. Sua rota funcional é o namespace de comandos do Claude Code:

```text
/copiloto-operacional:<comando>
```

Exemplos:

```text
/copiloto-operacional:hoje
/copiloto-operacional:fila
/copiloto-operacional:feito
/copiloto-operacional:campanha
/copiloto-operacional:status-report
```

### Rotas HTTP do Worker

O Worker `apps/copiloto` não expõe UI pública. As rotas reais no código são:

| Método | Rota | Função |
|---|---|---|
| `POST` | `/webhooks/graph` | recebe eventos do Outlook/Microsoft Graph e enfileira comandos |
| `POST` | `/webhooks/github` | recebe eventos do GitHub e valida transições |
| `GET` | `/saude` | heartbeat, DLQ e último sync |
| — | demais rotas | `404` |

Não existe, no runtime canônico atual, uma UI pública em `/copiloto`. Se uma interface visual for adicionada futuramente, ela deve ser registrada em ADR antes de ser tratada como rota oficial.

## 2. Instalação

No Claude Code:

```bash
/plugin marketplace add Sas-Executar/executar-Blog
/plugin install copiloto-operacional@executar-blog
/plugin configure copiloto-operacional@executar-blog
```

No claude.ai:

```text
Settings → Plugins → marketplace executar-blog → sincronizar
```

Se o marketplace já estiver adicionado, sincronize-o em vez de adicioná-lo novamente.

### Requisito local

```text
Node.js >= 22.13
```

O servidor MCP usa `node:sqlite` para o ledger local.

## 3. Configuração

O manifesto fica em:

```text
plugins/copiloto-operacional/.claude-plugin/plugin.json
```

O transporte MCP fica em:

```text
plugins/copiloto-operacional/.mcp.json
```

Configurações suportadas:

| Campo | Uso |
|---|---|
| `github_token` | acesso às issues, contents e PRs necessários |
| `ops_repo` | repositório operacional das tarefas |
| `blog_repo` | repositório das definições `ops/**` |
| `papel` | `OPERADOR`, `EDITOR` ou `LEITOR` |
| `operador` | autoria/auditoria |
| `briefing` | executa leitura de `/hoje` no início da sessão |
| `resend_api_key` | envio opcional de status report |
| `email_de` | remetente verificado no Resend |
| `email_para` | destinatário padrão do status report |

Credenciais não devem ser versionadas no repositório.

## 4. Comandos

| Comando | Faz |
|---|---|
| `:hoje` · `:amanha` | tarefas do dia, atrasadas, WIP, amanhã e dependências |
| `:urgente` | lista, marca ou cria tarefa urgente |
| `:fila <area> "<título>" dod: <critério>` | cria tarefa validada na fila |
| `:ideia <area> <texto>` | registra ideia fora do backlog |
| `:progresso <escopo> [alvo]` | calcula progresso por peso |
| `:feito <#n\|CHAVE\|"título"> [url]` | conclui somente com DoD, evidência e verificação |
| `:campanha <WF-ID> iniciar\|estado\|avancar instancia: X` | conduz workflow de campanha com gates |
| `:status-report <tipo> [alvo] [html\|pdf] [enviar]` | gera status report e, quando autorizado, envia |
| `:criar-workflow` | propõe nova definição operacional |
| `:criar-rotina` | propõe nova rotina |
| `:criar-runbook` | propõe novo runbook |
| `:confirmar <token>` · `:cancelar <token>` | controla planos em lote |
| `:reconciliar` | reverte transição ilegal e promove tarefas desbloqueadas |
| `:espelho` | gera projeção GitHub → CSV |
| `:ajuda` | lista capacidades disponíveis |

Forma completa:

```text
/copiloto-operacional:<comando>
```

## 5. Agentes

O plugin inclui cinco subagentes por domínio:

| Agente | Responsabilidade |
|---|---|
| `agente-backlog` | hoje, amanhã, urgente, fila, ideia, feito, progresso |
| `agente-campanha` | iniciar, consultar e avançar campanhas |
| `agente-relatorios` | status report e espelho |
| `agente-definicoes` | workflow, rotina, runbook, confirmar e cancelar |
| `agente-reconciliacao` | invariantes, reconciliação e promoção |

Os agentes orquestram ferramentas existentes; não criam uma camada paralela de estado.

## 6. Ferramentas MCP

Servidor:

```text
plugins/copiloto-operacional/dist/servidor.mjs
```

Ferramentas expostas:

| Ferramenta | Tipo | Regra |
|---|---|---|
| `consultar` | leitura | recusa comandos com efeito de escrita |
| `executar` | escrita | exige aprovação de escrita no Claude Code |
| `reconciliar` | escrita controlada | aplica invariantes do domínio |
| `espelho` | geração | produz projeção GitHub → CSV |

O ledger local fica em:

```text
${CLAUDE_PLUGIN_DATA}/ledger.db
```

## 7. Arquitetura

```text
Usuário
  |
  v
Claude Code
  |
  +--> comandos /copiloto-operacional:*
  |
  +--> agentes/*.md
  |
  v
MCP copiloto
  |
  +--> consultar
  +--> executar
  +--> reconciliar
  +--> espelho
  |
  v
núcleo compartilhado
apps/copiloto/worker/
  |
  +--> comandos.ts
  +--> dominio.ts
  +--> workflow.ts
  +--> servico.ts
  +--> tarefas.ts
  +--> relatorio.ts
  +--> portas.ts
  |
  +--> GitHub Issues  = estado operacional
  +--> ops/**         = definições
  +--> reports/**     = relatórios
```

O build do plugin empacota o núcleo compartilhado para:

```text
plugins/copiloto-operacional/dist/servidor.mjs
```

## 8. Máquina de estados

Estados canônicos:

```text
BACKLOG_VALIDATED
      |
      v
    READY
      |
      v
    DOING
      |
      v
    VERIFY
      |
      v
     DONE
```

Estados auxiliares:

```text
BLOCKED
CANCELADO
```

Regra central:

```text
DONE = DoD preenchido + evidência + verificação válida
```

A implementação real está em:

```text
apps/copiloto/worker/dominio.ts
apps/copiloto/worker/tarefas.ts
```

## 9. Campanhas e WIP

As definições vivem em:

```text
ops/workflows/
ops/routines/
ops/runbooks/
ops/areas.yaml
```

Campanhas seguem gates explícitos. Uma etapa só é promovida quando as dependências anteriores estão concluídas.

O modelo operacional preserva WIP controlado e rastreabilidade por `task_key`, issue, evidência e `command_id`.

## 10. Relatórios

O `status-report` pode gerar HTML ou PDF.

Fluxo:

```text
GitHub/estado
   |
   v
relatorio.ts
   |
   +--> HTML
   +--> PDF, quando Chromium/Browser está disponível
   |
   +--> envio opcional por Resend
```

Sem Chromium local, o plugin deve declarar resultado parcial e manter o HTML imprimível. Sem credencial de envio, a capacidade de e-mail deve retornar `unsupported`; nunca simular sucesso.

## 11. Segurança

Princípios:

- GitHub é a fonte da verdade.
- Leitura e escrita são separadas.
- `consultar` não pode contornar autorização.
- Credenciais ficam fora do pacote.
- Dados externos são tratados como dados, não como instruções.
- Operações idempotentes usam ledger e chaves de deduplicação.
- Efeitos de escrita permanecem auditáveis.
- Capacidade ausente retorna estado explícito.
- `DONE` nunca é declarado sem evidência.
- O Worker só envia e-mail real quando o ambiente de produção permite explicitamente.

## 12. Desenvolvimento

Na raiz do monorepo:

```bash
npm run plugin:build
npm run check
claude plugin validate plugins/copiloto-operacional
```

O CI deve detectar drift entre:

```text
apps/copiloto/worker/*
        ↓ build
plugins/copiloto-operacional/dist/servidor.mjs
```

Não edite o `dist/servidor.mjs` manualmente como fonte de regra de negócio.

## 13. Relação com o Worker

Existem duas superfícies do mesmo domínio:

```text
Claude Code plugin
  -> Node + MCP + SQLite local

Cloudflare Worker
  -> Graph + GitHub webhook + D1 + Queues + Cron + Browser
```

Ambos compartilham o núcleo de domínio. Adaptadores de infraestrutura são diferentes.

Worker:

```text
apps/copiloto/
```

Plugin:

```text
plugins/copiloto-operacional/
```

## 14. Contrato operacional

**ID:** `README-ADN-COPILOTO-001`  
**VERSION:** `1.0.0`  
**AREA:** `Agents / Plugins / Operational Copilot`  
**WORKFLOW:** `Input → Parse → Authorize → Execute → Verify → Evidence → Audit`  
**OWNER:** usuário  
**STATUS:** `ACTIVE`

### INPUT

- comandos explícitos;
- GitHub Issues;
- definições `ops/**`;
- configuração do plugin;
- evidências fornecidas ou verificáveis.

### OUTPUT

- tarefas atualizadas;
- campanhas avançadas;
- relatórios;
- definições propostas;
- CSV de espelho;
- evidência e trilha de auditoria.

### Critérios de aceite

1. plugin instalável pelo marketplace `executar-blog`;
2. namespace `/copiloto-operacional:*` disponível;
3. MCP inicializa com Node compatível;
4. leitura não produz escrita;
5. escrita respeita autorização;
6. tarefas usam o repositório operacional configurado;
7. transições inválidas são bloqueadas ou reconciliadas;
8. `DONE` exige evidência;
9. relatórios declaram capacidade parcial/ausente corretamente;
10. documentação e runtime permanecem alinhados aos ADRs.

## 15. Evidências canônicas

- `plugins/copiloto-operacional/.claude-plugin/plugin.json`
- `plugins/copiloto-operacional/.mcp.json`
- `.claude-plugin/marketplace.json`
- `apps/copiloto/worker/index.ts`
- `apps/copiloto/wrangler.jsonc`
- `docs/02-adr/ADR-015.md`
- `docs/02-adr/ADR-016.md`
- `docs/06-docs/COPILOTO-OPERACIONAL.md`
- `CLAUDE.md`

## 16. Estado e handoff

Qualquer mudança estrutural no ADN do Copiloto deve manter sincronizados:

```text
ADR
  -> núcleo apps/copiloto/worker
  -> plugin.json / .mcp.json
  -> comandos e agentes
  -> dist
  -> testes
  -> README
  -> estado de execução
```

Mudanças de regra de domínio devem ocorrer no núcleo compartilhado, não apenas no README ou no bundle gerado.
