#!/bin/sh
# ============================================================================
# deploy.sh — Sobe a stack de produção do Studio de Pilates via Docker Compose.
#
# Uso:
#   ./scripts/deploy.sh [caminho-do-env-file]
#
# Padrão do env-file: .env.production (na raiz do projeto)
# ============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-.env.production}"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Deploy do Studio de Pilates — produção"
echo "   Compose: $COMPOSE_FILE"
echo "   Env file: $ENV_FILE"
echo ""

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Arquivo de variáveis '$ENV_FILE' não encontrado."
  echo "   Copie '.env.production.example' para '$ENV_FILE' e preencha os valores."
  exit 1
fi

# Variáveis obrigatórias — falha rápido se algo essencial não foi preenchido
REQUIRED_VARS="DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET MYSQL_ROOT_PASSWORD MYSQL_DATABASE MYSQL_USER MYSQL_PASSWORD"
MISSING=""
for VAR in $REQUIRED_VARS; do
  VALUE=$(grep -E "^${VAR}=" "$ENV_FILE" | head -n1 | cut -d'=' -f2-)
  if [ -z "$VALUE" ]; then
    MISSING="$MISSING $VAR"
  fi
done

if [ -n "$MISSING" ]; then
  echo "❌ Variáveis obrigatórias ausentes ou vazias em '$ENV_FILE':$MISSING"
  exit 1
fi

echo "✅ Variáveis obrigatórias presentes."
echo ""
echo "🏗️  Construindo e subindo containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo ""
echo "⏳ Aguardando healthchecks ficarem saudáveis..."
MAX_WAIT=120
WAITED=0
while [ "$WAITED" -lt "$MAX_WAIT" ]; do
  UNHEALTHY=$(docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps --format '{{.Service}} {{.Health}}' 2>/dev/null | grep -v "healthy" | grep -v "^$" | grep -v " $" || true)
  if [ -z "$UNHEALTHY" ]; then
    echo "✅ Todos os serviços com healthcheck estão saudáveis."
    break
  fi
  sleep 5
  WAITED=$((WAITED + 5))
done

echo ""
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "🔎 Rodando healthcheck.sh..."
"$ROOT_DIR/scripts/healthcheck.sh" || {
  echo "❌ Healthcheck falhou após o deploy. Verifique os logs com:"
  echo "   docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
  exit 1
}

echo ""
echo "🎉 Deploy concluído com sucesso."
