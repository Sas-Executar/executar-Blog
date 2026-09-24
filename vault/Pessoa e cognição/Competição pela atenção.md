---
title: "Competição pela atenção"
description: "Quando tudo chama atenção nada orienta a ação. — síntese a partir de W3C WAI"
autor: "Equipe EXECUTAR"
papel: "Editorial"
pilar: "P1"
consciencia: "C1"
data: 2026-09-24
---

> [!summary] Frase-síntese
> Quando tudo chama atenção nada orienta a ação. — síntese a partir de W3C WAI

```yaml title="fator.yaml"
fator:
  termo: Competição pela atenção
  grupo: Pessoa e cognição
  referencia: W3C WAI
  problema: Sinais simultâneos tornam prioridade e relevância menos distinguíveis
  controle: Remover alertas dispensáveis e reservar saliência para eventos acionáveis
  sinais: [esforço, erro, espera, retrabalho]
```

## 1. Origem

**Termo.** Competição pela atenção.  
**Significado.** Condição da execução que merece observação e controle.  
**Etimologia.** Atenção vem do latim attendere, voltar-se para algo. Competição descreve sinais simultâneos disputando seleção, inclusive quando nenhum é realmente prioritário.

## 2. Contexto

Alertas, cores, sons, mensagens e tarefas urgentes aparecem juntos. A pessoa precisa decidir continuamente o que ignorar. O fator não caracteriza risco sozinho: precisa ser analisado com objetivo, contexto, vulnerabilidade, exposição e impacto.

## 3. 5W2H

| Variável | Síntese |
|---|---|
| O que? | Investigar competição pela atenção na execução real. |
| Por quê? | Reduzir demanda evitável e proteger o objetivo. |
| Onde? | Pessoa, tarefa, ambiente, processo ou tecnologia. |
| Quando? | Quando esforço, erro, espera ou retrabalho aumentarem. |
| Quem? | Executor, responsável pelo processo e projetista do sistema. |
| Como? | Observar sinais, testar controle e comparar resultado. |
| Quanto? | Um experimento pequeno por ciclo de execução. |

## 4. Referência padrão-ouro

W3C WAI é usado como referência central deste framework porque a fonte associada documenta princípios ou achados diretamente aplicáveis ao fator. A centralidade vale para este recorte; não significa consenso exclusivo sobre todo o tema.


## 5. Problema existente

**Definição.** Sinais simultâneos tornam prioridade e relevância menos distinguíveis.  
**Identificação.** Aparece como esforço extra, atraso, erro, esquecimento, espera ou reconstrução.  
**Explicação.** A execução absorve uma demanda que poderia estar no desenho do sistema.  
**Fechamento.** A capacidade disponível deixa de servir integralmente ao objetivo.

## 6. Problema solucionado

**Definição.** A parte controlável do fator fica visível e recebe um experimento.  
**Identificação.** Remover alertas dispensáveis e reservar saliência para eventos acionáveis.  
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
  B --> C[Competição pela atenção]
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

- [Limit Interruptions](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o5p01-minimal-interruptions/) — W3C WAI, 2021.


## 13. Painel ilustrativo (dados fictícios)

```chart
type: bar
title: "Interrupções por canal (dados fictícios)"
summary: "Número ilustrativo de interrupções por dia, por canal. Dados fictícios."
x: ["Notificação push", "E-mail", "Chat", "Reunião"]
y: [24, 12, 31, 9]
height: 320
```
