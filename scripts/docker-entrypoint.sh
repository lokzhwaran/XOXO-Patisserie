#!/bin/sh
set -e

# Generate a default SESSION_SECRET if not supplied so auth doesn't fail
if [ -z "$SESSION_SECRET" ]; then
  export SESSION_SECRET="xoxo-patisserie-prod-secret-$(hostname 2>/dev/null || echo render)-$(date +%s)"
fi

# Default APP_MODE to sandbox if not provided
if [ -z "$APP_MODE" ]; then
  export APP_MODE="sandbox"
fi

# Default admin credentials if not set
if [ -z "$ADMIN_EMAIL" ]; then
  export ADMIN_EMAIL="admin@bakery.local"
fi
if [ -z "$ADMIN_PASSWORD" ]; then
  export ADMIN_PASSWORD="Admin@12345"
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
pnpm prisma db push --skip-generate --accept-data-loss || true

# Seed default data and admin credentials
echo "[docker] Seeding database..."
pnpm tsx prisma/seed.ts || true

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
