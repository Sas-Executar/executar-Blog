# Plano de refatoração do design (auditoria vs. referência em PDF)

| Campo | Valor |
|---|---|
| ID | DS-AUDIT-01 |
| STATUS | PREPARED (aguarda escolha de opção) |
| OWNER | usuário (decisão) · Claude (execução) |
| AUTOMATION_LEVEL | A1 (plano) → A4 após aprovação |
| EVIDENCE | PDF "Foto.pdf" (14 capturas), `astro.config.mjs`, `vault/**` |

## 1. O que a referência mostra (PDF)
Capturas do app Claude/Craft no celular:
1. **Coluna única, leitura vertical**, fonte do sistema, muito espaço em branco, cartões com canto arredondado.
2. **Gráficos gerados a partir de um bloco de texto simples** (`TYPE: BAR`, `SCENARIO`, `DIMENSION`, `MEASURE`) → barras, linha, dispersão.
3. **Fluxogramas** (cadeia causal, ciclo vicioso) em caixas com setas, cor lilás suave.
4. **Blocos de código** com rótulo ("Plain text") e botão de copiar.
5. Título + subtítulo acima de cada gráfico.

## 2. Estado atual (auditoria)
| Item | Hoje | Diferença para a referência |
|---|---|---|
| Shell | Starlight + CSS do `starlight-theme-obsidian` + `tokens.css` (HIG) | Barra lateral, TOC e cabeçalho de "documentação" — visual de docs, não de leitura |
| Callouts `> [!summary]` | Convertidos pelo `starlight-obsidian` em *asides* | OK, só estilo |
| Propriedades (frontmatter) | Só `title`/`description` viram página; bloco `yaml title="fator.yaml"` aparece como código | Não aparecem como "propriedades" visuais |
| Mermaid | Funciona (gerado no `content:sync`) | OK — já é o equivalente aos fluxogramas |
| Código | Expressive Code (rótulo + copiar) | OK |
| **Gráficos** | **HTML cru com JSON do ECharts** (`<figure class="grafico"><div data-grafico='{...}'>`) em 21 artigos | **Causa principal**: não é Markdown; impossível escrever à mão como no PDF |

Conclusão: o problema não é falta de biblioteca de estilo, e sim (a) gráficos escritos em HTML/JSON e (b) layout de "site de documentação" em vez de "artigo".

## 3. Opções

### Opção A — Ajuste mínimo dentro do stack atual (recomendada)
Zero pacote novo para gráficos: o **Mermaid, já instalado, desenha barras, linhas, pizza e quadrantes**.
```mermaid
xychart-beta
  title "Receita por canal"
  x-axis [Orgânico, Parceiros, Outbound, Paid, Eventos]
  y-axis "R$ mil"
  bar [180, 140, 100, 90, 61]
```
- Gráficos: trocar os 21 `<figure data-grafico>` por blocos `xychart-beta` / `pie` / `quadrantChart` (dispersão ≈ quadrante).
- Leitura: esconder a barra lateral nas páginas de artigo (`template: splash` ou `tableOfContents: false` no frontmatter — recurso nativo do Starlight) e limitar largura a ~680px.
- Propriedades: trocar o bloco `yaml fator.yaml` por propriedades no frontmatter e exibi-las num override oficial `PageTitle` (1 componente pequeno).
- Estilo: tons lilás/cinza nos tokens do Mermaid (`themeVariables`) e cartões arredondados nos asides via `tokens.css`.
- Custo: baixo · Risco: baixo · Respeita todos os ADRs.
- Limite: dispersão verdadeira não existe no Mermaid; `<Grafico>`/ECharts fica como exceção.

### Opção B — A + bloco de gráfico "igual ao PDF"
Pequeno plugin remark (~40 linhas) que lê um bloco ` ```chart ` em YAML (`type`, `title`, `x`, `y`) e gera o `<figure>` do ECharts que já existe. Você escreve:
````
```chart
type: scatter
title: Complexidade × tempo de ciclo
x: [2,3,4,5,6,7,8,9]
y: [4,5,8,7,11,14,18,22]
```
````
- Cobre dispersão, linha e barras com o visual do ECharts.
- Custo: médio · código próprio (viola parcialmente "minimal code"; ADR novo necessário).

### Opção C — Trocar o tema Starlight
Pacotes prontos: `starlight-theme-nova`, `starlight-theme-rapide`, `starlight-theme-flexoki`, `starlight-theme-black` (versões e compatibilidade com Astro 7: **A VERIFICAR**).
- Muda só a "pele"; continua com cara de documentação. Não resolve gráficos.

### Opção D — Migrar para publicador nativo de Obsidian
| Ferramenta | Prós | Contras |
|---|---|---|
| **Obsidian Publish** + tema **Minimal** | Renderização idêntica ao Obsidian (callouts, propriedades, Mermaid, plugins de tema) | Pago (~US$8/mês), sem o agente/Worker, sem testes HIG |
| **Quartz 4** | Grátis, feito para vault Obsidian, callouts/propriedades/Mermaid nativos, deploy no Cloudflare Pages | Reescreve o shell: ADRs 002–005 caem, agente precisa ser reintegrado |

- Custo: alto · só vale se o "igual ao Obsidian" for prioridade acima do agente.

## 4. Recomendação
**A agora, B depois só se faltar dispersão.** A resolve ~80% da diferença sem pacote novo e mantém tudo que já foi testado.

## 5. Nós de execução (Opção A)
| ID | Tarefa | Depende de | Aceite |
|---|---|---|---|
| A1 | Converter 21 gráficos HTML → `xychart-beta`/`pie` no `vault/` | — | `grep -r data-grafico vault` = 0 |
| A2 | Tema Mermaid lilás via `themeVariables` | — | screenshot light/dark |
| A3 | Layout de leitura: sem sidebar/TOC em artigos, largura 680px | — | e2e 375px sem rolagem lateral |
| A4 | Propriedades do frontmatter visíveis (override `PageTitle`) | A1 | propriedades aparecem no topo |
| A5 | `npm run content:sync && npm run check && npm run test:e2e` | A1–A4 | tudo verde |
| A6 | Atualizar `ESTADO.md` + ADR-010 | A5 | registro feito |

## 6. Decisão pendente (USER_ACTION_REQUIRED)
Escolher: **A**, **A+B**, **C** ou **D**. A escolha desbloqueia o nó A1.
