# Database backups

The storefront's orders, customers, requests and catalogue all live in Postgres.
A backup runs every day at **02:15 UTC** (07:15 Pakistan time) from GitHub Actions,
writes a custom-format dump, and keeps the artifact for **14 days**.

## One-time setup

1. Add a repository secret `PRODUCTION_DATABASE_URL` with the production connection
   string (the same value as `DATABASE_URL` on the server). Use a role that can read
   every table; a read-only role is enough.
2. Run **Actions → Database backup → Run workflow** once and download the artifact.
3. Restore that dump into a scratch database (below) before relying on the schedule.

The workflow uses the `postgres:17` image, so the client always matches the server
major version.

## Manual backup

On a machine with PostgreSQL 17 client tools:

```bash
DATABASE_URL="postgresql://…" npm run db:backup
```

Files go to `backups/resin-by-ash-<UTC timestamp>.dump`. The folder is gitignored;
nothing is committed. Dumps older than `BACKUP_RETENTION_DAYS` (14 by default) are
removed automatically.

## Restore drill

Never restore over production. Create an empty scratch database first:

```bash
createdb resin_restore   # or: CREATE DATABASE resin_restore;
DATABASE_URL="postgresql://…/resin" \
RESTORE_DATABASE_URL="postgresql://…/resin_restore" \
  npm run db:restore-drill
```

The script drops the `public` schema in the scratch database, restores with
`pg_restore --exit-on-error`, then prints category, product, order and settings
counts plus the next order number. Finally boot the app against the scratch
database and open `/`, `/shop` and `/admin/login`:

```bash
DATABASE_URL="postgresql://…/resin_restore" npm run start -- -p 3200
```

Local Docker note: the development database runs Postgres 17 in the `resin-pg`
container. If the host only has an older client, run the scripts through the
container image:

```bash
docker run --rm --network host -e DATABASE_URL -e BACKUP_DIR=/backups \
  -v "$PWD/backups:/backups" -v "$PWD/scripts:/scripts:ro" postgres:17 \
  bash /scripts/backup-db.sh
```

## Drill log

- **13 Nov 2026** — backup written from local `resin`; restored into `resin_restore`
  with `pg_restore --exit-on-error`; verified 25 categories, 28 products, 0 orders,
  1 settings row and `next_order_number` at 1047. Storefront booted against the
  scratch database and served `/`, `/shop` and `/admin/login`.
