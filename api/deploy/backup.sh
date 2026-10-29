#!/usr/bin/env bash
# ==========================================================================
#  Backup diário do PostgreSQL rodando no Docker Compose.
#  Gera um dump comprimido, mantém os últimos N dias e (opcional) envia
#  para um destino externo — ESSENCIAL para não repetir a perda da Azure.
#
#  Uso:  ./deploy/backup.sh
#  Agende no cron (ex.: todo dia 03:00):
#     0 3 * * * /caminho/para/projeto/deploy/backup.sh >> /var/log/uc-backup.log 2>&1
# ==========================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Carrega DB_NAME / DB_USER do .env
set -a; source ./.env; set +a

BACKUP_DIR="$PROJECT_DIR/deploy/backups"
RETENTION_DAYS=14
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUTFILE="$BACKUP_DIR/${DB_NAME}_${STAMP}.sql.gz"

echo "[$(date)] Iniciando backup de $DB_NAME ..."
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUTFILE"
echo "[$(date)] Backup salvo em $OUTFILE ($(du -h "$OUTFILE" | cut -f1))"

# Remove backups mais antigos que RETENTION_DAYS
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# ---- (OPCIONAL, MAS RECOMENDADO) enviar para fora da VPS ----
# Descomente e configure UM destino externo. Sem isto, o backup ainda
# vive na mesma máquina — se a VPS morrer, morre com ela.
#
# rclone copy "$OUTFILE" remoto:urbano-connect-backups/   # Google Drive / S3 / etc via rclone
# ou
# scp "$OUTFILE" usuario@outra-maquina:/backups/

echo "[$(date)] Concluído."
