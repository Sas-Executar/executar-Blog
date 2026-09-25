# RUNBOOK OPERACIONAL — CAMPANHA DE LANÇAMENTO "RISCO COGNITIVO"
**Código:** RC-CAMP-20260906-F01-RUN-V01
**Emitido:** 06/09/2026 (domingo) · **Janela:** pré-produção 07/09 → lançamento 11/09
**Formato:** runbook operacional, leitura sequencial por humano OU por agente de IA executor
**Escopo temático:** arco fundador — Artigo 01 "Risco Cognitivo" (já publicado/base) → **Artigo 02 "Fatores de Risco Cognitivo" (TP-001) = peça-mãe desta campanha** → Artigo 03 "Exposição Cognitiva" (próximo ciclo)
**Fonte de conteúdo:** `RC-KNW-001` (knowledge pack TP-001, já com outline, argumentos, evidências e claims congelados) + `PD-CLB-20260906-F01-DOC-V01` (padrão de produção multiplataforma) + `03_-_doc_fundacao` (framework, manifesto, pilares)

---

## 0. COMO LER ESTE DOCUMENTO

Este runbook é uma **máquina de estados sequencial**, não uma lista de tarefas paralelas. Cada `ENTRYPOINT` só abre depois que o `ENTRYPOINT` anterior fecha (`STATUS: DONE`). Isso é proposital: **produzir peça-mãe → gerar imagem → gerar vídeo → desmembrar em derivados**, nessa ordem, evita trabalhar com muitas variáveis simultâneas na fase errada (redigir texto enquanto ainda se discute conceito visual, ou cortar vídeo antes do roteiro mãe estar fechado).

Se você é um agente de IA executando este runbook: leia o `ENTRYPOINT` atual, execute apenas os passos daquele bloco, produza o(s) `ARTEFATO(S) DE SAÍDA`, marque `STATUS: DONE`, e só então abra o próximo bloco. Não antecipe trabalho de blocos futuros mesmo que pareça mais eficiente — a antecipação é exatamente a causa-raiz de retrabalho que este runbook existe para eliminar.

```
REGRA DE OURO
1 variável em aberto por vez > 5 variáveis em aberto ao mesmo tempo.
Texto trava → trava tudo. Resolva o texto antes de abrir imagem.
Imagem trava → trava vídeo e derivados. Resolva antes de abrir vídeo.
```

---

## 1. DECOMPOSIÇÃO MACRO REGRESSIVA (ordem de execução)

```
ENTRYPOINT 1 — TEXTO (peça-mãe escrita)
   ↓ (gate: artigo aprovado)
ENTRYPOINT 2 — IMAGEM (sistema visual do ciclo)
   ↓ (gate: 6 imagens + 3 infográficos aprovados)
ENTRYPOINT 3 — VÍDEO (mãe + verticais)
   ↓ (gate: vídeo mãe roteirizado e gravado/editado)
ENTRYPOINT 4 — DESMEMBRAMENTO (derivados de todos os canais)
   ↓ (gate: banco de derivados completo e nomeado)
ENTRYPOINT 5 — AGENDAMENTO E PUBLICAÇÃO (calendário de distribuição)
   ↓ (gate: todos os assets no calendário com data/hora/canal)
ENTRYPOINT 6 — MEDIÇÃO E APRENDIZADO (pós-lançamento, ciclo seguinte)
```

Cada `ENTRYPOINT` abaixo tem: **pré-condição**, **passos**, **artefato de saída**, **critério de conclusão (gate)**, **datas do calendário**.

---

## 2. CALENDÁRIO MACRO (visão executiva)

| Data | Dia | Fase | Entrypoint ativo |
|---|---|---|---|
| 06/09 (dom) | — | Hoje — este runbook é emitido | — |
| 07/09 (seg) | pré-prod D1 | Pesquisa + Topic Pack + Outline | ENTRYPOINT 1 (setup) |
| 08/09 (ter) | pré-prod D2 | Redação do artigo mãe (blocos 1–6) | ENTRYPOINT 1 |
| 09/09 (qua) | pré-prod D3 | Redação do artigo mãe (blocos 7–11) + revisão de estilo + GEO | ENTRYPOINT 1 → gate |
| 10/09 (qui) | pré-prod D4 | Imagens + infográficos + roteiro do vídeo mãe | ENTRYPOINT 2 → gate, ENTRYPOINT 3 (roteiro) |
| 11/09 (sex) | **LANÇAMENTO** | Gravação/edição do vídeo mãe + publicação do artigo + Dia 1 de distribuição | ENTRYPOINT 3 → gate, ENTRYPOINT 5 abre |
| 12/09 → 25/09 | pós-lançamento (14 dias) | Desmembramento contínuo + distribuição escalonada + medição | ENTRYPOINT 4, 5, 6 |

> Nota de escala: o padrão-mestre (`PD-CLB`) define um ciclo de 15 dias por peça-mãe. Como o lançamento é em 11/09 e você pediu calendário a partir de amanhã, este runbook comprime a pré-produção em 5 dias (07–11/09) e mantém os 15 dias de distribuição pós-lançamento (11/09–26/09) no padrão original. Se 5 dias for insuficiente na prática, o ponto de corte recomendado é reduzir de 2 exemplos práticos no artigo para 1, nunca cortar a etapa de revisão de estilo/GEO.

---

## 3. ENTRYPOINT 1 — TEXTO (peça-mãe escrita)

**Pré-condição:** nenhuma. Ponto de partida do ciclo.
**Datas:** 07/09 a 09/09 (3 dias)
**Por que começar aqui:** todo o resto (imagem, vídeo, derivados) é recorte de algo que já existe no texto. Gerar imagem ou roteirizar vídeo antes do texto fechado força retrabalho visual toda vez que uma frase muda.

### 3.1 Passo 1 — Fechar o Topic Pack (07/09, manhã)
- **Tema do ciclo:** Fatores de Risco Cognitivo (TP-001) — já validado no knowledge pack, não precisa validação nova.
- **Título de trabalho:** *"Fatores de Riscos Cognitivos: o que aumenta o custo da execução?"*
- **CTA / ferramenta do ciclo:** Scanner de Fatores de Risco Cognitivo (RC-SOLUTION-001) — diagnóstico rápido, gratuito, gera Top 3 fatores prioritários do usuário.
- **Posição no arco:** artigo 2 de 3 (Risco Cognitivo → **Fatores de Risco** → Exposição).
- **Artefato de saída:** confirmação escrita do Topic Pack (3 linhas: tema, título, CTA).

### 3.2 Passo 2 — Outline do artigo (07/09, tarde)
O outline já está definido no knowledge pack (`TP-001.ARTICLE_OUTLINE.V1`). Não recriar — só formatar como checklist de redação:

| Bloco | Conteúdo | Palavras-alvo | Camada (Claim/Evidência/Exemplo/Interpretação) |
|---|---|---|---|
| 1. Abertura | Gancho + dado que estabelece o problema | 150–200 | Claim |
| 2. Contexto | Por que o problema existe e é subestimado | 150–200 | Interpretação |
| 3. O que são fatores de risco cognitivo | Definição do conceito | 150–200 | Claim |
| 4. Fator 1 — Quantidade de informação (FRC-03) | Sobrecarga informacional | 150–200 | Evidência + Exemplo |
| 5. Fator 2 — Forma e visualização (FRC-04) | Apresentação também gera demanda | 150–200 | Evidência + Exemplo |
| 6. Fator 3 — Clareza da tarefa (FRC-07) | Ambiguidade transfere decisão ao executor | 150–200 | Evidência + Exemplo |
| 7. Fator 4 — Decomposição (FRC-06) | Objetivo abstrato sem próximo passo | 150–200 | Evidência + Exemplo |
| 8. Fator 5 — Dependências (FRC-09) | Bloqueios e reconstrução mental do fluxo | 150–200 | Evidência + Exemplo |
| 9. Fator 6 — Task switching (FRC-05) | Custo de alternância e retomada | 150–200 | Evidência + Exemplo |
| 10. Fator 7 — Memória prospectiva (FRC-11) | Depender de lembrar ações futuras | 150–200 | Evidência + Exemplo |
| 11. Fator 8 — Ambiente digital (FRC-15) | Notificações e estados distribuídos amplificam os 7 anteriores | 150–200 | Evidência + Exemplo |
| 12. Da soma de fatores ao risco | Framework: Fatores → Demanda → Exposição → Risco | 150–200 | Interpretação |
| 13. O que fazer com isso hoje | Aplicação prática, sem prescrever de forma genérica | 100–150 | Aplicação |
| 14. Fechamento + CTA | Ligação com o Scanner (RC-SOLUTION-001) | 80–120 | Derivado |

**Total-alvo do artigo: 1.900–2.500 palavras** (levemente acima do padrão-base de 1.800–2.400 porque o TP-001 tem 8 fatores em vez de um único método — cada fator precisa de espaço próprio para não virar lista rasa).

**Linha narrativa congelada (não alterar a ordem):**
`Informação demais → informação mal estruturada → tarefa ambígua → trabalho não decomposto → dependências ocultas → alternância/interrupções → necessidade de lembrar → ambiente digital amplificador.`

- **Artefato de saída:** outline com 14 blocos, palavra-alvo por bloco, camada marcada.
- **Gate parcial:** outline aprovado antes de iniciar redação (não redigir e estruturar ao mesmo tempo).

### 3.3 Passo 3 — Redação blocos 1–6 (08/09, dia inteiro)
Redigir os blocos 1 a 6 da tabela acima (abertura até Fator 3). Cada bloco, ao ser escrito, deve levar uma marcação entre colchetes indicando a camada — ex.: `[EVIDÊNCIA]`, `[EXEMPLO]` — porque essa marcação é o que alimenta o Entrypoint 4 (desmembramento) sem precisar reler o artigo inteiro depois.

**Regras de estilo obrigatórias (aplicar linha a linha):**
- Didático: definir termo técnico na primeira menção; analogia simples permitida; jargão sem explicação, proibido.
- Prático: cada bloco fecha com uma ação ou pergunta aplicável — nunca "reflita sobre isso" sem próximo passo.
- Baseado em evidências: todo claim relevante cita fonte, dado ou estudo (usar `TP-001.EVIDENCE_MATRIX.V1` do knowledge pack).
- Zero coach: tom de repórter especializado — descreve, investiga, contextualiza. Proibido: frase de efeito motivacional, promessa de transformação.
- Veia jornalística: lide com gancho + dado logo na abertura; hierarquia de informação clara; proibido enrolar antes do ponto principal.

- **Artefato de saída:** blocos 1–6 redigidos (~950–1.150 palavras acumuladas).

### 3.4 Passo 4 — Redação blocos 7–14 (09/09, manhã)
Completar os blocos 7 a 14 (Fator 4 até Fechamento/CTA).
- **Artefato de saída:** artigo completo, 1.900–2.500 palavras, todos os 14 blocos marcados por camada.

### 3.5 Passo 5 — Revisão de estilo + GEO (09/09, tarde) — **GATE DO ENTRYPOINT 1**
Checklist de saída (todos os itens obrigatórios antes de fechar o texto):
- [ ] Checklist de estilo (3.3) aplicado linha a linha.
- [ ] Estrutura GEO aplicada: pelo menos 3 perguntas diretas seguidas de resposta objetiva no corpo do texto (ex.: "O que são fatores de risco cognitivo?" → resposta em 1–2 frases logo abaixo).
- [ ] Todas as fontes citadas de forma verificável (não "estudos mostram" genérico).
- [ ] Hierarquia de títulos H1/H2/H3 fechada e coerente com o mapa estrutural do TP-001.
- [ ] Contagem de palavras dentro de 1.900–2.500.
- [ ] Título de trabalho confirmado ou title final decidido.
- [ ] CTA final aponta claramente para o Scanner (RC-SOLUTION-001).

**Artefato de saída final do Entrypoint 1:** arquivo `RC-ART-20260909-F02-ART-V01__fatores-de-risco-cognitivo.md`, texto final aprovado.

**STATUS necessário para abrir Entrypoint 2: DONE.**

---

## 4. ENTRYPOINT 2 — IMAGEM (sistema visual do ciclo)

**Pré-condição:** Entrypoint 1 = DONE (texto fechado e aprovado).
**Data:** 10/09 (dia 1 da manhã)
**Por que só agora:** o texto final é que define quais 6 momentos viram imagem e quais 3 viram infográfico — decidir isso antes do texto fechar gera imagem que não bate com o argumento final.

### 4.1 Sistema visual (já definido, não recriar)
- **Estilo:** isométrico/dimétrico ~2:1, nanquim preto irregular, aquarela granulada, hachuras cruzadas, grayscale dominante + 1–2 zonas de cor viva.
- **Paleta:** Purple `#B8A9E4` · Blue `#5A78EC` · Orange `#F56F49` · Yellow `#C5AF28` · BG `#EFEFEF` · BG Alt `#E7E7E7` · White `#FFFFFF` · Ink `#0A0A0A`.

### 4.2 Briefing das 6 imagens estáticas (feed/apoio)
Cada imagem nasce de um bloco específico do artigo (não inventar cena nova):

| ID | Cena | Bloco-fonte | Formato |
|---|---|---|---|
| VIS-01 | Sobrecarga na entrada | Bloco 4 (Fator 1) | 1:1 feed |
| VIS-02 | Mesma informação, dois custos | Bloco 5 (Fator 2) | 1:1 feed |
| VIS-03 | Tarefa vaga → próxima ação | Bloco 6 (Fator 3) | 1:1 feed |
| VIS-04 | Dependências invisíveis | Bloco 8 (Fator 5) | 1:1 feed |
| VIS-05 | Interrupção e retomada | Bloco 9 (Fator 6) | 1:1 feed |
| VIS-06 | Memória interna × sistema externo | Bloco 10 (Fator 7) | 1:1 feed |

### 4.3 Briefing dos 3 infográficos "cena ambiente" (16:9)
| ID | Conceito | Dados a representar |
|---|---|---|
| INFO-01 | Mapa dos 8 fatores | Os 8 FRC organizados na ordem narrativa congelada (seção 3.2) |
| INFO-02 | Framework do risco | Fatores → Demanda Cognitiva → Vulnerabilidade → Exposição → Risco Cognitivo → Evento → Impacto |
| INFO-03 | Antes/depois do Scanner | Transformação: "percebo sobrecarga" → "reconheço quais condições aumentam a demanda" |

- **Artefato de saída:** 6 imagens + 3 infográficos gerados e aprovados, nomeados conforme convenção (seção 9).
- **Gate:** todas as 9 peças aprovadas visualmente antes de abrir Entrypoint 3.

**STATUS necessário para abrir Entrypoint 3: DONE.**

---

## 5. ENTRYPOINT 3 — VÍDEO (mãe + verticais)

**Pré-condição:** Entrypoint 2 = DONE.
**Datas:** roteiro em 10/09 (tarde), gravação/edição em 11/09 (manhã — dia do lançamento)
**Por que só agora:** o roteiro do vídeo mãe espelha os blocos do artigo E reaproveita os conceitos visuais já aprovados no Entrypoint 2 — roteirizar antes trava o vídeo em conceitos visuais que podem mudar.

### 5.1 Roteiro do vídeo mãe (10/09, tarde)
- **Duração-alvo:** 8–12 minutos (padrão-base) — para o TP-001, usar **8–10 minutos**, já que o knowledge pack tem um roteiro-fonte de 4–6 min (`VID-TP001-MASTER-SCRIPT-V1`) a ser expandido com gancho e blocos completos dos 8 fatores.
- **Estrutura:** gancho (15–20s) → blocos espelhando o artigo (1 bloco por fator, ~50–70s cada) → chamada para os derivados/Scanner no fechamento (30–40s).
- **Marcação obrigatória:** cada bloco do roteiro recebe timestamp estimado — isso alimenta diretamente o Entrypoint 4 (cortes verticais).

### 5.2 Gravação e edição (11/09, manhã)
- Gravar seguindo o roteiro marcado.
- Editar vídeo mãe final, com os infográficos INFO-01/02/03 inseridos como apoio visual nos momentos correspondentes.

**Artefato de saída:** vídeo mãe finalizado, 8–10 min, com marcação de timestamps por fator.

**GATE do Entrypoint 3:** vídeo mãe publicável + artigo publicável = **condição de lançamento em 11/09**.

**STATUS necessário para abrir Entrypoint 4: DONE.**

---

## 6. ENTRYPOINT 4 — DESMEMBRAMENTO (derivados de todos os canais)

**Pré-condição:** Entrypoint 3 = DONE (texto, imagem e vídeo mãe todos fechados).
**Datas:** inicia 11/09 (lançamento) e continua até 25/09 — mas o **corte/roteirização** dos derivados deve estar pronto no dia do lançamento; a publicação escalona (Entrypoint 5).
**Por que só agora:** desmembrar antes da peça-mãe fechada significa recortar algo que ainda vai mudar — retrabalho garantido. Com texto, imagem e vídeo mãe prontos, o desmembramento é só recorte, não criação.

### 6.1 Banco de derivados de texto curto (a partir dos trechos marcados no artigo)
| Canal | Quantidade | Fonte |
|---|---|---|
| Instagram (legenda) | 3 | Blocos 1, 12, 14 (abertura, framework, CTA) |
| LinkedIn (post texto) | 2 | Blocos 3, 13 (definição + aplicação prática) |
| TikTok/Reels (gancho de legenda) | 3 | Blocos 4, 6, 9 (Fator 1, 3, 6 — os 3 mais reconhecíveis) |

### 6.2 Roteiro dos 4 vídeos verticais (cortes do vídeo mãe)
| # | Corte | Fator-base | Gancho (primeiros 2s) |
|---|---|---|---|
| 1 | Sobrecarga de informação | FRC-03 | "Você trava não porque é preguiçoso — trava porque tem informação demais entrando ao mesmo tempo." |
| 2 | Tarefa ambígua | FRC-07 | "Se a tarefa não diz qual é o próximo passo, seu cérebro tem que inventar um." |
| 3 | Task switching | FRC-05 | "Trocar de tarefa tem um custo que ninguém te mostrou." |
| 4 | Ambiente digital | FRC-15 | "Seu ambiente digital pode estar amplificando todos os outros problemas." |

### 6.3 Roteiro/copy dos 6 carrosséis
1 ideia por slide, 1 carrossel por grupo de 1–2 fatores (Instagram/LinkedIn), usando as imagens VIS-01 a VIS-06 já geradas como capa de cada carrossel.

### 6.4 Copy das 6 imagens estáticas
Legenda de apoio para cada VIS-01…VIS-06, ligando a imagem ao fator correspondente e a uma pergunta de engajamento.

### 6.5 Sequência de 10–12 stories
Estrutura obrigatória das "quatro portas": **descoberta** (2–3 stories) → **prova** (3–4 stories, dados do knowledge pack) → **urgência** (2 stories, "o problema se acumula") → **retenção** (2–3 stories, CTA para o Scanner + lembrete de que o artigo/vídeo completo estão no link).

### 6.6 Copy das 3 newsletters do ciclo
| # | Foco | Momento de envio |
|---|---|---|
| 1 | Educa: o que é risco cognitivo e por que fatores importam | 11/09 (dia do lançamento) |
| 2 | Aprofunda: os 8 fatores, com 2–3 detalhados + link para o artigo completo | 15/09 |
| 3 | Vende: prova social/dados + CTA direto para o Scanner | 19/09 |

### 6.7 Outline dos 3 ebooks do ciclo (lead magnets)
Cada ebook aprofunda um recorte que o artigo não esgota:
1. **Ebook 1:** "Os 8 Fatores de Risco Cognitivo — guia de reconhecimento" (expande o núcleo do artigo).
2. **Ebook 2:** "Os 12 fatores de aprofundamento" (usa os FRC-01, 02, 08, 10, 12–14, 16–20 do knowledge pack, não descartados).
3. **Ebook 3:** "Como usar o Scanner de Fatores de Risco Cognitivo" (guia de uso do produto/CTA).

### 6.8 Mapeamento dos 6 CTAs de ferramenta
Distribuir o CTA do Scanner (RC-SOLUTION-001) entre: artigo (fechamento), vídeo mãe (fechamento), 1 vídeo vertical, 1 carrossel, sequência de stories (porta de retenção), newsletter 3.

**Artefato de saída:** banco completo de derivados — 3 legendas Instagram + 2 posts LinkedIn + 3 ganchos TikTok/Reels + 4 roteiros verticais + 6 carrosséis + 6 copies de imagem + 1 sequência de 10–12 stories + 3 e-mails + 3 outlines de ebook, todos nomeados e indexados (seção 9).

**STATUS necessário para abrir Entrypoint 5: DONE.**

---

## 7. ENTRYPOINT 5 — AGENDAMENTO E PUBLICAÇÃO

**Pré-condição:** Entrypoint 4 = DONE.
**Datas:** 11/09 a 25/09 (14 dias de distribuição escalonada pós-lançamento)

### 7.1 Calendário de publicação (semana 1: lançamento)

| Data | Canal | Peça | Função no funil |
|---|---|---|---|
| 11/09 (sex) | Blog | Artigo mãe completo | Awareness + GEO |
| 11/09 (sex) | YouTube | Vídeo mãe (8–10 min) | Consideração + autoridade |
| 11/09 (sex) | Newsletter | E-mail 1 (educa) | Aprofundamento |
| 11/09 (sex) | Instagram Stories | Sequência 1–4 (porta: descoberta) | Ativação |
| 11/09 (sex) | LinkedIn | Post texto 1 | Autoridade B2B |
| 12/09 (sáb) | Reels + TikTok | Vídeo vertical 1 (Fator 1) | Descoberta |
| 12/09 (sáb) | Instagram feed | Carrossel 1 | Consideração |
| 13/09 (dom) | Instagram Stories | Sequência 5–8 (porta: prova) | Prova social |
| 14/09 (seg) | YouTube Shorts | Corte do vídeo vertical 1 | Descoberta + SEO vídeo |
| 14/09 (seg) | LinkedIn | Post texto 2 | Autoridade B2B |
| 15/09 (ter) | Newsletter | E-mail 2 (aprofunda) | Aprofundamento + venda |
| 15/09 (ter) | Reels + TikTok | Vídeo vertical 2 (Fator 3) | Descoberta |
| 16/09 (qua) | Instagram feed | Carrossel 2 + imagem estática 1 | Consideração |

### 7.2 Calendário de publicação (semana 2: sustentação)

| Data | Canal | Peça | Função no funil |
|---|---|---|---|
| 17/09 (qui) | Reels + TikTok | Vídeo vertical 3 (Fator 6) | Descoberta |
| 17/09 (qui) | Instagram Stories | Sequência 9–10 (porta: urgência) | Ativação |
| 18/09 (sex) | LinkedIn | Vídeo nativo (recorte do vídeo mãe) | Autoridade B2B |
| 18/09 (sex) | Instagram feed | Carrossel 3 + imagem estática 2 | Consideração |
| 19/09 (sáb) | Newsletter | E-mail 3 (vende) | Venda |
| 19/09 (sáb) | Reels + TikTok | Vídeo vertical 4 (Fator 8) | Descoberta |
| 20/09 (dom) | Instagram Stories | Sequência 11–12 (porta: retenção) + CTA Scanner | Conversão |
| 21/09 (seg) | Instagram feed | Carrossel 4 + imagem estática 3 | Consideração |
| 22/09 (ter) | YouTube Shorts | Corte do vídeo vertical 2 | Descoberta + SEO vídeo |
| 23/09 (qua) | Instagram feed | Carrossel 5 + imagem estática 4 | Consideração |
| 24/09 (qui) | LinkedIn | Post texto (síntese/aprendizados) | Autoridade B2B |
| 25/09 (sex) | Instagram feed | Carrossel 6 + imagem estática 5–6 | Consideração |
| 25/09 (sex) | Todos | Publicação dos 3 ebooks (lead magnets) como CTA em posts de fechamento | Conversão |

**Regra de agendamento:** nunca republicar a mesma peça sem ajuste de formato nativo por plataforma (Tópico 6 do padrão-mestre) — LinkedIn nunca recebe link externo no corpo do post (colocar no comentário); TikTok nunca recebe corte do Reels sem reedição mínima de enquadramento/legenda.

**Artefato de saída:** calendário completo com data, hora sugerida, canal, peça e link/arquivo de cada publicação.

**STATUS necessário para abrir Entrypoint 6: DONE (todas as 14 datas cumpridas).**

---

## 8. ENTRYPOINT 6 — MEDIÇÃO E APRENDIZADO

**Pré-condição:** Entrypoint 5 em andamento (medição corre em paralelo à publicação, mas a leitura consolidada só acontece ao fim do ciclo).
**Data de leitura consolidada:** 26/09 (dia seguinte ao fim do calendário de distribuição)

### 8.1 KPIs primários (objetivo do ciclo: aquisição de leads via Scanner)
| KPI | Meta do ciclo | Como medir |
|---|---|---|
| Leituras do artigo mãe | 100% de referência (baseline do ciclo) | Analytics do blog |
| Visualizações do vídeo mãe (>50% assistido) | referência de retenção | YouTube Studio |
| Cliques no CTA do Scanner (todos os canais somados) | referência de intenção | UTM por canal |
| Scanners iniciados | referência de ativação | Produto/app |
| Scanners completados | referência de conversão | Produto/app |
| Inscritos na newsletter via ciclo | referência de captura | Ferramenta de e-mail |

> Como não há histórico de campanha anterior neste ecossistema, o primeiro ciclo estabelece a **baseline**. Metas numéricas absolutas só devem ser fixadas a partir do ciclo 2, usando este ciclo como referência.

### 8.2 KPIs secundários por canal
- Instagram: alcance, salvamentos, compartilhamentos dos carrosséis (indicador de "vale a pena guardar" > curtida).
- LinkedIn: tempo de leitura do post + comentários (algoritmo pondera tempo de leitura, não só reação).
- TikTok/Reels: retenção nos primeiros 3 segundos (valida o gancho).
- Newsletter: taxa de abertura por e-mail da sequência de 3 (mede se a educação → prova → venda está funcionando na ordem certa).

### 8.3 Registro de aprendizado (alimenta o próximo ciclo)
Ao fim, registrar em 1 página: (1) qual fator gerou mais engajamento — vira candidato a aprofundamento no Artigo 03 "Exposição Cognitiva"; (2) qual formato de derivado teve melhor retenção/conversão — ajusta a proporção de formatos do próximo ciclo; (3) qual pergunta/comentário recorrente do público aponta o próximo Topic Pack.

**Artefato de saída:** relatório de 1 página com os 6 KPIs primários, KPIs secundários por canal, e 3 aprendizados registrados.

---

## 9. GOVERNANÇA — NOMENCLATURA E PASTAS

**Padrão de nome:** `[HUB]-[PILAR]-[AAAAMMDD]-[SEQ]-[TIPO]-V[VERSÃO]__[slug-descritivo]`

Exemplo já aplicado: `RC-ART-20260909-F02-ART-V01__fatores-de-risco-cognitivo.md`

TIPO por asset: `ART` (artigo) · `VID` (roteiro/vídeo) · `CRS` (carrossel) · `IMG` (imagem) · `INF` (infográfico) · `STR` (stories) · `NWL` (newsletter) · `EBK` (ebook) · `RUN` (runbook/processo).

**Pastas do ciclo:**
```
01_PLANEJAMENTO/          → Topic Pack, outline
02_PESQUISA-EVIDENCIAS/   → já herdado do RC-KNW-001
03_PECA-MAE/              → artigo final + roteiro do vídeo mãe
04_DERIVADOS-TEXTO/       → posts, legendas, carrosséis, copy de imagens
05_ROTEIROS-VIDEO/        → 4 verticais + stories
06_BRIEFINGS-VISUAIS/     → briefings de imagem/infográfico p/ geração
07_NEWSLETTERS/           → 3 e-mails
08_EBOOKS/                → 3 ebooks
09_CTAS-FERRAMENTAS/      → mapa dos 6 CTAs
10_CONTROLE-INDEXACAO/    → índice geral do ciclo
```

---

## 10. FERRAMENTAS E TÁTICAS PRÁTICAS (mais usadas hoje, 2026)

Lista aplicada ao runbook — não teórica; cada linha diz onde entra no processo acima.

| Tática/ferramenta | O que é | Onde aplicar neste runbook |
|---|---|---|
| **GEO (Generative Engine Optimization)** | Estruturar texto em pergunta-resposta direta + citar fontes, para ser citado por IA generativa (ChatGPT, Perplexity, AI Overviews) | Entrypoint 1, passo 3.5 (gate de revisão) |
| **Barbell content strategy** | Produzir só nos dois extremos — muito curto (descoberta) ou muito profundo (decisão) — nunca conteúdo médio | Toda a matriz do Entrypoint 5 (vídeo mãe = profundo; Reels/TikTok = curto) |
| **Vídeo nativo obrigatório** | Gravar/editar especificamente para cada plataforma, nunca republicar sem adaptação | Entrypoint 4, seção 6.2 (cada corte vertical tem gancho próprio) |
| **Economia da autenticidade** | Comunidade e comportamento humano > produção impecável; imperfeição controlada gera mais confiança | Roteiro de stories (6.5) e vídeos verticais — priorizar tom direto sobre polimento |
| **Creator founder** | Comunicar estrutura de negócio real (produto, processo) por trás do conteúdo, evitando estética de "guru" | Bio e CTAs (seção 11) |
| **Newsletter como canal de venda** | Sequência de e-mails que educa → antecipa objeção → mostra prova → só então vende | Entrypoint 4, seção 6.6 (3 e-mails com essa progressão exata) |
| **Claim/Evidência/Exemplo/Interpretação/Derivado** | Separar essas 5 camadas na redação para permitir recorte sem reescrever | Entrypoint 1, passo 3.3 (marcação por colchetes) |
| **UTM por canal** | Rastrear de qual peça/canal vem cada clique no CTA do Scanner | Entrypoint 6, seção 8.1 |
| **Link em comentário (LinkedIn)** | Nunca colocar link externo no corpo do post — reduz alcance do algoritmo | Entrypoint 5, seção 7.1, nota de regra de agendamento |

---

## 11. BIO, FRASES DE POSICIONAMENTO E CTAs (opções prontas para uso)

### 11.1 Opções de bio (Instagram/TikTok/LinkedIn — curta, ~150 caracteres)
1. `Risco Cognitivo: gerenciamento e controle da carga mental que trava sua execução. Ciência + processo + tecnologia.`
2. `Quando o sistema exige demais da cognição, a execução vira risco. Método para reconhecer, tratar e controlar.`
3. `Neurodivergência × gestão de riscos, processos e projetos. Menos esforço mental desnecessário, mais execução sustentável.`

### 11.2 Opções de bio longa (YouTube/site — 1 parágrafo)
1. *"Gerenciamento e Controle de Riscos Cognitivos: um framework que une neurociência, comportamento e gestão de riscos, processos e projetos para reduzir o custo cognitivo evitável na execução. Conteúdo, método e ferramentas para quem trabalha, estuda ou empreende sob alta demanda cognitiva."*
2. *"Custo cognitivo não é falta de esforço — é o resultado de sistemas mal desenhados. Aqui você encontra o método para identificar, analisar e controlar os fatores que aumentam o risco de execução, com base em evidência, não em fórmula motivacional."*

### 11.3 Frases de posicionamento (para hero de site, abertura de vídeo, thumbnail)
1. **"Quando o sistema exige demais da cognição, a execução vira risco."** *(frase-âncora do projeto — usar como frase-mãe sempre que possível)*
2. "Riscos cognitivos são identificados pela gestão de riscos, reduzidos pelo desenho de processos, tratados por projetos de mudança e controlados por pessoas, métodos, ambiente e tecnologia."
3. "Fator ≠ vulnerabilidade ≠ exposição ≠ risco — e essa diferença muda como você resolve."
4. "Não queremos ensinar pessoas a suportarem sistemas mal desenhados. Queremos ajudar pessoas a construir sistemas melhores."
5. "Custo cognitivo gera exposição. Exposição pode produzir risco de execução. Risco pode ser reduzido por controle."

### 11.4 CTAs prontos por estágio de funil

**Descoberta (topo de funil — Reels/TikTok/Stories iniciais):**
- "Reconhece essa sensação? Isso tem nome — e método."
- "Não é falta de organização. Pode ser um fator de risco cognitivo. Assista até o fim."

**Consideração (carrossel/LinkedIn/vídeo mãe):**
- "Descubra os 8 fatores que mais aumentam o custo da sua execução — artigo completo no link da bio."
- "Salve este post para revisar quando a sobrecarga bater de novo."

**Conversão (fechamento de artigo, vídeo mãe, stories de retenção, newsletter 3):**
- "Quer saber quais desses 8 fatores pesam mais no seu caso? Faça o Scanner gratuito de Fatores de Risco Cognitivo — leva menos de 3 minutos."
- "O Scanner te mostra seu Top 3 de fatores prioritários. É gratuito e leva menos tempo do que você imagina."

**Newsletter (assinatura):**
- "Toda semana, um recorte prático de como reduzir custo cognitivo no trabalho, nos estudos e na rotina — sem fórmula motivacional, com evidência."

---

## 12. RESUMO DE ENTREGA DO LANÇAMENTO (checklist final antes de 11/09)

- [ ] Artigo mãe (1.900–2.500 palavras) aprovado
- [ ] 6 imagens estáticas + 3 infográficos aprovados
- [ ] Vídeo mãe (8–10 min) gravado e editado
- [ ] 4 roteiros de vídeo vertical prontos para corte/publicação escalonada
- [ ] 6 carrosséis + copy prontos
- [ ] Sequência de 10–12 stories roteirizada
- [ ] 3 e-mails de newsletter escritos
- [ ] 3 outlines de ebook prontos (produção completa pode seguir após o lançamento)
- [ ] Calendário de 14 dias com todas as datas/canais/peças preenchido
- [ ] 6 CTAs de ferramenta mapeados nas peças corretas
- [ ] Todos os arquivos nomeados e nas pastas padrão (seção 9)

**Se qualquer item acima estiver pendente em 10/09 à noite, a prioridade de corte é: reduzir ebooks (3→1 pronto, 2 em produção pós-lançamento) antes de reduzir artigo, imagem ou vídeo mãe — a peça-mãe nunca é sacrificada pelo prazo.**
