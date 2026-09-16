#!/usr/bin/env bash
set -euo pipefail
SRC="${STORAGE_ROOT:-/var/dashboard/storage}"
DEST="${BACKUP_DIR:-/var/backups/dashboard}/storage"
mkdir -p "${DEST}"
rsync -a --delete "${SRC}/" "${DEST}/"
echo "Synced ${SRC} -> ${DEST}"
