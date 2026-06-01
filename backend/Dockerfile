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

# Build TypeScript para produção
RUN npm run build || true

# ====== PRODUCTION STAGE ======
FROM node:20-alpine

WORKDIR /app

# Copiar o pacote shared (necessário em runtime para o symlink @pilates/shared resolver)
COPY packages/shared /packages/shared

# Copiar package files e instalar somente dependências de produção
COPY backend/package*.json ./

RUN apk add --no-cache openssl netcat-openbsd && \
    npm ci --only=production && \
    rm -rf /var/cache/apk/*

# Copiar pasta prisma e gerar o client na imagem de produção
COPY backend/prisma ./prisma
RUN npx prisma generate

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Copiar script de inicialização
COPY backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENV NODE_ENV=production

ENTRYPOINT ["/app/entrypoint.sh"]
