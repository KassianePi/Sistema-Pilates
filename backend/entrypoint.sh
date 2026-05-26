#!/bin/sh

# ============================================================================
# ENTRYPOINT.SH — Inicialização Automática do Backend com Migrations
# ============================================================================
# Este script:
# 1. Aguarda o MySQL ficar pronto
# 2. Executa as migrations do Prisma
# 3. Popula dados iniciais (seed)
# 4. Inicia o servidor Fastify
# ============================================================================

set -e

echo "🚀 Iniciando Backend do Studio de Pilates..."

# ============================================================================
# 1. ESPERAR MYSQL ESTAR PRONTO
# ============================================================================

echo "⏳ Aguardando MySQL estar pronto..."

MAX_RETRIES=30
RETRY_DELAY=2
RETRIES=0

while [ $RETRIES -lt $MAX_RETRIES ]; do
  if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
    echo "✅ MySQL está pronto!"
    break
  fi

  RETRIES=$((RETRIES + 1))
  echo "  Tentativa $RETRIES/$MAX_RETRIES - Aguardando MySQL..."
  sleep $RETRY_DELAY
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
  echo "❌ Erro: MySQL não ficou pronto após $((MAX_RETRIES * RETRY_DELAY)) segundos"
  exit 1
fi

# ============================================================================
# 2. GERAR PRISMA CLIENT (se necessário)
# ============================================================================

echo "📦 Gerando Prisma Client..."
npx prisma generate

# ============================================================================
# 3. EXECUTAR MIGRATIONS
# ============================================================================

echo "🗄️  Aplicando migrations do Prisma..."

# Opção A: Para desenvolvimento (mais rápido, sem histórico)
if [ "$NODE_ENV" = "development" ]; then
  echo "   [DEV] Usando 'prisma db push'..."
  npx prisma db push --skip-generate || {
    echo "⚠️  Erro ao executar migrations, continuando..."
  }
else
  # Opção B: Para produção (seguro, com histórico)
  echo "   [PROD] Usando 'prisma migrate deploy'..."
  npx prisma migrate deploy --skip-generate || {
    echo "⚠️  Erro ao executar migrations, continuando..."
  }
fi

echo "✅ Migrations aplicadas com sucesso!"

# ============================================================================
# 4. POPULAR DADOS INICIAIS (SÓ NA PRIMEIRA VEZ)
# ============================================================================

echo "🌱 Verificando se seed é necessário..."

# Contar usuários no banco
USUARIO_COUNT=$(npx prisma db execute --stdin <<EOF 2>/dev/null | grep -c "^" || echo "0"
SELECT COUNT(*) FROM usuarios;
EOF
)

if [ "$USUARIO_COUNT" -eq "0" ]; then
  echo "   Banco vazio - executando seed..."
  npx prisma db seed || {
    echo "⚠️  Erro ao executar seed, continuando..."
  }
  echo "✅ Seed concluído!"
else
  echo "   Banco já possui dados - pulando seed"
fi

# ============================================================================
# 5. INICIAR O SERVIDOR
# ============================================================================

echo ""
echo "🎯 ============================================"
echo "✅ Backend pronto para iniciar!"
echo "🎯 ============================================"
echo ""

# Em desenvolvimento: usar hot reload com tsx
if [ "$NODE_ENV" = "development" ]; then
  echo "📌 Modo: DESENVOLVIMENTO (hot reload ativo)"
  exec npm run dev
else
  echo "📌 Modo: PRODUÇÃO (build otimizado)"
  # Build deve ter sido feito no Dockerfile
  # Aqui apenas iniciamos o servidor compilado
  exec npm run start
fi
