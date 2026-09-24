---
title: "Dependências e cadeia de valor"
description: "Lista completa pode esconder a ordem real do trabalho. — síntese a partir de ISO"
---

> [!summary] Frase-síntese
> Lista completa pode esconder a ordem real do trabalho. — síntese a partir de ISO

```yaml title="fator.yaml"
fator:
  termo: Dependências e cadeia de valor
  grupo: Tarefa e fluxo de execução
  referencia: ISO
  problema: Dependências implícitas geram início prematuro, espera e retrabalho
  controle: Representar depende de, desbloqueia, bloqueado e pronto para iniciar
  sinais: [esforço, erro, espera, retrabalho]
```

## 1. Origem

**Termo.** Dependências e cadeia de valor.  
**Significado.** Condição da execução que merece observação e controle.  
**Etimologia.** Dependência vem do latim dependere, pender de algo. Cadeia vem de catena, sequência ligada. Juntas, mostram que uma ação pode só existir depois de outra.

## 2. Contexto

Aprovar identidade, finalizar página e publicar campanha aparecem lado a lado, embora a segunda dependa da primeira e a terceira da segunda. O fator não caracteriza risco sozinho: precisa ser analisado com objetivo, contexto, vulnerabilidade, exposição e impacto.

## 3. 5W2H

| Variável | Síntese |
|---|---|
| O que? | Investigar dependências e cadeia de valor na execução real. |
| Por quê? | Reduzir demanda evitável e proteger o objetivo. |
| Onde? | Pessoa, tarefa, ambiente, processo ou tecnologia. |
| Quando? | Quando esforço, erro, espera ou retrabalho aumentarem. |
| Quem? | Executor, responsável pelo processo e projetista do sistema. |
| Como? | Observar sinais, testar controle e comparar resultado. |
| Quanto? | Um experimento pequeno por ciclo de execução. |

## 4. Referência padrão-ouro

ISO é usado como referência central deste framework porque a fonte associada documenta princípios ou achados diretamente aplicáveis ao fator. A centralidade vale para este recorte; não significa consenso exclusivo sobre todo o tema.


## 5. Problema existente

**Definição.** Dependências implícitas geram início prematuro, espera e retrabalho.  
**Identificação.** Aparece como esforço extra, atraso, erro, esquecimento, espera ou reconstrução.  
**Explicação.** A execução absorve uma demanda que poderia estar no desenho do sistema.  
**Fechamento.** A capacidade disponível deixa de servir integralmente ao objetivo.

## 6. Problema solucionado

**Definição.** A parte controlável do fator fica visível e recebe um experimento.  
**Identificação.** Representar depende de, desbloqueia, bloqueado e pronto para iniciar.  
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
  B --> C[Dependências e cadeia de valor]
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

- [ISO 31000:2018 — Risk management guidelines](https://www.iso.org/iso-31000-risk-management.html) — International Organization for Standardization, 2018.


## 13. Painel ilustrativo (dados fictícios)

```chart
type: bar
title: "Bloqueios por número de dependências (dados fictícios)"
summary: "Percentual ilustrativo de bloqueios conforme o número de dependências da tarefa. Dados fictícios."
x: ["0 dependências", "1–2", "3–4", "5+"]
y: [5, 18, 34, 57]
height: 320
```

## Relacionados

- [[Agrupamento e segmentação]]
- [[Externalização cognitiva]]
