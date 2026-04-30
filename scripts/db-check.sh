#!/usr/bin/env bash
# Local equivalent of the CI drift-check workflow.
# Compares prisma/migrations/ to schema.prisma against a shadow DB.
# Exits 0 if in sync, 2 if drift detected, 1 on error.

set -euo pipefail

CONTAINER="construction-postgres"
SHADOW_DB="construction_shadow"
SHADOW_URL="postgresql://construction:construction@localhost:5432/${SHADOW_DB}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "Error: Docker container '${CONTAINER}' is not running."
  echo "Start it with: docker start ${CONTAINER}"
  exit 1
fi

# Ensure shadow DB exists (idempotent).
docker exec "${CONTAINER}" psql -U construction -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname='${SHADOW_DB}'" | grep -q 1 \
  || docker exec "${CONTAINER}" createdb -U construction "${SHADOW_DB}"

# Ensure required extensions exist on the shadow DB (idempotent).
docker exec "${CONTAINER}" psql -U construction -d "${SHADOW_DB}" -c \
  "CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm;" >/dev/null

exec npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "${SHADOW_URL}" \
  --exit-code
