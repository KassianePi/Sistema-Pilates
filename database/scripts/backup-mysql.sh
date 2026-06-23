#!/bin/sh
# ============================================================================
# backup-mysql.sh — Backup do MySQL do Studio de Pilates
#
# Usa variáveis de ambiente — NUNCA credenciais fixas no script.
#
# Variáveis aceitas:
#   MYSQL_HOST       (default: localhost)
#   MYSQL_PORT       (default: 3306)
#   MYSQL_USER       (obrigatório)
#   MYSQL_PASSWORD   (obrigatório)
#   MYSQL_DATABASE   (obrigatório)
#   BACKUP_DIR       (default: ./database/backups)
#   RETENTION_DAYS   (default: 7)
#
# Uso:
#   MYSQL_USER=... MYSQL_PASSWORD=... MYSQL_DATABASE=... ./backup-mysql.sh
#
# Saída: database/backups/studio-pilates_YYYY-MM-DD_HH-MM-SS.sql.gz
# Exit code: 0 = sucesso, 1 = falha
# ============================================================================

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
MYSQL_HOST="${MYSQL_HOST:-localhost}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="studio-pilates_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

log "🗄️  Iniciando backup do MySQL — Studio de Pilates"

# ----------------------------------------------------------------------------
# Validação de variáveis obrigatórias
# ----------------------------------------------------------------------------
if [ -z "${MYSQL_USER:-}" ] || [ -z "${MYSQL_PASSWORD:-}" ] || [ -z "${MYSQL_DATABASE:-}" ]; then
  log "❌ ERRO: defina MYSQL_USER, MYSQL_PASSWORD e MYSQL_DATABASE como variáveis de ambiente."
  exit 1
fi

mkdir -p "$BACKUP_DIR"
if [ ! -d "$BACKUP_DIR" ]; then
  log "❌ ERRO: não foi possível criar/acessar o diretório de destino: $BACKUP_DIR"
  exit 1
fi

# ----------------------------------------------------------------------------
# Executa mysqldump + gzip
# ----------------------------------------------------------------------------
log "📦 Gerando dump de '${MYSQL_DATABASE}' (${MYSQL_HOST}:${MYSQL_PORT}) → ${FILENAME}"

MYSQL_PWD="$MYSQL_PASSWORD" mysqldump \
  --host="$MYSQL_HOST" \
  --port="$MYSQL_PORT" \
  --user="$MYSQL_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "$MYSQL_DATABASE" | gzip > "$FILEPATH"

DUMP_STATUS=$?

if [ "$DUMP_STATUS" -ne 0 ] || [ ! -s "$FILEPATH" ]; then
  log "❌ FALHA no backup (mysqldump exit=$DUMP_STATUS). Removendo arquivo incompleto."
  rm -f "$FILEPATH"
  exit 1
fi

SIZE=$(du -h "$FILEPATH" | cut -f1)
log "✅ Backup criado com sucesso: $FILEPATH ($SIZE)"

# ----------------------------------------------------------------------------
# Retenção — remove backups mais antigos que RETENTION_DAYS
# ----------------------------------------------------------------------------
log "🧹 Aplicando retenção de ${RETENTION_DAYS} dias em ${BACKUP_DIR}"
REMOVED=$(find "$BACKUP_DIR" -name "studio-pilates_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
log "🧹 ${REMOVED} backup(s) antigo(s) removido(s)."

log "🎉 Backup concluído: $FILENAME"
exit 0
