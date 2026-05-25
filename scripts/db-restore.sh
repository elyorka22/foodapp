#!/usr/bin/env bash
# Restore FoodMarket database from .sql.gz backup
set -euo pipefail

BACKUP_FILE="${1:?Usage: ./db-restore.sh path/to/backup.sql.gz}"

: "${POSTGRES_USER:?POSTGRES_USER required}"
: "${POSTGRES_DB:?POSTGRES_DB required}"

echo "WARNING: This will overwrite database ${POSTGRES_DB}"
read -r -p "Continue? [y/N] " confirm
[[ "$confirm" == "y" || "$confirm" == "Y" ]] || exit 1

if docker ps --format '{{.Names}}' | grep -q foodmarket-postgres; then
  gunzip -c "$BACKUP_FILE" | docker exec -i foodmarket-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
else
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
fi

echo "Restore complete from $BACKUP_FILE"
