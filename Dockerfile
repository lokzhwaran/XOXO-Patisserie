# syntax=docker/dockerfile:1
FROM node:22-alpine

# Prisma's query engine needs openssl on Alpine; libc6-compat, postgresql and su-exec for self-contained runtime.
RUN apk add --no-cache openssl libc6-compat postgresql postgresql-contrib su-exec bash

WORKDIR /app

# Pin pnpm via corepack to match package.json's packageManager field.
RUN corepack enable

# Install dependencies first (better layer caching on source-only changes).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Bring in the rest of the source and build.
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Configure directories and permissions for internal PostgreSQL and entrypoint
RUN mkdir -p /var/lib/postgresql/data /run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /run/postgresql && \
    chmod 0700 /var/lib/postgresql/data && \
    chmod 0775 /run/postgresql && \
    chmod +x /app/scripts/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]

