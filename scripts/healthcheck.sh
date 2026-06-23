#!/bin/sh
# ============================================================================
# healthcheck.sh — Verifica se a stack de produção está respondendo.
#
# Pode ser usado manualmente, pelo deploy.sh, ou por um agendador externo
# (cron, monitoramento) para alertar em caso de indisponibilidade.
#
# Uso:
#   ./scripts/healthcheck.sh [base-url]
#
# Padrão de base-url: http://localhost (Nginx local)
# Exit code: 0 = saudável, 1 = falha
# ============================================================================

set -u

BASE_URL="${1:-http://localhost}"
FAILED=0

check() {
  DESC="$1"
  URL="$2"
  EXPECTED_CODE="${3:-200}"

  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$URL" || echo "000")
  if [ "$CODE" = "$EXPECTED_CODE" ]; then
    echo "✅ $DESC ($URL) → HTTP $CODE"
  else
    echo "❌ $DESC ($URL) → HTTP $CODE (esperado $EXPECTED_CODE)"
    FAILED=1
  fi
}

echo "🔎 Healthcheck — Studio de Pilates"
echo "   Base URL: $BASE_URL"
echo ""

check "Backend (API health)" "$BASE_URL/api/v1/health" 200
check "Frontend (home)" "$BASE_URL/" 200

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✅ Todos os checks passaram."
  exit 0
else
  echo "❌ Um ou mais checks falharam."
  exit 1
fi
