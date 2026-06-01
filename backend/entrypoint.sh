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
# 2. SINCRONIZAR SCHEMA COM O BANCO (OBRIGATÓRIO)
# ============================================================================

echo "🗄️  Sincronizando schema do Prisma com o banco de dados..."

if [ "$NODE_ENV" = "development" ]; then
  echo "   [DEV] Executando prisma db push..."
  npx prisma db push --skip-generate
else
  echo "   [PROD] Executando prisma migrate deploy..."
  npx prisma migrate deploy
fi

echo "✅ Schema sincronizado com sucesso!"

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
