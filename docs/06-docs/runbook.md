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
   Links internos: `[[Título de outro artigo]]`. Diagramas: blocos ```` ```mermaid ````.
2. `npm run content:sync` (precisa de Chromium para Mermaid; no CI já existe).
3. `npm run check && npm run test:e2e`.
4. Abrir PR → conferir a **Preview URL** comentada pela Cloudflare → merge = produção.

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
