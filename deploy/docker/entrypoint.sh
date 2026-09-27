#!/bin/sh
set -e
if [ -f prisma/schema.prisma ]; then
  npx prisma migrate deploy
  if [ "${RUN_PRISMA_SEED:-false}" = "true" ] && [ -f prisma/seed.ts ]; then
    npx tsx prisma/seed.ts
  fi
fi
exec "$@"
