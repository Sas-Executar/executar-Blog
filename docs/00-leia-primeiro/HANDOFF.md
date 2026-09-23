# HANDOFF — Blog Obsidian UI (Pipeline de Engenharia)

> Leia este arquivo inteiro antes de qualquer ação. Você está em **Plan Mode**.
> Não escreva código de produção antes de o plano ser aprovado pelo usuário.

## OBJECTIVE

Construir um blog novo cuja UI é **dependência upstream** do Obsidian
(app.css) + Obsidian Minimal + Arrow Sandbox, sem criar nem manter design
system próprio. Estratégia obrigatória: **minimal code, max arrow**.

Entregável observável: repositório `blog/` que passa em
`npm run check` e `npm run build`, com deploy no Cloudflare e ADR-001
registrado.

## CONTEXT

- Usuário é **iniciante** e provavelmente esqueceu itens de stack.
  Cabe a você **descobrir e propor** o que falta, sempre pelo caminho de
  menor atrito e com integração nativa Cloudflare.
- Hosting: **Cloudflare**. Publicação local: via **GitHub**.
- Você tem acesso ao **conector Claude Code** e deve realizar o trabalho
  de ponta a ponta.
- Arquivos `.env` devem **nascer junto do código** (gerados por script),
  nunca exigir criação manual.
- Fonte da decisão: `02-adr/ADR-001.md` (transcrito do Blueprint).

## O QUE NÃO ESTÁ VERIFICADO (leia com atenção)

O Blueprint nomeia comandos e pacotes que **não foram confirmados** na
preparação deste handoff. Trate como **hipótese a validar no Passo 0**:

| Item | Status |
|---|---|
| Existe scaffolder `create-obsidian-arrow` | Parcialmente confirmado (há sandbox Arrow.js + scaffolder com esse nome) |
| Comando `npm create obsidian-arrow@latest .` | **NÃO confirmado** |
| Script `npm run pull-css` | **NÃO confirmado** |
| Comando `npx create-obsidian-arrow refresh` | **NÃO confirmado** |
| `npx skills add kylebrodeur/obsidian-arrow-sandbox --all --yes --agent claude-code` | **NÃO confirmado** |
| Repo `kepano/obsidian-minimal` | **NÃO confirmado** |
| `obsidian-minimal-publish` (~16 KB, MIT) | **NÃO confirmado**; números vêm do Blueprint |
| `app.css` do Obsidian pode ser obtido por `pull-css` | **NÃO confirmado**; ver risco de licença |

Se qualquer item falhar no Passo 0, **pare e reporte** (ver STOP CONDITIONS).
Não invente substituto silenciosamente.

## PIPELINE (ordem fixa)

Cada estágio usa uma skill `engineering:*` e produz um artefato em
`07-execucao/`. Um estágio só começa quando o anterior tem seu gate verde.

| # | Skill | Prompt | Artefato de saída | Gate |
|---|---|---|---|---|
| 0 | (verificação) | `01-prompts-por-skill/00-verificacao.md` | `07-execucao/00-verificacao.md` | Todos os itens da tabela acima marcados CONFIRMADO ou BLOQUEIO |
| 1 | `system-design` | `01-prompts-por-skill/01-system-design.md` | `07-execucao/01-system-design.md` | Componentes, fluxo de dados e stack completos |
| 2 | `architecture` | `01-prompts-por-skill/02-architecture.md` | `02-adr/ADR-001.md` finalizado + ADR-002..N | ADR com opções, trade-offs, consequências |
| 3 | `testing-strategy` | `01-prompts-por-skill/03-testing-strategy.md` | `04-testes/plano-de-testes.md` | Pirâmide definida antes do código |
| 4 | *(implementação)* | `01-prompts-por-skill/04-implementacao.md` | código no repo `blog/` | `npm run check` e `npm run build` passam |
| 5 | `code-review` | `01-prompts-por-skill/05-code-review.md` | `07-execucao/05-code-review.md` | Zero achados 🔴 Critical |
| 6 | `tech-debt` | `01-prompts-por-skill/06-tech-debt.md` | `07-execucao/06-tech-debt.md` | Duplicações do critério arquitetural listadas |
| 7 | `deploy-checklist` | `01-prompts-por-skill/07-deploy-checklist.md` | `05-deploy/checklist.md` | Checklist completo, rollback definido |
| 8 | `documentation` | `01-prompts-por-skill/08-documentation.md` | `06-docs/` (README, onboarding, runbook) | Quick start < 5 min |
| — | `debug` | `01-prompts-por-skill/90-debug.md` | sob demanda | Só se um gate falhar |
| — | `incident-response` | `01-prompts-por-skill/91-incident-response.md` | sob demanda | Só pós-deploy |
| — | `standup` | `01-prompts-por-skill/92-standup.md` | sob demanda | Só para resumo de progresso |

`debug`, `incident-response` e `standup` **não fazem parte do caminho
crítico**. Acione-as apenas nas condições indicadas na coluna Gate.

## CONSTRAINTS

### Obrigatórias
1. **Precedência de UI**: Obsidian `app.css` → Minimal → componentes Arrow → Blog.
2. Antes de implementar UI: reutilizar tokens Obsidian → Minimal → primitives
   Arrow → CSS próprio **somente** se 1–3 forem insuficientes.
3. `app.css` **nunca** entra no Git (gitignored, obtido por `pull-css`).
4. `vendor/obsidian-ui` é **submodule**, nunca copiado para `src/`.
5. **Nunca** editar arquivos dentro de `vendor/`.
6. `.env` gerados junto do código por script.
7. Dependências: priorizar as com **integração nativa Cloudflare** e
   mínimo atrito.

### Proibições (do ADR)
- Pacote local de design tokens.
- Cópia de CSS upstream.
- Abstração própria equivalente ao Obsidian.
- Componente que uma classe/primitive existente já represente.

### Critério arquitetural
Qualquer implementação que replique comportamento/estilo já existente em
Obsidian, Minimal ou Arrow Sandbox é **duplicação** e deve ser evitada.

## REQUISITOS ADICIONAIS DO BLUEPRINT (a incluir no ADR)

O usuário pediu explicitamente que entrem no ADR:

1. Stack de UI mais avançada: **Astro + Tailwind** ("Astro - twland" no
   original; interpretado como Tailwind — confirmar, ver Decisões Abertas).
2. **Power BI** dashboard integrado no front-end para dados.
3. **Agent SDK da Anthropic** ("agente Sdk antropich").
4. Aplicação transversal das **Apple HIG** na interface.
5. Validação full-stack das **regras Fluent**.
6. Responsividade e adaptabilidade **mobile e web**
   ("respondi idade e adotidade móbile e web" no original; interpretado
   como responsividade/adaptabilidade).
7. Otimização opcional: `obsidian-minimal-publish` no build público.

## DECISÕES ABERTAS (resolver no Plan Mode, com o usuário)

Estas contradições vêm do próprio Blueprint. **Pergunte antes de decidir**:

| # | Tensão | Por que importa |
|---|---|---|
| D1 | **Arrow Sandbox é para prototipar UI de plugin Obsidian**, não para blog. Blog em **Astro** conflita com scaffold Arrow/Vite | Dois frameworks de UI disputando a mesma camada |
| D2 | **Tailwind vs. classes Obsidian/Minimal**: Tailwind é sistema de utilitários próprio | Viola "não criar abstração equivalente ao Obsidian" se usado além do layout |
| D3 | **Apple HIG + Fluent + Obsidian/Minimal** são três linguagens visuais | ADR diz "sem design system próprio"; HIG/Fluent transversais podem exigir um |
| D4 | **Power BI embed**: exige licença, conta Microsoft e Entra ID/token | Impacta custo e "minimal code" |
| D5 | **`app.css` do Obsidian é proprietário**; ADR o mantém fora do Git mas o usa em produção | Verificar se o uso em site público é permitido antes de publicar |
| D6 | "Astro - twland" e "respondi idade e adotidade" são ambíguos (transcrição de voz) | Confirmar interpretação |

## EXECUTION

1. Leia `02-adr/ADR-001.md` e `03-design/requisitos.md`.
2. Execute o **Passo 0** (verificação). Registre resultado.
3. Apresente um **plano** ao usuário (Plan Mode) que inclua as decisões
   abertas D1–D6 com sua recomendação para cada.
4. Só após aprovação, percorra o pipeline 1→8 na ordem.
5. A cada estágio: leia o prompt, execute, salve o artefato, valide o gate,
   atualize `07-execucao/ESTADO.md`.

## OUTPUT CONTRACT

- Artefatos exatamente nos caminhos da tabela do pipeline.
- `07-execucao/ESTADO.md` atualizado a cada estágio
  (concluído / pendente / decisões / evidências).
- Nenhum segredo em saída ou commit.

## VALIDATION

Ver `04-testes/` e `05-deploy/`. Checagens mínimas por estágio estão na
coluna Gate.

## STOP CONDITIONS

**Pare e reporte** (bloqueio, por que impede, menor ação para continuar) se:

1. Qualquer item "NÃO confirmado" falhar no Passo 0.
2. Uma decisão aberta D1–D6 não tiver resposta do usuário e alterar a
   arquitetura materialmente.
3. Uma ação for irreversível ou externa (deploy em produção, publicação,
   exclusão) sem aprovação explícita.
4. Faltar credencial Cloudflare/GitHub/Power BI que você não pode obter
   por ferramenta.
5. Um gate falhar duas vezes seguidas → acione `debug`.

**Conclua** quando: `check` e `build` passam, deploy em preview validado,
ADR e docs entregues, e nenhuma pendência material permanece.
