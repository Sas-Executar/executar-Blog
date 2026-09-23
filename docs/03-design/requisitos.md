# Requisitos extraídos do Blueprint

Cada linha separa **o que o usuário escreveu** de **como foi interpretado**.
O Blueprint parece ter sido ditado por voz; erros de transcrição são
prováveis. Confirme as interpretações marcadas com ⚠️ antes de decidir.

## R-01 a R-05 — Restrições de processo

| ID | Texto literal (Blueprint) | Interpretação | Certeza |
|---|---|---|---|
| R-01 | "mantendo a estratégia minimal code, max arrow" | Menor código próprio possível; maximizar uso de Arrow | Alta |
| R-02 | "Para hosting vou usar cloudfare" | Hospedagem no Cloudflare (Pages/Workers) | Alta |
| R-03 | "para publicação local no [...] github" | Publicação via repositório GitHub | Média ⚠️ (trecho corrompido) |
| R-04 | "[...] tem acesso ao conector Claude cadê também para realizar todo o trabalho" | Claude Code tem acesso ao conector e faz o trabalho de ponta a ponta | Média ⚠️ ("Claude cadê" = "Claude Code") |
| R-05 | "Para env files devem nascer junto do código todas, evita necessidade de fazer manual" | Todos os `.env` gerados por script junto do código | Alta |

Nota R-03/R-04: o trecho "Valdir eixes" não é interpretável e foi
ignorado. Não invente o que ele significaria.

## R-06 — Dependências

| Texto literal | Interpretação |
|---|---|
| "caso necessite de mais dependências sempre priorizando aqueles com mínimo atrito e com integrações já nativas do cloudflare" | Ao precisar de dependência nova: preferir a de menor atrito e integração nativa Cloudflare |

## R-07 — Otimização de build

| Texto literal | Interpretação |
|---|---|
| "usar obsidian-minimal-publish especificamente no build público do blog" | Usar essa variante web-only no build público, reduzindo peso e dependência do `app.css` |

## R-08 a R-13 — Adições ao ADR ("Inclua no adr também")

| ID | Texto literal | Interpretação | Certeza |
|---|---|---|---|
| R-08 | "Stack de tecnologia mais avançado para Ui. Astro - twland." | Astro como framework de UI + Tailwind | Média ⚠️ ("twland" ≈ Tailwind) |
| R-09 | "PowBI Dashboard no front end integrado para dados" | Dashboard Power BI embutido no front-end | Alta |
| R-10 | "agente Sdk antropich" | Agent SDK da Anthropic | Alta |
| R-11 | "aplicação transversal das guidelines Apple HIG interface" | Apple Human Interface Guidelines aplicadas em toda a interface | Alta |
| R-12 | "full stack validação das regras fluent" | Validar regras do Fluent (Microsoft) em toda a stack | Média ⚠️ (não fica claro se é design system ou validação automatizada) |
| R-13 | "respondi idade e adotidade móbile e web" | Responsividade e adaptabilidade em mobile e web | Média ⚠️ |

## Conflitos entre requisitos (alimentam as Decisões Abertas)

- **R-08 vs. ADR-001**: Astro + Tailwind competem com "reusar
  Obsidian/Minimal/Arrow" como camada de UI.
- **R-11 + R-12 vs. ADR-001**: HIG e Fluent são sistemas de design
  próprios; o ADR proíbe criar sistema equivalente ao Obsidian.
- **R-09**: Power BI é ecossistema Microsoft, fora do Cloudflare;
  contradiz "integrações nativas do Cloudflare".
- **R-01 vs. R-08..R-13**: seis camadas adicionais tensionam "minimal code".

O Plan Mode deve levar esses conflitos ao usuário com recomendação, não
resolvê-los sozinho.
