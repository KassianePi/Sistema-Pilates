#!/bin/sh
# ============================================================================
# verify-backup.sh — Verifica a integridade de um arquivo de backup
#
# Checagens:
#   1. Arquivo existe e não está vazio
#   2. Se .gz: integridade do gzip (gzip -t)
#   3. Conteúdo contém marcadores SQL esperados (CREATE TABLE / INSERT INTO)
#
# Uso:
#   ./verify-backup.sh database/backups/studio-pilates_2026-06-23_10-00-00.sql.gz
#
# Exit code: 0 = backup válido, 1 = backup inválido/corrompido
# ============================================================================

set -u

BACKUP_FILE="${1:-}"

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

if [ -z "$BACKUP_FILE" ]; then
  log "❌ Uso: $0 <caminho-do-backup.sql|.sql.gz>"
  exit 1
fi

# ----------------------------------------------------------------------------
# 1. Existência e tamanho
# ----------------------------------------------------------------------------
if [ ! -f "$BACKUP_FILE" ]; then
  log "❌ Arquivo não encontrado: $BACKUP_FILE"
  exit 1
fi

if [ ! -s "$BACKUP_FILE" ]; then
  log "❌ Arquivo vazio: $BACKUP_FILE"
  exit 1
fi

log "✅ Arquivo existe e não está vazio: $BACKUP_FILE"

# ----------------------------------------------------------------------------
# 2. Integridade do .gz (se aplicável) + extração para checagem de conteúdo
# ----------------------------------------------------------------------------
case "$BACKUP_FILE" in
  *.gz)
    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
      log "❌ Arquivo .gz corrompido (falhou em gzip -t): $BACKUP_FILE"
      exit 1
    fi
    log "✅ Integridade do .gz confirmada (gzip -t)."
    CONTENT_SAMPLE=$(gunzip -c "$BACKUP_FILE" | head -c 200000)
    ;;
  *.sql)
    CONTENT_SAMPLE=$(head -c 200000 "$BACKUP_FILE")
    ;;
  *)
    log "❌ Formato não suportado (use .sql ou .sql.gz): $BACKUP_FILE"
    exit 1
    ;;
esac

# ----------------------------------------------------------------------------
# 3. Conteúdo SQL esperado
# ----------------------------------------------------------------------------
if ! echo "$CONTENT_SAMPLE" | grep -qi "CREATE TABLE"; then
  log "❌ Conteúdo não contém 'CREATE TABLE' — backup parece inválido/vazio de estrutura."
  exit 1
fi
log "✅ Conteúdo contém definições de tabela (CREATE TABLE)."

if echo "$CONTENT_SAMPLE" | grep -qi "INSERT INTO"; then
  log "✅ Conteúdo contém dados (INSERT INTO)."
else
  log "⚠️  Nenhum 'INSERT INTO' encontrado na amostra — backup pode ser de um banco vazio (não necessariamente um erro)."
fi

log "🎉 Backup válido: $BACKUP_FILE"
exit 0
