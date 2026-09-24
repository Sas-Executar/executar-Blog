---
title: "Ambiente digital"
description: "Digitalizar não garante reduzir trabalho cognitivo. — síntese a partir de W3C WAI"
---

> [!summary] Frase-síntese
> Digitalizar não garante reduzir trabalho cognitivo. — síntese a partir de W3C WAI

```yaml title="fator.yaml"
fator:
  termo: Ambiente digital
  grupo: Ambiente e contexto
  referencia: W3C WAI
  problema: Estados distribuídos, duplicação e notificações fragmentam a continuidade
  controle: Criar ponto único de continuidade, integrar estados e limitar interrupções
  sinais: [esforço, erro, espera, retrabalho]
```

## 1. Origem

**Termo.** Ambiente digital.  
**Significado.** Condição da execução que merece observação e controle.  
**Etimologia.** Digital deriva do latim digitus, dedo, e passou a nomear representação numérica e computacional. Ambiente digital é o conjunto de ferramentas, estados e interações, não um aplicativo isolado.

## 2. Contexto

Uma tarefa exige e-mail, calendário, arquivos, planilha e gerenciador. Cada ferramenta funciona, mas a pessoa sustenta a integração. O fator não caracteriza risco sozinho: precisa ser analisado com objetivo, contexto, vulnerabilidade, exposição e impacto.

## 3. 5W2H

| Variável | Síntese |
|---|---|
| O que? | Investigar ambiente digital na execução real. |
| Por quê? | Reduzir demanda evitável e proteger o objetivo. |
| Onde? | Pessoa, tarefa, ambiente, processo ou tecnologia. |
| Quando? | Quando esforço, erro, espera ou retrabalho aumentarem. |
| Quem? | Executor, responsável pelo processo e projetista do sistema. |
| Como? | Observar sinais, testar controle e comparar resultado. |
| Quanto? | Um experimento pequeno por ciclo de execução. |

## 4. Referência padrão-ouro

W3C WAI é usado como referência central deste framework porque a fonte associada documenta princípios ou achados diretamente aplicáveis ao fator. A centralidade vale para este recorte; não significa consenso exclusivo sobre todo o tema.


## 5. Problema existente

**Definição.** Estados distribuídos, duplicação e notificações fragmentam a continuidade.  
**Identificação.** Aparece como esforço extra, atraso, erro, esquecimento, espera ou reconstrução.  
**Explicação.** A execução absorve uma demanda que poderia estar no desenho do sistema.  
**Fechamento.** A capacidade disponível deixa de servir integralmente ao objetivo.

## 6. Problema solucionado

**Definição.** A parte controlável do fator fica visível e recebe um experimento.  
**Identificação.** Criar ponto único de continuidade, integrar estados e limitar interrupções.  
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
  B --> C[Ambiente digital]
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
title: "Fricção por tipo de interface (dados fictícios)"
summary: "Esforço percebido (0–100) ao concluir uma tarefa comum, por tipo de interface. Dados ilustrativos, não medidos."
x: ["Notificações", "Formulários", "Navegação", "Permissões"]
y: [72, 58, 45, 63]
height: 320
```

## Relacionados

- [[Ambiente físico e ergonomia]]
- [[Rotina hábitos e contexto]]
