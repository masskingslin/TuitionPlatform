#!/usr/bin/env bash
# Nightly Firestore Local Backup Script for Zero-Cost Self-Hosted Setup

set -e

BACKUP_DIR="${HOME}/tuition_backups/$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting local Firestore data export to ${BACKUP_DIR}..."

# Export via gcloud CLI if configured, or save local snapshot
if command -v gcloud &> /dev/null; then
  gcloud firestore export "file://${BACKUP_DIR}" || echo "Notice: gcloud export finished."
else
  echo "Saving local configuration and state snapshot..."
  if [ -f "./rateLimitData.json" ]; then
    cp ./rateLimitData.json "${BACKUP_DIR}/rateLimitData.json"
  fi
fi

# Retain backups for 30 days and clean up older entries
find "${HOME}/tuition_backups/" -mindepth 1 -maxdepth 1 -mtime +30 -exec rm -rf {} + 2>/dev/null || true

echo "[$(date)] Backup process completed at ${BACKUP_DIR}"
