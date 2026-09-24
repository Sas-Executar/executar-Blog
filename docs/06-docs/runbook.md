# Runbook

**Skill:** `engineering:documentation`

## Publicar artigo
1. Criar/editar `vault/<Grupo>/<Título>.md` com frontmatter:
   ```yaml
   ---
   title: "Título"
   description: "Uma frase de resumo."
   ---
   ```
   Sintaxe completa: `docs/06-docs/EDITORIAL-SYNTAX-SPEC.md`. O blog lê o vault direto (sem conversão).
2. Pelo **Studio** (Rascunho → Preview → Publicar) ou pelo GitHub (PR → **Preview URL** → merge = produção). Guia: `GUIA-ARTIGO-MARKDOWN.md`.
3. Mudanças de código: `npm run check && npm run build && npm run test:e2e`.

## Studio fora do ar
- 403 em tudo: Access não configurado ou JWT inválido (`ACCESS_TEAM`/`ACCESS_AUD` no Worker `executar-studio`).
- "O GitHub recusou a operação": credencial expirada ou sem permissão; ver logs do Worker e renovar `GITHUB_TOKEN` ou a chave do GitHub App.
- "A main mudou enquanto você editava": publicar de novo (o Studio nunca força a `main`).

## Atualizar upstream
`npm run update:upstream` → se `check`/`build` passarem, abrir PR. Se o tema quebrar, ver ADR-003.

## Assistente fora do ar
Sintoma: `/perguntar/` mostra "o assistente está indisponível agora" (blog continua funcionando).
1. Painel → `executar-agente` → Logs: erro de chave? → reconfigurar `ANTHROPIC_API_KEY`.
2. AI Gateway: spend limit atingido? → ajustar limite.
3. Container: Painel → Containers → instâncias com erro → redeploy do agente.
Escalonamento: usuário (owner) decide sobre custo/limites.

## Rollback
Ver `docs/05-deploy/checklist.md` → Rollback.

## Incidente
Usar a skill `engineering:incident-response` e registrar em `docs/07-execucao/`.
