# ====== BUILD STAGE ======
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar o pacote shared ANTES do npm ci para que @pilates/shared (file:../packages/shared)
# possa ser resolvido em ../packages/shared → /packages/shared
COPY packages/shared /packages/shared

# Copiar package files do backend
COPY backend/package*.json ./

# Instalar OpenSSL (necessário para o Prisma engine no Alpine)
RUN apk add --no-cache openssl

# Instalar todas as dependências (incluindo devDeps como tsx e typescript)
RUN npm ci

# Copiar código-fonte do backend
COPY backend/src ./src
COPY backend/prisma ./prisma
COPY backend/tsconfig.json ./

# Gerar Prisma Client (obrigatório antes de qualquer import de @prisma/client)
RUN npx prisma generate

# Build TypeScript para produção (falha do build deve interromper a imagem)
RUN npm run build

# ====== PRODUCTION STAGE ======
FROM node:20-alpine AS production

WORKDIR /app

# Usuário não-root para execução da aplicação
RUN addgroup -g 1001 nodeapp && \
    adduser -D -u 1001 -G nodeapp nodeapp

# Copiar o pacote shared (necessário em runtime para o symlink @pilates/shared resolver)
COPY --chown=nodeapp:nodeapp packages/shared /packages/shared

# Copiar package files e instalar somente dependências de produção
COPY backend/package*.json ./

RUN apk add --no-cache openssl netcat-openbsd && \
    npm ci --only=production && \
    rm -rf /var/cache/apk/*

# Copiar pasta prisma e gerar o client na imagem de produção
COPY backend/prisma ./prisma
RUN npx prisma generate

# @pilates/shared é consumido como .ts puro em dev/testes (via tsx/Vite/Vitest,
# que processam TypeScript nativamente). Em produção, o backend roda só com
# `node` puro (sem tsx) — Node não consegue importar .ts nem resolver imports
# sem extensão em ESM. Por isso, só nesta imagem, compilamos @pilates/shared
# para CommonJS e reapontamos seu package.json para o build (isso NUNCA toca
# o package.json real do repositório — é uma cópia só desta imagem Docker).
RUN node_modules/.bin/tsc -p /packages/shared/tsconfig.build.json && \
    node -e " \
      const fs = require('fs'); \
      const path = '/packages/shared/package.json'; \
      const pkg = JSON.parse(fs.readFileSync(path, 'utf8')); \
      pkg.type = 'commonjs'; \
      pkg.main = './dist/schemas/index.js'; \
      pkg.exports = { '.': './dist/schemas/index.js', './schemas': './dist/schemas/index.js', './schemas/*': './dist/schemas/*.js' }; \
      fs.writeFileSync(path, JSON.stringify(pkg, null, 2)); \
    "

# Copiar código compilado do builder
COPY --from=builder --chown=nodeapp:nodeapp /app/dist ./dist

# Copiar script de inicialização
COPY --chown=nodeapp:nodeapp backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    chown -R nodeapp:nodeapp /app /packages/shared

USER nodeapp

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => { const ok = r.statusCode === 200; r.resume(); r.on('end', () => process.exit(ok ? 0 : 1)) }).on('error', () => process.exit(1))"

ENV NODE_ENV=production

ENTRYPOINT ["/app/entrypoint.sh"]
