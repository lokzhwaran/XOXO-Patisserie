# Decisions Log

Choices made where the master prompt was silent, or where real-world constraints required a
pragmatic substitute. Read this alongside the README before deploying.

## Framework version
The spec asked for Next.js 15. `create-next-app@latest` at build time installed **Next.js 16.3.4**
(App Router, RSC, Turbopack) — a superset of everything Next 15 offers for this app. All code uses
only stable App Router APIs, so it is compatible with either major version.

## Database & local dev
No live Supabase project or credentials were available while building this. The Prisma schema
targets plain PostgreSQL (`provider = "postgresql"`), which **is** what Supabase uses under the
hood, so the same schema works against a Supabase project unmodified. For local development without
a Supabase account, a `docker-compose.yml` spins up Postgres 16 so `pnpm db:push && pnpm db:seed &&
pnpm dev` works immediately. Swap `DATABASE_URL` to your Supabase connection string to deploy.

## Admin auth
Supabase Auth (email + password) is wired via `@supabase/ssr`, with route protection enforced in
`src/proxy.ts` (server-side, not just hidden UI). If `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` are unset, admin routes redirect to `/admin/login` with a
"not configured" notice rather than silently allowing access — no live credentials were available
to create the actual `admin@bakery.local` user, so **you must create that user's password once in
your Supabase project's Auth dashboard** (Authentication → Users → Invite/Create user with that
email) after connecting a real project. The `AdminUser` Prisma row is seeded for reference/role data
only; Supabase Auth is the source of truth for login.

## Payments (Razorpay)
Full Standard Checkout + UPI-intent + webhook flow is implemented (`src/lib/razorpay.ts`,
`/api/payments/*`, `/api/webhooks/razorpay`). Without live Razorpay test keys in this environment,
the flow could not be exercised end-to-end against Razorpay's servers; it self-disables with a
clear 503 error until `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` are set, and never silently
fabricates a "paid" state. Webhook signature verification and the idempotent `WebhookEvent` table
are both implemented per spec.

## WhatsApp / Email notifications
`src/lib/notifications/whatsapp.ts` and `.../email.ts` call the real WhatsApp Cloud API / Resend
APIs. Both self-disable gracefully (logging a `NOTIFICATION_*` AdminAlert instead of throwing) when
credentials are absent, so order creation, status changes, etc. never fail because a notification
provider isn't configured yet.

## Delivery (Porter / Manual / Self)
Implemented exactly as specified: a `DeliveryProvider` interface, a `PorterProvider` that
self-disables when `PORTER_API_KEY` is absent (Porter only issues keys to business accounts on
request), and a fully-functional `ManualProvider` as the default day-one path. Request/response
shapes in `porter.ts` are best-effort against Porter's public docs and are flagged for correction
once real credentials are issued.

## UI component library
The spec asks for shadcn/ui. Rather than running the shadcn CLI (which scaffolds by copying files
from a network-fetched registry), equivalent primitives were hand-written in `src/components/ui/`
(Button, Input, Card, Badge) using the same underlying stack shadcn uses — Radix UI primitives,
`class-variance-authority`, `tailwind-merge` — so behaviour and styling approach are identical and
you can freely add more shadcn components later with `npx shadcn add <component>`.

## Product/hero images
Seed data references image paths under `/public/images/...` that are **not** included (no binary
image assets were generated). Replace these with real product photography before going live;
`next/image` will otherwise 404 on those specific paths without breaking the rest of the page.

## PDF invoices / receipts
`@react-pdf/renderer` is installed and the `/api/orders/[orderNumber]/receipt` route is wired into
the confirmation page, but the actual PDF template (GST-compliant layout with CGST/SGST split,
amount-in-words via `src/lib/money.ts#paiseToWords`) should be finished before go-live — the money
math and helpers it depends on are complete and unit-testable.

## What was verified in this environment
- `npx tsc --noEmit` — passes with zero errors.
- `npx eslint .` — passes with zero errors (two harmless warnings: an unused eslint-disable
  comment, and a React Compiler note about `react-hook-form`'s `watch()`).
- `npx prisma generate` — succeeds against `prisma/schema.prisma`.
- `next build` could not be completed in this sandbox: Turbopack's PostCSS transform spawns a
  worker process that binds to a local port, which this sandbox's network policy blocks outright
  (unrelated to application code). Run `pnpm build` in a normal terminal to verify the production
  build — this is expected to succeed there.
- No live Postgres/Supabase/Razorpay/WhatsApp/Porter credentials were available in this
  environment, so `pnpm db:push`, `pnpm db:seed`, and the full checkout→payment→webhook loop could
  not be exercised end-to-end here. Every integration point is coded against the real provider API
  and fails closed (clear error, no fake success) when unconfigured — see README for setup steps.
