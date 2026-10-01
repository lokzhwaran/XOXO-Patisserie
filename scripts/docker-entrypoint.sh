#!/bin/sh
set -e

if [ "${NODE_ENV:-development}" = "production" ]; then
  : "${SESSION_SECRET:?SESSION_SECRET must be configured in production}"
  : "${APP_MODE:?APP_MODE must be configured in production}"
  : "${ADMIN_EMAIL:?ADMIN_EMAIL must be configured in production}"
  : "${ADMIN_PASSWORD:?ADMIN_PASSWORD must be configured in production}"
else
  export APP_MODE="${APP_MODE:-sandbox}"
  export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@bakery.local}"
  export ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@12345}"
fi

# Check if external DATABASE_URL was provided
if [ -z "$DATABASE_URL" ] || echo "$DATABASE_URL" | grep -qE '@(127\.0\.0\.1|localhost)'; then
  echo "[docker] No external DATABASE_URL provided. Initializing internal PostgreSQL..."
  export PGDATA="/var/lib/postgresql/data"
  mkdir -p "$PGDATA" /run/postgresql
  chown -R postgres:postgres /var/lib/postgresql /run/postgresql
  chmod 0700 "$PGDATA"
  chmod 0775 /run/postgresql

  # Initialize cluster data if missing
  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "[docker] Initializing PostgreSQL database cluster..."
    su-exec postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=trust
    echo "host all all 127.0.0.1/32 trust" >> "$PGDATA/pg_hba.conf"
    echo "listen_addresses = '127.0.0.1'" >> "$PGDATA/postgresql.conf"
  fi

  # Start PostgreSQL daemon
  echo "[docker] Starting internal PostgreSQL daemon..."
  su-exec postgres pg_ctl -D "$PGDATA" -l /var/lib/postgresql/postgres.log start

  # Wait for postgres to be ready
  for i in $(seq 1 30); do
    if su-exec postgres pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
      echo "[docker] Internal PostgreSQL is ready."
      break
    fi
    sleep 1
  done

  # Create xoxobakery database if not existing
  su-exec postgres psql -h 127.0.0.1 -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'xoxobakery'" | grep -q 1 || \
    su-exec postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE xoxobakery;"

  export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/xoxobakery"
else
  echo "[docker] Using provided external DATABASE_URL..."
fi

# Sync database schema with Prisma
echo "[docker] Syncing Prisma database schema..."
pnpm prisma db push --skip-generate --accept-data-loss

# Seed only when explicitly requested. Production deployments should seed once as an operational
# step, not reset credentials and create demo accounts on every container restart.
if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "[docker] Seeding database..."
  pnpm tsx prisma/seed.ts
else
  echo "[docker] Skipping database seed (set SEED_DATABASE=true for an explicit bootstrap)."
fi

# Cleanup trap
cleanup() {
  echo "[docker] Shutting down container..."
  if [ -f "/var/lib/postgresql/data/postmaster.pid" ]; then
    su-exec postgres pg_ctl -D /var/lib/postgresql/data stop -m fast || true
  fi
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "[docker] Starting Next.js server on port ${PORT:-3000}..."
exec pnpm start
