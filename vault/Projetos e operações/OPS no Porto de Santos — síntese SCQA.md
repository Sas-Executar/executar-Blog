---
title: "OPS no Porto de Santos: síntese SCQA do projeto"
description: "Síntese do projeto de Onshore Power Supply para eletrificação seletiva de berços no Porto de Santos, combinando infraestrutura OPS, BESS, microrede, governança e implantação por piloto."
data: 2026-09-24
---

> [!note] Escopo da síntese
> Este artigo resume o PDF **“Implementação de OPS (Onshore Power Supply) no Porto de Santos”**. Números, projeções, benefícios e estimativas abaixo são apresentados como dados do próprio projeto e não como validação independente.

## Situação

O projeto parte de um Porto de Santos de grande escala física, com operação distribuída por muitos berços e embarcações que ainda podem depender de geração a diesel durante a permanência atracada. Em vez de propor eletrificação integral imediata, o material defende um **piloto de OPS de 2 a 3 anos**, adaptado às condições locais.

OPS — *Onshore Power Supply* — permite que um navio atracado receba energia elétrica em terra e desligue seus geradores auxiliares durante parte da operação portuária.

O próprio projeto usa Singapura como referência de engenharia e descarbonização, mas explicita que a proposta para Santos deve ser seletiva: o objetivo não é copiar outra geografia, e sim adaptar princípios de infraestrutura verde, gestão energética e previsibilidade operacional.

## Complicação

A oportunidade de descarbonizar o cais aparece junto com restrições reais de implantação.

Primeiro, o material associa a demanda por OPS ao avanço de requisitos ambientais e comerciais, citando IMO, EU ETS e o índice ESI como vetores que tornam a disponibilidade de energia limpa em terra mais relevante para rotas e armadores.

Segundo, Santos não é um sistema homogêneo. O projeto destaca fragmentação de berços, demanda elétrica concentrada, acesso terrestre, necessidade de coordenação com a rede local e vulnerabilidade a alagamentos e ressacas.

Terceiro, a eletrificação cria um problema de pico. Se vários consumidores de alta potência forem conectados sem gestão, a demanda simultânea pode pressionar a rede. O projeto responde a isso com **BESS, microrede e gestão de carga**, em vez de dimensionar toda a solução apenas para o pico máximo.

Por fim, a implantação exige mais que hardware: licenciamento, governança público-privada, modelo tarifário, integração com terminais, concessionária, reguladores, armadores e comunidades do entorno.

## Questão

**Como introduzir OPS no Porto de Santos sem tentar eletrificar todos os berços de uma vez, sem transferir o problema para a rede elétrica e sem criar um investimento rígido demais para a evolução tecnológica do setor?**

## Resposta

A resposta proposta é uma implantação modular e concentrada onde o impacto potencial é maior e a operação é mais previsível.

O desenho combina seis camadas:

1. **Geração solar** em áreas disponíveis e coberturas.
2. **Sistema BESS** para armazenar energia e atuar no deslocamento de carga.
3. **Microrede com análise inteligente** para coordenar oferta, demanda e prioridades.
4. **Subestação dedicada**, com proteção e isolamento adequados.
5. **Equipamento OPS** com conectores e conversão compatíveis com os navios-alvo.
6. **Navio conectado**, com motores auxiliares desligados durante a janela atendida.

O projeto também propõe escolher berços de forma “cirúrgica”. Terminais de cruzeiros aparecem como candidatos por manterem navios atracados por períodos mais longos e concentrarem demanda; terminais de contêineres aparecem pela previsibilidade operacional e pela possibilidade de calcular melhor a amortização do investimento.

### Gestão de pico em vez de expansão cega

A curva de *load shaving* apresentada no material é central para o raciocínio. O BESS absorve energia em janelas de menor consumo e entrega energia em momentos críticos, reduzindo a necessidade de projetar toda a infraestrutura apenas para o pico instantâneo.

Esse arranjo transforma o armazenamento em componente operacional do OPS, não em acessório.

### Integração física e digital

O projeto não trata o cais eletrificado isoladamente. O acesso terrestre é ligado a uma cadeia digital com agendamento, Portolog, sensores, análise de dados e controle dinâmico do fluxo. A lógica é que a infraestrutura elétrica só entrega seu potencial quando o terminal consegue coordenar circulação, janela operacional e capacidade disponível.

### Resiliência como requisito de CAPEX

Para Santos, o material incorpora a vulnerabilidade hídrica da Baixada Santista ao desenho do investimento. Subestação, banco de baterias e equipamentos críticos devem ser posicionados e protegidos para reduzir exposição a alagamentos e ressacas, evitando que uma infraestrutura de longo prazo nasça vulnerável a eventos previsíveis.

## CAPEX apresentado pelo projeto

O documento estima **R$ 58 milhões** de CAPEX total, distribuídos em três blocos:

- **R$ 40 milhões** para infraestrutura OPS, incluindo subestação, conversores e adequação de dois berços;
- **R$ 15 milhões** para BESS e cobertura fotovoltaica;
- **R$ 3 milhões** para integração digital e certificações.

O material apresenta ainda **payback estimado de 5 a 7 anos operacionais**. Esse prazo é uma premissa do projeto e depende das hipóteses de utilização, tarifa, financiamento, demanda e receitas consideradas.

```chart
type: bar
title: "CAPEX estimado do projeto OPS"
summary: "Distribuição apresentada no projeto: R$ 40 mi em infraestrutura OPS, R$ 15 mi em BESS + cobertura fotovoltaica e R$ 3 mi em integração digital e certificações. Total estimado: R$ 58 mi."
x: ["Infraestrutura OPS", "BESS + solar", "Integração digital"]
y: [40, 15, 3]
height: 320
```

## Riscos e contramedidas

| Categoria | Risco apresentado | Contramedida proposta |
|---|---|---|
| Técnico | Sobrecarga abrupta da rede local | BESS e gestão inteligente de picos via microrede |
| Financeiro | CAPEX inicial elevado | Estruturação por parceria público-privada |
| Social / ambiental | Ruído de obra e resistência comunitária | PGRS, restrição de horários e diálogo |
| Climático | Alagamentos e ressacas sobre hardware | Elevação preventiva, arquitetura estanque e proteção da subestação |

## Governança

O projeto distribui responsabilidades entre poder público e iniciativa privada. ANTAQ e APS aparecem no eixo regulatório e de metas; a iniciativa privada assume concessão, infraestrutura técnica e execução. O material também propõe mecanismos econômicos como descontos tarifários programados para operações ambientalmente qualificadas.

Essa divisão é relevante porque OPS não é apenas um equipamento de cais: é uma infraestrutura compartilhada entre porto, terminal, sistema elétrico e frota.

## Piloto sugerido

A visualização prospectiva final do projeto destaca três áreas como referências para evolução do piloto:

- **Concaís**, associado ao terminal de cruzeiros;
- **BTP — Brasil Terminal Portuário**, associado a contêineres;
- **Santos Brasil / Tecon Santos**, associado a contêineres.

A escolha definitiva exigiria estudo elétrico, operacional, regulatório e econômico por berço. No projeto, esses pontos funcionam como recortes de aplicação da estratégia modular.

## Síntese

A tese do projeto é que a eletrificação do cais deve ser tratada como um **sistema portuário integrado**, e não como a simples instalação de tomadas para navios.

A sequência proposta é:

```mermaid
flowchart LR
  A[Selecionar berços de maior impacto] --> B[Dimensionar subestação e conexão OPS]
  B --> C[Adicionar BESS e geração solar]
  C --> D[Orquestrar microrede e carga]
  D --> E[Integrar operação terrestre e governança]
  E --> F[Medir piloto por 2 a 3 anos]
  F --> G[Escalar somente o que demonstrar valor]
```

O ganho esperado pelo material combina redução de emissões locais, previsibilidade operacional, aderência a rotas mais exigentes em descarbonização e aprendizado de infraestrutura. A validade econômica e técnica final, porém, depende de engenharia de detalhe, contratos, demanda real e validação das premissas.

## Projeto completo em PDF

[Baixar o PDF — Implementação de OPS no Porto de Santos](/anexos/projeto-ops-porto-de-santos.pdf)
