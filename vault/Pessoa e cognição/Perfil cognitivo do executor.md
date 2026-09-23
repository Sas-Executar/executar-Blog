---
title: "Perfil cognitivo do executor"
description: "O sistema deve apoiar diferenças sem rotular pessoas. — síntese a partir de W3C COGA"
---

> **Frase-síntese:** O sistema deve apoiar diferenças sem rotular pessoas. — síntese a partir de W3C COGA

## 1. Origem

**Termo.** Perfil cognitivo do executor.  
**Significado.** Condição da execução que merece observação e controle.  
**Etimologia.** Perfil deriva do italiano profilo, contorno; cognitivo vem do latim cognoscere, conhecer. Aqui descreve necessidades funcionais observáveis, não diagnóstico ou identidade fixa.

## 2. Contexto

Duas pessoas recebem a mesma tarefa e encontram barreiras diferentes de memória, atenção, linguagem ou organização. Tratar ambas como idênticas esconde necessidades de apoio. O fator não caracteriza risco sozinho: precisa ser analisado com objetivo, contexto, vulnerabilidade, exposição e impacto.

## 3. 5W2H

| Variável | Síntese |
|---|---|
| O que? | Investigar perfil cognitivo do executor na execução real. |
| Por quê? | Reduzir demanda evitável e proteger o objetivo. |
| Onde? | Pessoa, tarefa, ambiente, processo ou tecnologia. |
| Quando? | Quando esforço, erro, espera ou retrabalho aumentarem. |
| Quem? | Executor, responsável pelo processo e projetista do sistema. |
| Como? | Observar sinais, testar controle e comparar resultado. |
| Quanto? | Um experimento pequeno por ciclo de execução. |

## 4. Referência padrão-ouro

W3C COGA é usado como referência central deste framework porque a fonte associada documenta princípios ou achados diretamente aplicáveis ao fator. A centralidade vale para este recorte; não significa consenso exclusivo sobre todo o tema.


## 5. Problema existente

**Definição.** Desenho uniforme que ignora variação funcional e contexto.  
**Identificação.** Aparece como esforço extra, atraso, erro, esquecimento, espera ou reconstrução.  
**Explicação.** A execução absorve uma demanda que poderia estar no desenho do sistema.  
**Fechamento.** A capacidade disponível deixa de servir integralmente ao objetivo.

## 6. Problema solucionado

**Definição.** A parte controlável do fator fica visível e recebe um experimento.  
**Identificação.** Oferecer alternativas de apresentação, ritmo, lembretes e sequência sem diagnosticar.  
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
  B --> C[Perfil cognitivo do executor]
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
	<figcaption>Barreiras relatadas por tipo (dados fictícios)</figcaption>
	<div class="area" style="height:320px" data-grafico='{"tooltip":{},"grid":{"left":8,"right":16,"top":24,"bottom":8,"containLabel":true},"xAxis":{"type":"category","data":["Memória","Atenção","Linguagem","Organização"],"axisLabel":{"interval":0,"rotate":0}},"yAxis":{"type":"value"},"series":[{"type":"bar","data":[35,28,15,22],"itemStyle":{"borderRadius":4}}]}' data-descricao="Barreiras relatadas por tipo (dados fictícios). Distribuição ilustrativa (%) de barreiras relatadas por executores. Dados fictícios." role="img" aria-label="Barreiras relatadas por tipo (dados fictícios). Distribuição ilustrativa (%) de barreiras relatadas por executores. Dados fictícios."></div>
	<p class="resumo">Distribuição ilustrativa (%) de barreiras relatadas por executores. Dados fictícios.</p>
</figure>

## Relacionados

- [[Tailoring do projeto]]
- [[Quantidade de informação]]
