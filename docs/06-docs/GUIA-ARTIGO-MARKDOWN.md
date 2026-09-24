# Guia: escrever e publicar um artigo

Um artigo é **um arquivo só**: `vault/<Pasta>/<Título>.md`. O mesmo arquivo abre no Obsidian e é publicado no blog, sem conversão. Toda a sintaxe está em [EDITORIAL-SYNTAX-SPEC.md](./EDITORIAL-SYNTAX-SPEC.md).

## 1. Modelo mínimo
```markdown
---
title: Título do artigo
description: Uma frase que resume o artigo.
pilar: P1
consciencia: C1
tags: [atenção]
---

> [!summary] Frase-síntese
> A ideia central em uma frase.

## Primeira seção
Texto com ==destaque== e link para [[Fatores de Riscos Cognitivos]].
```
`title` e `description` são obrigatórios. Sem eles, a validação bloqueia a publicação.

## 2. Três jeitos de publicar

### A. Pelo EXECUTAR Studio (recomendado)
1. Abra o Studio e entre com seu e-mail (Cloudflare Access).
2. Escolha um artigo na lista, ou **Novo artigo**, e informe o arquivo (`Pasta/Título.md`).
3. Escreva à esquerda e veja à direita exatamente como vai ficar no blog.
4. Corrija o que aparecer em **Validação**. Título, descrição e tags também podem ser editados em **Propriedades**.
5. Escolha um botão:
   - **Rascunho:** guarda no GitHub, fora do site.
   - **Preview:** gera um endereço de prévia em 1 a 2 minutos.
   - **Abrir PR:** pede revisão.
   - **Publicar:** coloca no site em 1 a 2 minutos.

Atalhos: `Ctrl/⌘+S` salva o rascunho neste navegador; `Ctrl/⌘+B` aplica negrito; `Ctrl/⌘+I` aplica itálico. **Baixar PDF** e **Baixar EPUB** exportam o artigo.

### B. Pelo site do GitHub
1. Abra `vault/` no repositório → **Add file → Create new file**.
2. Nome: `Pasta/Título.md`. Cole o modelo e escreva.
3. **Commit changes** → escolha "Create a new branch" para abrir um PR, que ganha preview automático, ou faça o commit na `main` para publicar direto.

### C. Por um agente (MCP)
O Studio expõe `/mcp` com `listar_artigos`, `ler_artigo`, `validar_artigo`, `pre_visualizar` e `publicar`. O agente autentica com um service token do Cloudflare Access.

## 3. Imagens
No Studio, use **Imagem**: o arquivo vai para a mesma pasta do artigo e o texto recebe `![[nome.png]]`. No GitHub, envie a imagem para a pasta do artigo e escreva `![[nome.png]]`.

## 4. Esconder um artigo
Use `draft: true` ou `publish: false` no frontmatter.

## 5. Conferir localmente (opcional)
```bash
npm install
npm run dev            # blog em http://localhost:4321
npm run check          # validações e testes
```

## 6. Configurar o Studio (uma vez, feito pelo dono da conta)
1. **Credencial do GitHub** (escolha uma):
   - **GitHub App** (recomendado): GitHub → Settings → Developer settings → GitHub Apps → New. Permissões: *Contents* e *Pull requests* em Read and write. Instale só no repositório `executar-Blog`. Anote o App ID e o Installation ID (aparece na URL da instalação) e gere uma chave privada (.pem).
   - **Token fine-grained:** Settings → Developer settings → Fine-grained tokens, só este repositório, com *Contents* e *Pull requests* em Read and write.
2. **Cloudflare Zero Trust:** ative uma vez no painel, escolha o nome do time e crie a aplicação do Access para o Studio com os e-mails autorizados.
3. Os secrets (`GITHUB_*`, `ACCESS_TEAM`, `ACCESS_AUD`) são cadastrados no Worker `executar-studio`. Nunca coloque essas chaves em arquivos do repositório.
