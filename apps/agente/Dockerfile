# Imagem oficial do Cloudflare Sandbox (template sandbox-sdk/examples/claude-code), contexto = raiz do repo.
FROM docker.io/cloudflare/sandbox:0.12.10
WORKDIR /app
RUN npm install --omit=dev --no-audit --no-fund @anthropic-ai/claude-agent-sdk@0.3.280
COPY apps/agente/container/agente.mjs /app/agente.mjs
# Conteúdo publicado, somente leitura para o agente.
COPY vault /vault
ENV COMMAND_TIMEOUT_MS=120000
EXPOSE 3000
