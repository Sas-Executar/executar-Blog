# Estágio 0 — Verificação (somente leitura)

**Data:** 2026-09-23 · **Status:** VERIFIED · **Executor:** Claude Code
**Regra:** fonte primária (registro npm, tarball publicado, repositório oficial, documentação oficial). "Não encontrei" ≠ "não existe".

## 1. Comandos e pacotes do Blueprint / ADR-001

| Item | Status | Fonte (URL) | Observação |
|---|---|---|---|
| Scaffolder `create-obsidian-arrow` | CONFIRMADO (v0.6.4, MIT, 2026-07-09) | https://registry.npmjs.org/create-obsidian-arrow | Repo `kylebrodeur/obsidian-arrow-sandbox` |
| `npm create obsidian-arrow@latest .` | CONFIRMADO | README do pacote (npm) | Sintaxe documentada: `npm create obsidian-arrow@latest my-app` |
| `npm run pull-css` | CONFIRMADO — **inviável em build/produção** | tarball `template/scripts/pull-app-css.mjs` | Extrai `app.css` do `obsidian.asar` do Obsidian **instalado localmente**; sem instalação → `exit 1` |
| `npx create-obsidian-arrow refresh` | CONFIRMADO | tarball `cli/refresh.mjs`, README | Atualiza arquivos gerenciados do sandbox |
| `npx skills add kylebrodeur/obsidian-arrow-sandbox --all --yes --agent claude-code` | CONFIRMADO (sintaxe válida no `skills` v1.7.0) | https://registry.npmjs.org/skills (README vercel-labs/skills) | `--all` já cobre todos os agentes. Skills tratam de portar UI para plugin Obsidian |
| Propósito do Arrow Sandbox | CONFIRMADO: **protótipo de UI de plugin** | tarball `template/package.json`: "Client-only sandbox for prototyping Obsidian plugin UI" | Sem SSR, sem coleções Markdown, sem RSS/SEO |
| Repo `kepano/obsidian-minimal` | CONFIRMADO (MIT) | https://raw.githubusercontent.com/kepano/obsidian-minimal/master/LICENSE | Tema do app; depende do `app.css` |
| `obsidian-minimal-publish` | CONFIRMADO como repo GitHub (MIT); **não existe no npm** (404) | https://github.com/kepano/obsidian-minimal-publish | README: "~16KB compared to ~247KB". Medido: `publish.css` 18,3 KB |
| Licença do `app.css` em site público | RISCO ALTO | https://obsidian.md/terms (acesso direto bloqueado pelo proxy; conteúdo obtido via busca) | Termos proíbem engenharia reversa (exceto plugins não comerciais), distribuição e obras derivadas → não usar em produção. **Texto literal não lido** |
| Agent SDK Anthropic | CONFIRMADO `@anthropic-ai/claude-agent-sdk` 0.3.280 | https://registry.npmjs.org/@anthropic-ai/claude-agent-sdk | Precisa de processo com shell/FS → Cloudflare Sandbox (Containers, Workers Paid) |
| Power BI embed | CONFIRMADO: pago | https://learn.microsoft.com/en-us/power-bi/developer/embedded/embedded-capacity · https://learn.microsoft.com/en-us/power-bi/collaborate-share/service-publish-to-web | Embed exige capacidade Fabric/Embedded; "publish to web" é público sem auth. Decisão do usuário: alternativa open source |

**Veredito:** nenhum comando do ADR-001 é inexistente (sem STOP formal). A base Arrow **não se sustenta** para blog público (propósito + `pull-css` + licença). Decisão do usuário: substituir por Starlight (ver ESTADO.md).

## 2. Pacotes da arquitetura aprovada

| Item | Status | Fonte | Observação |
|---|---|---|---|
| `@astrojs/starlight` | CONFIRMADO 0.42.3 MIT | https://registry.npmjs.org/@astrojs/starlight | Peer `astro ^7.2.10`; inclui Pagefind, sitemap, MDX, Expressive Code |
| `starlight-theme-obsidian` | CONFIRMADO 0.4.1 MIT — último release 2025-08-31 | https://registry.npmjs.org/starlight-theme-obsidian | Peer `starlight-site-graph ^0.5.0`. Compatibilidade com Starlight 0.42 a validar (gate 4a) |
| `starlight-obsidian` | CONFIRMADO 0.15.0 MIT | https://registry.npmjs.org/starlight-obsidian | Mermaid via `rehype-mermaid` (navegador headless) |
| `github-markdown-css` | CONFIRMADO 5.9.0 MIT | https://registry.npmjs.org/github-markdown-css | Escopo `.markdown-body` |
| C3 Astro + Starlight | CONFIRMADO (código do `create-cloudflare` 2.72.11: argumentos extras repassados ao `create-astro`; `astro add cloudflare` no configure) | https://registry.npmjs.org/create-cloudflare | `npm create cloudflare@latest -- apps/blog --framework=astro --platform=workers -- --template starlight` |
| Template Claude-on-Sandbox | CONFIRMADO | https://github.com/cloudflare/sandbox-sdk/tree/main/examples/claude-code | Credencial injetada por proxy; container sem internet exceto hosts permitidos |
| `@cloudflare/sandbox` | CONFIRMADO 0.12.10 Apache-2.0 | https://registry.npmjs.org/@cloudflare/sandbox | — |
| Plugin `engineering` (skills do pipeline) | CONFIRMADO v1.2.0 | https://github.com/anthropics/knowledge-work-plugins/tree/main/engineering | 10 skills: system-design, architecture, testing-strategy, code-review, tech-debt, deploy-checklist, documentation, debug, incident-response, standup |
| Apple HIG | ACESSADO | https://developer.apple.com/design/human-interface-guidelines (accessibility, typography, color, dark-mode, layout, motion, writing, charts) | Regras mensuráveis registradas no ADR-006 |

## 3. Recursos Cloudflare (levantamento)

| Achado | Substitui | Custo | Fonte | Veredito |
|---|---|---|---|---|
| C3 `--framework=astro` | Scaffold blog + wrangler + adapter | Grátis | https://developers.cloudflare.com/pages/get-started/c3/ | ADOTAR |
| `astro-blog-starter-template` | Scaffold de blog Astro | Grátis | https://github.com/cloudflare/templates/tree/main/astro-blog-starter-template | DESCARTAR (Starlight escolhido; pina Astro 5.16.9) |
| Template `sandbox-sdk/examples/claude-code` | Worker+Container+isolamento de credencial | Workers Paid + Containers | https://github.com/cloudflare/sandbox-sdk | ADOTAR |
| Workers Builds (GitHub) | CI/CD + Preview URL por branch | Grátis | https://developers.cloudflare.com/workers/ci-cd/builds/ | ADOTAR |
| Workers + Static Assets | Hospedagem estática+API | Estático grátis e ilimitado | https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ | ADOTAR (Pages: descartar p/ projeto novo) |
| Secrets, `.env`, `secrets.required` | Gestão de variáveis | Grátis | https://developers.cloudflare.com/workers/configuration/secrets/ | ADOTAR |
| AI Gateway | Spend limit, cache, logs de IA | Grátis + tokens | https://developers.cloudflare.com/changelog/product/ai-gateway/ | ADOTAR |
| Turnstile | Anti-bot | Grátis | https://developers.cloudflare.com/use-cases/solutions/protect-sensitive-forms-fraud-abuse/ | ADOTAR |
| Web Analytics | Analytics sem cookies | Grátis | https://developers.cloudflare.com/web-analytics/ | ADOTAR |
| Workers Logs | Logs | Grátis (200k/dia) | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | ADOTAR |
| Claude Managed Agents | Control plane de agentes | Paid, alpha | https://github.com/cloudflare/claude-managed-agents | DESCARTAR (alpha, excessivo) |
| Workers AI | Modelos abertos | 10k neurons/dia grátis | https://developers.cloudflare.com/workers-ai/platform/pricing/ | DESCARTAR (usuário escolheu Anthropic) |
| Access, KV, D1, R2 | — | — | https://developers.cloudflare.com/workers/platform/pricing/ | Não necessário agora |

## 4. Não confirmado
1. Compatibilidade `starlight-theme-obsidian` 0.4.1 × Starlight 0.42 (gate 4a).
2. Chromium no Workers Builds (Mermaid).
3. Latência/custo real do container do agente.
4. Docker indisponível neste ambiente (verificado: `docker info` falha) → container só testado no preview.
5. Texto literal dos termos do Obsidian e da licença das fontes SF.
