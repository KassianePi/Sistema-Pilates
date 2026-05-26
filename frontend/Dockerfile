# ====== BUILD STAGE ======
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:3000/api/v1

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build React app
RUN VITE_API_URL=$VITE_API_URL npm run build

# ====== PRODUCTION STAGE (Nginx) ======
FROM nginx:alpine

# Copiar build do React para Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]
