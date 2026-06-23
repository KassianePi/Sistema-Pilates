#!/bin/sh

set -e

echo "🚀 Iniciando Backend do Studio de Pilates..."

# ============================================================================
# 1. ESPERAR MYSQL ACEITAR CONEXÕES
# ============================================================================

DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"

echo "⏳ Aguardando MySQL em ${DB_HOST}:${DB_PORT}..."

MAX_RETRIES=30
RETRY_DELAY=2
RETRIES=0

until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "❌ MySQL não ficou pronto após $((MAX_RETRIES * RETRY_DELAY))s. Abortando."
    exit 1
  fi
  echo "  Tentativa $RETRIES/$MAX_RETRIES — aguardando ${RETRY_DELAY}s..."
  sleep "$RETRY_DELAY"
done

echo "✅ MySQL está aceitando conexões."

# Aguarda mais 2s para o MySQL terminar a inicialização interna
sleep 2

# ============================================================================
# 2. APLICAR MIGRAÇÕES (FLUXO PADRÃO PRISMA MIGRATE)
# ============================================================================
# Tanto em dev quanto em prod usamos `migrate deploy` (aplica as migrações
# versionadas em prisma/migrations). Novas alterações de schema devem ser
# criadas com `prisma migrate dev --name <nome>` (ver prisma/migrations/README.md).
#
# IMPORTANTE: em um banco PRÉ-EXISTENTE (criado antes das migrações), execute
# UMA ÚNICA VEZ o baseline antes do primeiro deploy:
#   docker compose run --rm backend npx prisma migrate resolve --applied 0_init
#
# Em produção (docker-compose.prod.yml), as migrations rodam uma única vez em
# um serviço dedicado ("migrate"). Os containers de backend sobem com
# SKIP_MIGRATE=1 para não reexecutar `migrate deploy` concorrentemente.

if [ "$SKIP_MIGRATE" = "1" ]; then
  echo "⏭️  SKIP_MIGRATE=1 — pulando aplicação de migrações (já aplicadas pelo serviço dedicado)."
else
  echo "🗄️  Aplicando migrações do Prisma (migrate deploy)..."
  npx prisma migrate deploy
  echo "✅ Migrações aplicadas com sucesso!"
fi

# ============================================================================
# 3. INICIAR O SERVIDOR
# ============================================================================

echo ""
echo "🎯 ============================================"
echo "✅ Backend pronto!"
echo "🎯 ============================================"
echo ""

if [ "$NODE_ENV" = "development" ]; then
  echo "📌 Modo: DESENVOLVIMENTO (hot reload ativo)"
  exec npm run dev
else
  echo "📌 Modo: PRODUÇÃO"
  exec npm run start
fi
