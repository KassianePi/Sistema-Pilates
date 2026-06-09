# ====== BASE STAGE (instala dependências) ======
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ====== BUILDER STAGE (dev — usado pelo docker-compose) ======
FROM base AS builder

COPY . .

# Não executa build aqui — o dev server (npm run dev) compila em runtime

# ====== PROD-BUILD STAGE (somente para build de produção) ======
FROM builder AS prod-builder

ARG VITE_API_URL=http://localhost:3000/api/v1

RUN VITE_API_URL=$VITE_API_URL npm run build

# ====== PRODUCTION STAGE (Nginx) ======
FROM nginx:alpine

COPY --from=prod-builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
