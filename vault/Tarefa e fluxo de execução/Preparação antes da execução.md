---
title: "Preparação antes da execução"
description: "Preparar o caminho evita decidir durante cada passo. — síntese a partir de W3C COGA"
---

> [!summary] Frase-síntese
> Preparar o caminho evita decidir durante cada passo. — síntese a partir de W3C COGA

## 1. Origem

**Termo.** Preparação antes da execução.  
**Significado.** Condição da execução que merece observação e controle.  
**Etimologia.** Preparar vem do latim praeparare, deixar pronto antes. Execução vem de exsequi, levar até o fim. Preparação organiza recursos e critérios antes da ação principal.

## 2. Contexto

A pessoa inicia e descobre que faltam arquivo, aprovação, ferramenta ou instrução. O trabalho para e precisa ser retomado depois. O fator não caracteriza risco sozinho: precisa ser analisado com objetivo, contexto, vulnerabilidade, exposição e impacto.

## 3. 5W2H

| Variável | Síntese |
|---|---|
| O que? | Investigar preparação antes da execução na execução real. |
| Por quê? | Reduzir demanda evitável e proteger o objetivo. |
| Onde? | Pessoa, tarefa, ambiente, processo ou tecnologia. |
| Quando? | Quando esforço, erro, espera ou retrabalho aumentarem. |
| Quem? | Executor, responsável pelo processo e projetista do sistema. |
| Como? | Observar sinais, testar controle e comparar resultado. |
| Quanto? | Um experimento pequeno por ciclo de execução. |

## 4. Referência padrão-ouro

W3C COGA é usado como referência central deste framework porque a fonte associada documenta princípios ou achados diretamente aplicáveis ao fator. A centralidade vale para este recorte; não significa consenso exclusivo sobre todo o tema.


## 5. Problema existente

**Definição.** Pré-condições não verificadas transformam execução em busca e espera.  
**Identificação.** Aparece como esforço extra, atraso, erro, esquecimento, espera ou reconstrução.  
**Explicação.** A execução absorve uma demanda que poderia estar no desenho do sistema.  
**Fechamento.** A capacidade disponível deixa de servir integralmente ao objetivo.

## 6. Problema solucionado

**Definição.** A parte controlável do fator fica visível e recebe um experimento.  
**Identificação.** Usar entrada mínima: objetivo, recursos, dependências e pronto para iniciar.  
**Explicação.** O controle transfere demanda evitável para ambiente, processo ou tecnologia.  
**Fechamento.** O resultado passa a ser observado sem prometer eliminação do problema.

## 7. Processo

1. **Entender:** registrar situação, objetivo, sinais e impacto observável.
2. **Estruturar:** localizar o fator e escolher um controle pequeno e reversível.
3. **Executar:** aplicar o controle, comparar antes e depois e registrar aprendizado.

## 8. Visão do sistema

```mermaid
flowchart TD
  A[Objetivo] --> B[Contexto]
  B --> C[Preparação antes da execução]
  C --> D[Demanda cognitiva]
  D --> E[Controle testável]
  E --> F[Evidência e aprendizado]
```

## 9. Progresso esperado

Antes, a pessoa sustenta parte do sistema mentalmente. Com um controle pequeno, observa menos reconstrução ou esforço evitável. Depois, a próxima ação, o estado e o critério ficam mais visíveis no cotidiano, sem afirmar resultado universal.

## 10. Aviso

Conteúdo educativo e operacional. Não diagnostica condição clínica nem transforma característica individual em risco. O efeito depende da pessoa, tarefa, ambiente e contexto.

## 11. Next 01-02-03

**Next 01 — Entender:** escolha uma situação real e descreva onde o esforço aparece.  
**Next 02 — Estruturar:** selecione um controle diretamente ligado ao fator observado.  
**Next 03 — Executar:** teste por um ciclo, compare sinais e registre o que mudou.

```mermaid
flowchart TD
  A[Entender a situação] --> B[Estruturar um controle]
  B --> C[Executar por um ciclo]
  C --> D[Comparar e aprender]
```

## 12. Fontes e aprofundamento

- [Making Content Usable for People with Cognitive and Learning Disabilities](https://www.w3.org/TR/coga-usable/) — W3C WAI, 2021.


## 13. Painel ilustrativo (dados fictícios)

<figure class="grafico">
	<figcaption>Erros por nível de preparação (dados fictícios)</figcaption>
	<div class="area" style="height:320px" data-grafico='{"tooltip":{},"grid":{"left":8,"right":16,"top":24,"bottom":8,"containLabel":true},"xAxis":{"type":"category","data":["Sem preparo","Checklist rápido","Preparo guiado","Preparo + revisão"],"axisLabel":{"interval":0,"rotate":0}},"yAxis":{"type":"value"},"series":[{"type":"bar","data":[44,27,15,9],"itemStyle":{"borderRadius":4}}]}' data-descricao="Erros por nível de preparação (dados fictícios). Percentual ilustrativo de erros conforme o nível de preparação antes de executar. Dados fictícios." role="img" aria-label="Erros por nível de preparação (dados fictícios). Percentual ilustrativo de erros conforme o nível de preparação antes de executar. Dados fictícios."></div>
	<p class="resumo">Percentual ilustrativo de erros conforme o nível de preparação antes de executar. Dados fictícios.</p>
</figure>

## Relacionados

- [[Rotina hábitos e contexto]]
- [[Competição pela atenção]]
