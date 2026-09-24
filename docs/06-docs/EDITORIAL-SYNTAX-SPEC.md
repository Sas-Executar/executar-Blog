# Especificação da sintaxe editorial (ADR-013)

Um artigo é **um arquivo** `vault/<Pasta>/<Título>.md`. O mesmo parser (`packages/markdown-parser`) é usado pelo blog, pelo Studio e pelos exports. O exemplo que cobre tudo e é testado de ponta a ponta está em `tests/fixtures/vault/Laboratório/Sintaxe completa.md`.

**Regra de ouro:** sintaxe desconhecida nunca quebra o build. Ela vira texto ou link e aparece como **aviso** na validação.

## 1. Propriedades (frontmatter)

| Chave | Tipo | Obrigatória | Uso |
|---|---|---|---|
| `title` | texto | sim | título da página |
| `description` | texto | sim | resumo, cartões e SEO |
| `autor`, `papel` | texto | não | autoria |
| `pilar` | `P1` \| `P2` \| `P3` | não | trilha editorial |
| `consciencia` | `C1` \| `C2` \| `C3` | não | nível de consciência |
| `data` | data `AAAA-MM-DD` | não | publicação |
| `tags`, `aliases`, `cssclasses`, `links` | lista | não | nativas do Obsidian |
| `publish: false` ou `draft: true` | booleano | não | esconde em produção |
| outras chaves | inferido | não | painel **Propriedades** (URL, e-mail, data, booleano, número, lista ou texto) |

Propriedades tipadas no estilo Notion, no bloco `propriedades:`:
```yaml
propriedades:
  Status: { tipo: status, valor: Em revisão, opcoes: [Rascunho, Em revisão, Publicado] }
  Horas: { tipo: number, valor: 12 }
  Custo: { tipo: formula, formula: "Horas * 150" }
```
Tipos: `text number boolean date datetime list tags links select multiSelect status relation formula rollup person file url email phone id place`. Formatos de `url`, `email`, `phone`, `number`, `boolean`, `date` e `datetime` são validados. Em `select`/`status`, um valor fora de `opcoes` gera aviso. `formula` aceita só aritmética sobre propriedades numéricas.

`cssclasses` aceita os helpers do Minimal normalizados em tokens: `wide`, `img-grid` e `cards`.

## 2. Obsidian

| Sintaxe | Resultado |
|---|---|
| `==texto==` | destaque (`<mark>`) |
| `%%texto%%` ou bloco `%%` … `%%` | comentário, removido da publicação |
| `#tag` | selo |
| `[[Nota]]`, `[[Nota\|alias]]`, `[[Nota#Título]]`, `[[Nota#^bloco]]` | link interno, resolvido por nome, `aliases` ou título; se quebrado, texto marcado e aviso |
| `texto ^id` no fim do parágrafo | âncora de bloco |
| `![[imagem.png]]` | imagem do vault |
| `![[Nota]]` | cartão de link para a nota |
| `> [!tipo] Título` | callout; `+` abre e `-` fecha (dobrável) |
| `- [ ]`, `- [x]` e estendidas `[/] [-] [>] [<] [?] [!] [*] ["] [l] [b] [i] [S] [I] [p] [c] [f] [k] [w] [u] [d]` | tarefas com ícone e rótulo acessível |
| `[^1]` | nota de rodapé |
| `$…$`, `$$…$$` | matemática (KaTeX no build) |
| ```` ```mermaid ```` | diagrama, desenhado no navegador e acompanhando o tema |
| ```` ```chart ```` | gráfico (ADR-010); `title` e `summary` são obrigatórios |

Dentro de callouts vale toda a sintaxe inline (destaque, links e tags).

## 3. Diretivas

Formato: `:::nome[rótulo]{atributo="valor"}` … `:::` (bloco), `::nome{…}` (linha única). **Aninhamento:** o bloco externo usa mais dois-pontos que o interno (`::::tabs` / `:::tab`).

| Diretiva | Atributos | Saída | Pode conter |
|---|---|---|---|
| `tabs` / `tab[Rótulo]` | — | abas (`role=tablist`, setas do teclado); na impressão, todas abertas | `tab` |
| `columns` / `column` | — | colunas responsivas | `column` |
| `toggle[Título]` | — | `<details>` | qualquer bloco |
| `callout[Título]` | `type` (`insight`, `tip`, `warning`…), `fold` (`open`/`closed`) | callout | qualquer bloco |
| `note`, `tip`, `caution`, `danger` | — | callout (compatível com o Starlight) | qualquer bloco |
| `card[Título]` | — | cartão | qualquer bloco |
| `grid` | `cols` (1–4) | grade (itens da lista ou blocos) | lista ou blocos |
| `steps` | — | passos numerados | lista numerada |
| `timeline` | — | linha do tempo | lista |
| `metric` | `value`, `label`, `delta` | cartão de métrica | — |
| `comparison` | — | antes/depois em 2 colunas (separadas por `---`) | blocos |
| `quote` | `autor`, `cite` | citação com autoria | texto |
| `figure` | `caption` | figura com legenda | imagem ou blocos |
| `embed` | `url`, `title` | iframe só para YouTube (nocookie), Vimeo e Loom; outros hosts viram link | — |
| `toc` | — | sumário dos h2/h3 | — |
| `database` | `from` (pasta), `columns`, `sort` (`campo` ou `-campo`), `filter` (`campo=valor`) | tabela com o frontmatter das notas | — |

Diretiva desconhecida vira `<div class="diretiva diretiva--nome">` com o conteúdo preservado, e a validação gera um aviso.

## 4. Saídas
- **Web:** blog (`apps/blog`) e preview do Studio, com o mesmo HTML.
- **PDF:** `@media print` (abas e toggles abertos, sem navegação); botão "Baixar PDF" no Studio; `npm run export:pdf -- "vault/…md"`.
- **EPUB 3:** `npm run export:epub -- "vault/…md"` ou o botão no Studio.
