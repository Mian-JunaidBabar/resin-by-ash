#!/usr/bin/env bash
set -euo pipefail

# Removes every order, customer, custom request and contact message so the live
# store starts at order RBA-1047. Run only after exporting a fresh backup.
if [ "${CONFIRM_CLEAR_TEST_DATA:-}" != "YES" ]; then
  echo "Refusing to delete data. Re-run with CONFIRM_CLEAR_TEST_DATA=YES after taking a backup." >&2
  exit 1
fi
: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
DELETE FROM "OrderEvent";
DELETE FROM "OrderLine";
DELETE FROM "CustomRequest";
DELETE FROM "Order";
DELETE FROM "ContactMessage";
DELETE FROM "Customer";
SELECT setval('order_number_seq', 1047, false);
COMMIT;
SQL

echo "Orders, customers, custom requests and messages cleared. Next order number: RBA-1047."
