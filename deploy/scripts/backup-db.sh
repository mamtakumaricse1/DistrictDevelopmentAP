#!/usr/bin/env bash
set -euo pipefail
# Template — set DB_* and BACKUP_DIR via environment on the NIC host.
# Dumps both service databases. Override names with IDENTITY_DB_NAME / ORGANIZATION_DB_NAME.
DATE=$(date +%F)
DEST="${BACKUP_DIR:-/var/backups/dashboard}"
HOST="${DB_HOST:-127.0.0.1}"
USER="${DB_USER:?}"
mkdir -p "${DEST}"

dump_one() {
  local name="$1"
  local file="${DEST}/${name}-${DATE}.sql.gz"
  pg_dump -h "${HOST}" -U "${USER}" -d "${name}" | gzip > "${file}"
  echo "Wrote ${file}"
}

dump_one "${IDENTITY_DB_NAME:-district_identity}"
dump_one "${ORGANIZATION_DB_NAME:-district_organization}"
dump_one "${WORKS_DB_NAME:-district_works}"
dump_one "${GOVERNANCE_DB_NAME:-district_governance}"
dump_one "${NOTIFY_DB_NAME:-district_notify}"
find "${DEST}" -name 'district_*-*.sql.gz' -mtime +"${RETENTION_DAYS:-30}" -delete
