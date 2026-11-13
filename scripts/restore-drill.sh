#!/usr/bin/env bash
#
# Restore drill: load a backup into a scratch database and verify the core
# tables. Never point RESTORE_DATABASE_URL at the live database.
#
#   RESTORE_DATABASE_URL=postgresql://…/resin_restore \
#     DATABASE_URL=postgresql://…/resin npm run db:restore-drill
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL must point at a scratch database}"

if [[ "$RESTORE_DATABASE_URL" == "$DATABASE_URL" ]]; then
  echo "Refusing to restore over the live database." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
DUMP="${1:-}"
if [[ -z "$DUMP" ]]; then
  DUMP="$(find "$BACKUP_DIR" -maxdepth 1 -name 'resin-by-ash-*.dump' -type f -print | sort | tail -n 1)"
fi
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "No backup found in ${BACKUP_DIR}. Pass a dump path as the first argument." >&2
  exit 1
fi

echo "Restoring ${DUMP} into the scratch database"
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$RESTORE_DATABASE_URL" "$DUMP"

echo "Checking restored data"
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT 'categories' AS table, count(*) FROM "Category"
UNION ALL SELECT 'products', count(*) FROM "Product"
UNION ALL SELECT 'orders', count(*) FROM "Order"
UNION ALL SELECT 'settings', count(*) FROM "Settings"
ORDER BY 1;
SELECT nextval('order_number_seq') AS next_order_number;
SQL

echo "Restore drill complete. Boot the app against this scratch database before trusting the backup."
