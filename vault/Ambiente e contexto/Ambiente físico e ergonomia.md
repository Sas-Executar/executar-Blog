---
title: "Ambiente físico e ergonomia"
description: "O ambiente deve se ajustar ao trabalho humano. — síntese a partir de ISO"
---

> [!summary] Frase-síntese
> O ambiente deve se ajustar ao trabalho humano. — síntese a partir de ISO

```yaml title="fator.yaml"
fator:
  termo: Ambiente físico e ergonomia
  grupo: Ambiente e contexto
  referencia: ISO
  problema: Condições físicas e organizacionais acrescentam demanda evitável
  controle: Ajustar posto, sinais, ruído, iluminação, pausas e circulação ao contexto
  sinais: [esforço, erro, espera, retrabalho]
```

## 1. Origem

**Termo.** Ambiente físico e ergonomia.  
**Significado.** Condição da execução que merece observação e controle.  
**Etimologia.** Ergonomia combina o grego ergon, trabalho, e nomos, regra. O campo estuda como sistemas, tarefas e ambientes podem ser projetados para pessoas.

## 2. Contexto

Ruído, iluminação inadequada, desconforto e layout ruim competem com a tarefa e tornam a permanência mais custosa. O fator não caracteriza risco sozinho: precisa ser analisado com objetivo, contexto, vulnerabilidade, exposição e impacto.

## 3. 5W2H

| Variável | Síntese |
|---|---|
| O que? | Investigar ambiente físico e ergonomia na execução real. |
| Por quê? | Reduzir demanda evitável e proteger o objetivo. |
| Onde? | Pessoa, tarefa, ambiente, processo ou tecnologia. |
| Quando? | Quando esforço, erro, espera ou retrabalho aumentarem. |
| Quem? | Executor, responsável pelo processo e projetista do sistema. |
| Como? | Observar sinais, testar controle e comparar resultado. |
| Quanto? | Um experimento pequeno por ciclo de execução. |

## 4. Referência padrão-ouro

ISO é usado como referência central deste framework porque a fonte associada documenta princípios ou achados diretamente aplicáveis ao fator. A centralidade vale para este recorte; não significa consenso exclusivo sobre todo o tema.


## 5. Problema existente

**Definição.** Condições físicas e organizacionais acrescentam demanda evitável.  
**Identificação.** Aparece como esforço extra, atraso, erro, esquecimento, espera ou reconstrução.  
**Explicação.** A execução absorve uma demanda que poderia estar no desenho do sistema.  
**Fechamento.** A capacidade disponível deixa de servir integralmente ao objetivo.

## 6. Problema solucionado

**Definição.** A parte controlável do fator fica visível e recebe um experimento.  
**Identificação.** Ajustar posto, sinais, ruído, iluminação, pausas e circulação ao contexto.  
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
  B --> C[Ambiente físico e ergonomia]
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

- [ISO 10075-2:2024 — Ergonomic principles related to mental workload](https://www.iso.org/standard/76686.html) — International Organization for Standardization, 2024.


## 13. Painel ilustrativo (dados fictícios)

```chart
type: bar
title: "Queixas por fator ergonômico (dados fictícios)"
summary: "Frequência relativa de queixas por fator do ambiente físico. Dados ilustrativos, não medidos."
x: ["Iluminação", "Ruído", "Postura", "Temperatura"]
y: [40, 55, 68, 35]
height: 320
```

## Relacionados

- [[Fadiga decisória]]
- [[Ambiente digital]]
