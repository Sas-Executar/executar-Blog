# CLAUDE.md — regras permanentes deste projeto

Copie este arquivo para a raiz de `blog/`. O Arrow Sandbox também gera um
`CLAUDE.md`; se ambos existirem, **mescle**, não sobrescreva.

## Modo de trabalho
- Comece **sempre** em Plan Mode. Apresente o plano antes de escrever código.
- Estratégia: **minimal code, max arrow**.
- O usuário é iniciante. Explique decisões em linguagem simples e escolha o
  caminho de menor atrito.

## Regras invioláveis
1. `public/app.css` **nunca** entra no Git.
2. `vendor/obsidian-ui/` é submodule: **nunca editar, nunca copiar** para `src/`.
3. Ordem de UI: Obsidian → Minimal → Arrow → CSS próprio (último recurso).
4. `.env` nascem por script; `.env.example` no Git, `.env` real ignorado.
5. **Nunca** expor chave da Anthropic ou token do Power BI ao cliente.
6. Não crie: pacote de design tokens, cópia de CSS upstream, abstração
   equivalente ao Obsidian.

## Antes de agir
- Não invente comandos. Se um comando do ADR falhar, **pare e reporte**.
- Deploy em produção, exclusão e publicação exigem **aprovação explícita**.
- Nunca declare sucesso sem ter rodado o comando e visto o resultado.

## Comandos de verificação
```bash
npm run check
npm run build
git ls-files | grep -c app.css   # deve imprimir 0
```

## Ao terminar cada estágio
Atualize `07-execucao/ESTADO.md` (status, decisões, evidência).
