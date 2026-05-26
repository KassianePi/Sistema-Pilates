# ====== BUILD STAGE ======
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build TypeScript
RUN npm run build || true

# ====== PRODUCTION STAGE ======
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências de produção + ferramentas utilitárias
COPY package*.json ./

RUN npm ci --only=production && \
    apk add --no-cache netcat-openbsd && \
    rm -rf /var/cache/apk/*

# Copiar código compilado do builder
COPY --from=builder /app/dist ./dist

# Copiar pasta prisma (necessário para migrations)
COPY prisma ./prisma

# Copiar script de inicialização
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV DB_HOST=mysql
ENV DB_PORT=3306

# Usar entrypoint script para migrations automáticas
ENTRYPOINT ["/app/entrypoint.sh"]
