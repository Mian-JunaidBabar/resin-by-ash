#!/usr/bin/env bash
#
# Daily database backup. DATABASE_URL must point at the production database and
# the installed pg_dump must be the same major version as the server (or newer).
#
#   DATABASE_URL=postgresql://… npm run db:backup
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="${BACKUP_DIR}/resin-by-ash-${STAMP}.dump"

mkdir -p "$BACKUP_DIR"
umask 077

echo "Backing up to ${FILE}"
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$FILE" \
  "$DATABASE_URL"

# Keep two weeks by default: enough to recover from a problem noticed after a weekend.
find "$BACKUP_DIR" -maxdepth 1 -name 'resin-by-ash-*.dump' -type f -mtime "+${RETENTION_DAYS}" -print -delete

echo "Backup complete: ${FILE} ($(du -h "$FILE" | cut -f1))"
