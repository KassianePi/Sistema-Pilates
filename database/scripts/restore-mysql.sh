#!/bin/sh
# ============================================================================
# restore-mysql.sh — Restaura um backup do MySQL do Studio de Pilates
#
# Uso:
#   MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... \
#     ./restore-mysql.sh database/backups/studio-pilates_2026-06-23_10-00-00.sql.gz
#
# Variáveis aceitas: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
# Aceita arquivos .sql ou .sql.gz
# Exit code: 0 = sucesso, 1 = falha
# ============================================================================

set -u

MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
BACKUP_FILE="${1:-}"

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

# ----------------------------------------------------------------------------
# Validações
# ----------------------------------------------------------------------------
if [ -z "$BACKUP_FILE" ]; then
  log "❌ Uso: $0 <caminho-do-backup.sql|.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  log "❌ ERRO: arquivo de backup não encontrado: $BACKUP_FILE"
  exit 1
fi

if [ -z "${MYSQL_USER:-}" ] || [ -z "${MYSQL_PASSWORD:-}" ] || [ -z "${MYSQL_DATABASE:-}" ]; then
  log "❌ ERRO: defina MYSQL_USER, MYSQL_PASSWORD e MYSQL_DATABASE como variáveis de ambiente."
  exit 1
fi

# ----------------------------------------------------------------------------
# Confirmação — operação destrutiva (sobrescreve dados existentes)
# ----------------------------------------------------------------------------
echo ""
echo "⚠️  ATENÇÃO: isso vai SOBRESCREVER os dados do banco '${MYSQL_DATABASE}' em ${MYSQL_HOST}:${MYSQL_PORT}"
echo "   Arquivo de restauração: $BACKUP_FILE"
echo ""
printf "Digite 'CONFIRMO' para continuar: "
read -r CONFIRMACAO

if [ "$CONFIRMACAO" != "CONFIRMO" ]; then
  log "🚫 Restauração cancelada pelo usuário."
  exit 1
fi

# ----------------------------------------------------------------------------
# Restauração
# ----------------------------------------------------------------------------
log "♻️  Iniciando restauração de '${MYSQL_DATABASE}' a partir de $BACKUP_FILE"

case "$BACKUP_FILE" in
  *.gz)
    gunzip -c "$BACKUP_FILE" | MYSQL_PWD="$MYSQL_PASSWORD" mysql \
      --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" "$MYSQL_DATABASE"
    ;;
  *.sql)
    MYSQL_PWD="$MYSQL_PASSWORD" mysql \
      --host="$MYSQL_HOST" --port="$MYSQL_PORT" --user="$MYSQL_USER" "$MYSQL_DATABASE" < "$BACKUP_FILE"
    ;;
  *)
    log "❌ ERRO: formato de arquivo não suportado (use .sql ou .sql.gz): $BACKUP_FILE"
    exit 1
    ;;
esac

RESTORE_STATUS=$?

if [ "$RESTORE_STATUS" -ne 0 ]; then
  log "❌ FALHA na restauração (exit=$RESTORE_STATUS)."
  exit 1
fi

log "✅ Restauração concluída com sucesso a partir de: $BACKUP_FILE"
log "ℹ️  Recomendado: rode verify-backup.sh ou valide manualmente os dados antes de liberar o sistema."
exit 0
