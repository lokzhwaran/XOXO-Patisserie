# syntax=docker/dockerfile:1
FROM node:20-alpine

# Prisma's query engine needs openssl on Alpine; libc6-compat covers other native deps.
RUN apk add --no-cache openssl libc6-compat

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

ENV NODE_ENV=production

EXPOSE 3000

CMD ["pnpm", "start"]
