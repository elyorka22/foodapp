#!/usr/bin/env bash
# PostgreSQL backup for FoodMarket — run on backend droplet
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="${BACKUP_DIR}/foodmarket_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

: "${POSTGRES_USER:?POSTGRES_USER required}"
: "${POSTGRES_DB:?POSTGRES_DB required}"

if docker ps --format '{{.Names}}' | grep -q foodmarket-postgres; then
  docker exec foodmarket-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"
else
  pg_dump "$DATABASE_URL" 2>/dev/null | gzip > "$FILE" || \
    PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h localhost -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILE"
fi

echo "Backup saved: $FILE"
# Keep last 14 days
find "$BACKUP_DIR" -name 'foodmarket_*.sql.gz' -mtime +14 -delete 2>/dev/null || true
