# XOXO Patisserie — Ordering Platform

Production-grade ordering platform for a home bakery (brownies & cookies) in Chennai, built per the
master build prompt in [`bakery-website-master-prompt.md`](./bakery-website-master-prompt.md).

Customer site (landing → menu → cart → checkout → Razorpay payment → tracking) and an admin console
(orders, menu & capacity, financials, delivery, settings/theming) share one Next.js app and one
Postgres database via Prisma.

See [`DECISIONS.md`](./DECISIONS.md) for choices made where the spec was silent, and what could/couldn't
be verified in the build environment.

## Tech stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS v4 · Prisma + PostgreSQL · Supabase Auth
· Razorpay · WhatsApp Cloud API · Resend · Zustand · TanStack Query/Table · react-hook-form + zod ·
Framer Motion · Recharts.

## 1. Prerequisites

- Node.js 22+ and pnpm (`corepack enable` or `npm i -g pnpm`)
- Docker (for local Postgres) **or** a Supabase project
- A Razorpay account (test mode is free) for payments
- Optional for full functionality: a Meta WhatsApp Cloud API app, a Resend account, a Porter
  business account

## 2. Setup

```bash
pnpm install
cp .env.example .env
```

Edit `.env` and fill in `DATABASE_URL` at minimum (see below). Fill in the rest as you wire up each
integration — everything degrades gracefully when a given key is missing (see DECISIONS.md).

### Database — local dev (fastest path)

```bash
docker compose up -d      # starts Postgres 16 on localhost:5432
pnpm db:push               # applies prisma/schema.prisma
pnpm db:seed                # seeds categories, 9 products, 30 days of capacity,
                             # 12 customers, 25 orders, 15 expenses, one admin user
```

### Database — Supabase (production path)

1. Create a project at supabase.com.
2. Copy **Project Settings → Database → Connection string (URI, "Transaction" pooler is fine for
   Prisma with `?pgbouncer=true` or use the direct connection for migrations)** into `DATABASE_URL`.
3. Copy **Project Settings → API → Project URL / anon public key** into `NEXT_PUBLIC_SUPABASE_URL`
   / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run `pnpm db:push && pnpm db:seed` against that database.
5. In **Authentication → Users**, create a user with email `admin@bakery.local` and your own
   password (the seed script creates a reference `AdminUser` row, but Supabase Auth is the actual
   login system — you must set the password there once).
6. Create a public Storage bucket (e.g. `product-images`) if you'll upload photos via the admin.

### Run the app

```bash
pnpm dev
```

Visit `http://localhost:3000` for the customer site and `http://localhost:3000/admin` for the
admin console.

## 3. Razorpay setup (test mode)

1. Sign up at dashboard.razorpay.com — test mode is enabled by default, no business verification
   needed to get test keys.
2. **Settings → API Keys** → generate a test key pair → put in `RAZORPAY_KEY_ID` /
   `RAZORPAY_KEY_SECRET`.
3. **Settings → Webhooks** → add `https://<your-domain>/api/webhooks/razorpay`, subscribe to
   `payment.captured`, `payment.failed`, `refund.processed`, copy the webhook secret into
   `RAZORPAY_WEBHOOK_SECRET`. (For local dev, tunnel with `ngrok http 3000` and use that URL.)
4. Use Razorpay's test UPI/card details to complete a test purchase end-to-end.
5. To go live: verify your business with Razorpay, switch to live keys, and flip
   `SiteSettings.razorpayTestMode` off in Settings.

## 4. WhatsApp Cloud API setup

1. Create a Meta developer app → add the WhatsApp product → get a temporary access token and test
   phone number ID for development (Meta issues permanent tokens after business verification).
2. Put the token/phone-number-id in `WHATSAPP_CLOUD_API_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID`.
3. Without these set, notifications simply log to the admin Alerts panel instead of sending — the
   rest of the app keeps working.

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import into Vercel, set all env vars from `.env.example` in the Vercel project settings.
3. Set the Razorpay/WhatsApp webhook URLs to your production domain.
4. Vercel's build runs `pnpm build` (webpack production build) — no special config needed beyond
   env vars, since Prisma's `postinstall` regenerates the client automatically.

## 5b. Deploy to Render

This repo includes a [`render.yaml`](./render.yaml) blueprint that provisions a web service and a
managed Postgres database together. The web service builds and runs from the repo's
[`Dockerfile`](./Dockerfile) (Render's Docker runtime).

1. Push this repo to GitHub.
2. In the Render dashboard: **New → Blueprint**, pick this repo. Render reads `render.yaml` and
   proposes the `xoxobakery` web service + `xoxobakery-db` Postgres database.
3. Before the first deploy, fill in the env vars marked `sync: false` in the Render dashboard
   (at minimum `NEXT_PUBLIC_APP_URL` — set it to the `https://xoxobakery.onrender.com`-style URL
   Render assigns, or your custom domain). `DATABASE_URL` and `SESSION_SECRET` are generated
   automatically by the blueprint — you don't need to set those.
4. Deploy. Render builds the image from the `Dockerfile` (`pnpm install`, `prisma generate`,
   `next build`), then runs `pnpm prisma db push` as the pre-deploy step to create the schema on
   the fresh database before the new instance takes traffic. The container starts via
   `pnpm start` (`next start -H 0.0.0.0 -p $PORT`), required for Render's port detection.
5. **Seed the database once** (there is no admin login until this runs): open the web service's
   **Shell** tab in Render and run:
   ```bash
   pnpm db:seed
   ```
   This prints the seeded admin credentials (`admin@bakery.local` / `Admin@12345`, etc.) —
   change that password immediately by inviting a new OWNER from **Admin → Users** and removing
   the default account, or update it directly via `pnpm db:studio` locally against the same
   `DATABASE_URL`.
6. Set the Razorpay/WhatsApp webhook URLs to your Render URL once you have real credentials.
   The app runs in `APP_MODE=sandbox` by default (zero external accounts needed) — switch to
   `APP_MODE=live` only after setting the Razorpay/WhatsApp/Resend env vars, per §6 below.
7. Render's free/starter Postgres plans expire after a fixed period — check the current plan
   details before relying on this for a real launch, and set up backups if it's not covered.

## 6. Switching test → live

- Razorpay: swap test keys for live keys, keep webhook secret in sync, flip
  `razorpayTestMode` in admin Settings → Payments.
- WhatsApp: exchange the temporary token for a permanent one after Meta business verification.
- Porter: once your business account is approved, set `PORTER_API_KEY` — the delivery flow
  automatically prefers Porter when configured and falls back to Manual otherwise.

## 7. Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build & run |
| `pnpm db:push` | Push `prisma/schema.prisma` to the database |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm test` | Run unit/integration tests (Vitest) |
| `pnpm lint` | ESLint |

## 8. Project structure

```
prisma/schema.prisma        Full data model (§4 of the spec)
prisma/seed.ts               Seed script
src/app/                     Customer routes: /, /menu, /cart, /checkout/*, /track
src/app/admin/                Admin console (Supabase-auth gated)
src/app/api/                  Route handlers: orders, payments, webhooks, tracking, admin actions
src/components/               Customer + admin UI components
src/components/ui/            Hand-rolled shadcn-equivalent primitives (Button, Input, Card, Badge)
src/lib/                      Business logic: capacity, money, theme, notifications, delivery adapters
src/server/actions/           Server actions (order creation, payment confirmation)
src/proxy.ts                  Protects /admin at the server layer
docker-compose.yml            Local Postgres for development
Dockerfile                    Production image used by Render's Docker runtime (§5b)
```
