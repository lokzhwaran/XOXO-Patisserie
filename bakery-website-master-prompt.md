# MASTER BUILD PROMPT — Home Bakery Ordering Platform (Brownies & Cookies)

> Paste everything below this line into your AI coding agent. It is written to be executed without
> asking clarifying questions. Every ambiguous decision has already been made for you.

---

## 0. ROLE AND NON-NEGOTIABLE RULES

You are a senior full-stack engineer. Build a **production-ready, end-to-end web platform** for a
small home-based bakery in Chennai, India that sells brownies and cookies.

Rules you must follow:

1. **Do not ask me questions.** Every decision is specified below. Where something is genuinely
   unspecified, choose the industry-standard option, implement it, and record the choice in
   `DECISIONS.md`.
2. **Build the whole thing.** No placeholders, no `// TODO`, no stub functions, no mock data
   substituted for real logic. Every button must work. Every screen must be reachable.
3. **Ship working code.** The repo must run with `pnpm install && pnpm db:push && pnpm db:seed && pnpm dev`
   and be fully usable in a browser immediately.
4. Write TypeScript in strict mode. No `any` unless unavoidable and commented.
5. Every feature listed in §14 (Acceptance Criteria) must be demonstrably working before you
   declare the build complete. Self-verify against that checklist at the end and report pass/fail
   per line.

---

## 1. PRODUCT OVERVIEW

Two applications sharing one database and one codebase (monorepo, single Next.js app with route
groups):

- **Customer site** (`/`) — public. Landing page → menu → cart → details → payment → confirmation →
  order tracking.
- **Admin console** (`/admin`) — password-protected. Orders, dashboard, financials, menu &
  inventory, delivery, and site-wide theming/settings.

**Design reference:** `https://www.heidako.com/` — a calm, editorial, image-forward, generous-whitespace
aesthetic with large product photography, restrained type, and smooth scroll. Match that *feel* and
*structural rhythm*, not the exact assets or copy. Key deviation: the hero has **exactly one** primary
CTA — **"Place an Order"**. There is **no "View Menu" button**.

---

## 2. TECH STACK — USE EXACTLY THIS

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components, TypeScript strict) |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Animation | Framer Motion (scroll reveals, page transitions) — subtle, never gimmicky |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth (admin) | Supabase Auth, email + password, single admin role. No public signup. |
| File storage | Supabase Storage (product images) |
| Payments | **Razorpay** (Standard Checkout + UPI intent + Payment Links) |
| Forms | react-hook-form + zod (shared schemas between client and server) |
| State | Zustand for cart (persisted to `localStorage`), TanStack Query for server state |
| Notifications | WhatsApp Cloud API (primary), with an SMS provider adapter as fallback |
| Email | Resend (order receipts, admin alerts) |
| Charts | Recharts |
| Tables | TanStack Table (sorting, filtering, pagination, CSV export) |
| Dates | date-fns, `Asia/Kolkata` timezone throughout |
| Validation | zod on every API boundary — never trust client input |
| Deploy target | Vercel |

Money handling: **store all money as integer paise** (`Int`), never floats. Format for display only.

---

## 3. THEMING — EVERYTHING MUST BE ADMIN-EDITABLE

This is a hard requirement. **Do not hardcode a single colour, font, radius, or spacing value in
components.**

Implement a design-token system:

- A `SiteSettings` DB row holds the active theme: primary, secondary, accent, background, surface,
  foreground, muted, border, success, warning, danger; heading font family; body font family; base
  font size; border radius scale; button style (`rounded` | `pill` | `square`); container max-width;
  section spacing scale.
- On every page render (server-side), inject these as **CSS custom properties** into a `<style>` tag
  on `<html>`. Tailwind config maps its tokens to those CSS variables (e.g. `--color-primary`).
- Fonts: load from Google Fonts dynamically based on the stored font names. Provide a curated
  dropdown of ~20 fonts appropriate for a bakery brand (e.g. serif display + clean sans pairings),
  plus a free-text field for any Google Font name.
- Admin theming page has: colour pickers with live preview pane, font pickers with live preview,
  a set of 5 preset themes ("Warm Cocoa", "Cream & Sage", "Midnight Bakery", "Blush Pastel",
  "Monochrome"), **Reset to default**, and **Save**. Changes apply site-wide instantly on save with
  no redeploy.
- Also admin-editable: logo image, favicon, business name, tagline, hero heading/subheading/CTA
  label, hero background image, about section copy and image, footer copy, social links, contact
  email, business WhatsApp number, business address, FSSAI licence number, GST number and GST rate.

**Default theme to ship with:** warm off-white background (`#FAF7F2`), deep cocoa foreground
(`#2B1D14`), caramel primary (`#B5763A`), sage accent (`#8C9A7E`); headings in a warm serif,
body in a clean geometric sans; 12px radius.

---

## 4. DATA MODEL (Prisma schema — implement all of it)

```
SiteSettings      id, singleton flag, theme JSON, branding fields, contact fields,
                  ordersEnabled(Bool), orderingPausedMessage, nextAvailableDate,
                  nextAvailableMessage, gstRatePercent, packagingChargePaise,
                  minOrderValuePaise, deliveryNote, whatsappNumber, updatedAt

Category          id, name, slug, description, sortOrder, isActive

Product           id, categoryId, name, slug, code (e.g. "C1"), description,
                  ingredients, allergens[], images[] (ordered), isVeg(Bool),
                  sellingPricePaise, costOfMakingPaise, weightGrams,
                  isActive, isFeatured, sortOrder, createdAt, updatedAt

ProductVariant    id, productId, name (e.g. "Box of 4"), priceDeltaPaise,
                  costDeltaPaise, isActive        // optional, but implement fully

DailyCapacity     id, productId, date (Date), maxQuantity, reservedQuantity,
                  soldQuantity                    // unique(productId, date)

CapacityDefault   id, productId, weekdayMax, weekendMax  // used to auto-create DailyCapacity

Customer          id, phone (unique, E.164 +91), name, email, altPhone,
                  createdAt, totalOrders, lifetimeValuePaise

Address           id, customerId, line1, line2, landmark, area, city, state,
                  pincode, deliveryInstructions, latitude, longitude, isDefault

Order             id, orderNumber (human-readable: BK-YYMMDD-XXXX), customerId, addressId,
                  status (enum), fulfilmentType (DELIVERY | PICKUP),
                  requestedDate, requestedTimeSlot,
                  subtotalPaise, gstPaise, packagingPaise, discountPaise,
                  totalPaise, deliveryChargePaise (nullable, added later),
                  deliveryChargeStatus (NOT_APPLICABLE | PENDING | PAID),
                  paymentStatus (enum), notes, adminNotes,
                  createdAt, updatedAt, cancelledAt, cancellationReason

OrderItem         id, orderId, productId, variantId, nameSnapshot, codeSnapshot,
                  unitPricePaise, unitCostPaise, quantity, lineTotalPaise
                  // snapshot fields so historic orders never change when menu changes

Payment           id, orderId, provider ("razorpay"), razorpayOrderId,
                  razorpayPaymentId, razorpaySignature, method (upi/card/etc),
                  amountPaise, status, rawPayload JSON, createdAt
                  // second Payment row is used for the delivery-charge top-up

Delivery          id, orderId, provider (PORTER | MANUAL | SELF),
                  externalOrderId, riderName, riderPhone, trackingUrl,
                  quotedFarePaise, actualFarePaise, status, pickupEta,
                  dropEta, createdAt, rawPayload JSON

OrderStatusEvent  id, orderId, fromStatus, toStatus, note, actor (ADMIN|SYSTEM|CUSTOMER),
                  createdAt      // full audit trail, powers the customer tracking timeline

Expense           id, date, category (INGREDIENTS | PACKAGING | UTILITIES | MARKETING |
                  DELIVERY | OTHER), description, amountPaise, notes
                  // so the Financials page reflects real profit, not just COGS

AdminAlert        id, type, severity, title, body, isRead, relatedOrderId,
                  relatedProductId, createdAt

AdminUser         id, email, name, role (OWNER | STAFF), createdAt
```

**Order status enum (this exact sequence):**
`PENDING_PAYMENT → CONFIRMED → IN_PROGRESS → BAKED → PACKED → OUT_FOR_DELIVERY → DELIVERED`
plus terminal branches: `READY_FOR_PICKUP`, `CANCELLED`, `REFUNDED`, `PAYMENT_FAILED`.

**Payment status enum:** `PENDING`, `PAID`, `PARTIALLY_PAID`, `FAILED`, `REFUNDED`.

---

## 5. CUSTOMER SITE — PAGE BY PAGE

### 5.1 Global chrome

**Header** (sticky, transparent over hero, solid on scroll):
- **Left:** logo image (from settings) + business name.
- **Right:** `Find My Order` (text link) and `Order` (filled primary button → `/menu`).
- Cart icon with live item-count badge; opens a slide-over cart drawer.
- Mobile: hamburger → full-screen menu with the same links.

**Footer:** business name, tagline, contact, WhatsApp link, address, FSSAI number, social icons,
Instagram feed strip (static images from settings), copyright.

**Floating WhatsApp button** bottom-right on all customer pages, deep-links to
`https://wa.me/<number>` with a prefilled message.

### 5.2 Landing page `/`

Sections, in order, each with a subtle scroll-in reveal:

1. **Hero** — full-viewport, large background image, dark overlay for legibility. Centered:
   heading, subheading, and **one** button: **"Place an Order"** → `/menu`. Scroll-cue chevron.
   If ordering is OFF, this button still works but shows the pause modal (§7.3) on click.
2. **Brand story / About** — two-column image + text, editorial spacing.
3. **Featured products** — 3–6 cards pulled from `isFeatured`, each with image, name, short
   description, price, and "Add to cart". Cards show a soft "Only N left today" badge when
   remaining capacity ≤ 3, and a greyed-out "Sold out for today" state at 0.
4. **How it works** — 4 numbered steps: Choose → Order → We bake fresh → Delivered.
5. **Why us** — small icon grid: 100% homemade, no preservatives, baked to order, hygienic kitchen.
6. **Testimonials** — carousel, content from settings.
7. **FAQ** — accordion (delivery areas, lead time, shelf life, customisation, payment, cancellation).
8. **Final CTA band** — repeat of "Place an Order".

Performance: `next/image` everywhere, AVIF/WebP, blur placeholders, lazy loading below the fold.
Target Lighthouse ≥ 90 on Performance, Accessibility, Best Practices, SEO on mobile.

### 5.3 Menu `/menu`

- Category tabs/pills (Brownies, Cookies, Combos, Seasonal) — sticky under the header.
- Responsive product grid. Each card: image (hover → second image), name, code badge, short
  description, veg mark, weight, price, quantity stepper, "Add to cart".
- Availability rendered live per product for the selected fulfilment date:
  - remaining > 3 → normal
  - 1 ≤ remaining ≤ 3 → amber "Only N left"
  - remaining = 0 → disabled card, "Sold out for today", with "Notify me" capturing phone number
- Clicking a card opens a **product detail modal**: image gallery, full description, ingredients,
  allergens, storage advice, variant selector, quantity, "Add to cart".
- Filters: category, veg/eggless, price range, sort (popularity / price / newest).
- Search box with instant client-side filtering.

### 5.4 Cart drawer + `/cart`

- Line items with thumbnail, name, variant, unit price, quantity stepper, remove.
- Live totals: Subtotal → GST (rate from settings) → Packaging → **Total**.
- Explicit line: *"Delivery charges are calculated after your order is packed and paid separately."*
- Enforce `minOrderValuePaise`; block checkout below it with a clear message.
- **Re-validate capacity server-side** when the drawer opens and again at checkout. If capacity
  changed, show a non-dismissable diff modal: "Chocolate Fudge Brownie — only 2 available, your
  cart has 4. Reduce to 2 / Remove item."
- Cart persists across reloads via `localStorage`, with a 24-hour expiry.
- Primary button: **"Place an Order"** → `/checkout/details`.

### 5.5 Checkout step 1 — Details `/checkout/details`

Stepper UI at top: **Details → Payment → Confirmation**.

Fields (all zod-validated, inline errors, mobile-optimised input types):
- Full name *(required)*
- Phone *(required, +91, exactly 10 digits, live format)*
- Alternate phone *(optional, must differ from primary)*
- Email *(optional, valid format — used for the receipt)*
- Fulfilment: **Delivery** or **Pickup** (radio cards)
- Address line 1 *(required for delivery)*, line 2, landmark, area, city (default Chennai),
  state (default Tamil Nadu), pincode *(required, 6 digits, validated against a serviceable-pincode
  list in settings; non-serviceable → friendly message + WhatsApp CTA)*
- Preferred delivery date *(date picker; disable dates that are blocked, fully booked, or before
  the lead time; if `nextAvailableDate` is set, disable everything before it)*
- Preferred time slot *(dropdown of admin-configured slots)*
- Delivery instructions *(textarea — "gate code, landmark, leave with security", etc.)*
- Occasion / message on box *(optional)*
- Checkbox: "Save my details for faster checkout next time" (default on)
- Checkbox: agree to terms *(required)*

On submit: **persist immediately.** Upsert `Customer` by phone, create `Address`, create the
`Order` with `status = PENDING_PAYMENT` and all `OrderItem` rows with price/cost snapshots,
**reserve capacity** (`reservedQuantity += qty`) inside a single database transaction. Reservation
holds for 15 minutes; a background job releases expired reservations. Then redirect to
`/checkout/payment/[orderNumber]`.

Returning customers: entering a known phone offers "Welcome back — use saved address?" after an
OTP-free lightweight check (do not expose stored data until the phone matches an order lookup).

### 5.6 Checkout step 2 — Payment `/checkout/payment/[orderNumber]`

- Left: read-only order summary — items, quantities, subtotal, GST, packaging, **grand total**,
  plus the explicit note that **delivery charges are not included and will be collected separately
  after packing**.
- Right: payment panel.

**How UPI actually works — implement it this way:**
There is no legal way to redirect a browser straight into Google Pay's servers and charge a
customer. You must use a payment gateway. Use **Razorpay Standard Checkout**:

1. Server action creates a Razorpay Order (`amount = totalPaise`, `receipt = orderNumber`) and
   returns the `razorpayOrderId`.
2. Client opens Razorpay Checkout with UPI as the highlighted method.
3. **On mobile**, Razorpay's UPI Intent flow renders app icons — tapping Google Pay / PhonePe /
   Paytm opens that app via UPI intent, the user approves, and control returns to your page. This
   is the "auto-redirect to GPay" behaviour you want, and it is the only compliant way to get it.
4. **On desktop**, show the UPI QR code plus a "Pay with UPI ID" field.
5. Also enable cards, netbanking, and wallets — but present UPI first.

Verification (critical, do not skip):
- Verify `razorpay_signature` server-side with HMAC-SHA256 before marking anything paid.
- Also implement the **Razorpay webhook** (`payment.captured`, `payment.failed`,
  `refund.processed`) with signature verification — the webhook is the source of truth, the client
  callback is only for UX. Make the handler idempotent.
- On success: `paymentStatus = PAID`, `status = CONFIRMED`, convert reserved capacity to sold
  (`reservedQuantity -= qty; soldQuantity += qty`), write an `OrderStatusEvent`, fire customer
  WhatsApp + email confirmation, fire admin new-order alert, then redirect to confirmation.
- On failure: `PAYMENT_FAILED`, keep the reservation alive for 15 more minutes, show "Retry
  payment" and "Pay later via link".
- Handle abandonment: if the user closes checkout, the order stays `PENDING_PAYMENT` and appears
  in admin as an abandoned order with a "Send payment link" action.

### 5.7 Checkout step 3 — Confirmation `/checkout/success/[orderNumber]`

- Success animation (tasteful, one-shot).
- **Order ID displayed large, with a copy button** and the line: *"Save this ID — you'll need it to
  track your order."*
- Full order summary, delivery address, expected date/slot.
- Buttons: "Track my order", "Save receipt (PDF)", "Message us on WhatsApp".
- WhatsApp message auto-sent to the customer containing the order ID and a tracking link.

### 5.8 Find My Order `/track`

- Form: **Phone number + Order ID** → both required, rate-limited (5 attempts / 10 min / IP).
- On match: vertical timeline of `OrderStatusEvent` records with timestamps, current status
  highlighted, ETA, items, amount paid, and delivery tracking link + rider name/phone once
  a `Delivery` exists.
- **If delivery charge is pending**, show a prominent "Pay delivery charge — ₹X" button that opens
  a Razorpay payment link for that amount and updates `deliveryChargeStatus` on success.
- **Lost order ID:** a clearly visible panel — *"Lost your Order ID? Message us on WhatsApp with
  your phone number and we'll find it."* → deep link to the business WhatsApp number with a
  prefilled message.
- Auto-refresh status every 30 seconds while the page is open.

---

## 6. ORDERING TOGGLE & CAPACITY — THE CORE BUSINESS LOGIC

### 6.1 Global ordering switch

- `SiteSettings.ordersEnabled` is a master kill-switch, toggled from the admin header (one click,
  everywhere) and from Settings.
- When OFF:
  - Menu items render but "Add to cart" is disabled.
  - Clicking "Place an Order" anywhere opens a modal: the admin-authored
    `orderingPausedMessage`, the `nextAvailableDate` ("We reopen on Sat, 12 Sep"), a
    "Notify me when open" phone capture, and a WhatsApp CTA.
  - `/checkout/*` routes redirect to `/` with the same modal.
  - Server-side guard on every order-creation endpoint — never rely on UI state alone.
- Also support **blocked date ranges** (holidays, vacations) with their own message, so ordering
  can stay on generally but be closed for specific dates.

### 6.2 Per-product daily capacity

- Each product has a daily bake limit (e.g. C1 = 8, C2 = 4, C3 = 6), set as a weekday/weekend
  default and overridable per specific date from a calendar grid in admin.
- `available = maxQuantity - reservedQuantity - soldQuantity`.
- Enforcement points (all three, server-side): add-to-cart, cart re-validation, order creation.
- Attempting to exceed the limit → toast + inline card message: *"Only 8 Classic Fudge Brownies can
  be baked on 12 Sep. You can order up to 8 for that date, or pick another date."* Offer a
  one-click "Change date" that finds the next date with enough capacity.
- Race conditions: capacity mutation must run in a serialisable DB transaction with a row lock.
  Two simultaneous checkouts for the last unit must produce exactly one success and one clean
  failure — write a test proving this.
- **Admin alerts** (in-app bell + WhatsApp/email to owner):
  - product hits 100% booked for a date → "C1 fully booked for 12 Sep"
  - product crosses 80% → early warning
  - a customer was blocked by a capacity limit → "3 customers tried to order C1 beyond capacity
    today — consider raising the limit"
  - new order, failed payment, delivery-charge unpaid > 2h

---

## 7. ADMIN CONSOLE `/admin`

Login-gated (Supabase Auth). Persistent left sidebar, top bar with global ordering toggle, alert
bell with unread count, and admin name.

### 7.1 Dashboard

- KPI cards with period-over-period deltas: Revenue, Orders, Avg Order Value, Gross Profit,
  Profit Margin %, Items Sold, New vs Returning Customers, Pending Payments.
- Charts: revenue over time (line), orders by status (donut), top products by revenue and by
  quantity (bar), sales by weekday heatmap, capacity utilisation % per product.
- **Filters that apply to the entire dashboard:** date range (Today / Yesterday / 7d / 30d / This
  month / Last month / Custom), product, category, order status, payment status, fulfilment type.
- "Needs attention" panel: unpaid orders, orders stuck in a status > X hours, deliveries not booked,
  unread alerts.
- Today's bake list: aggregated quantity per product for today's and tomorrow's orders — printable.

### 7.2 Orders

- Data table: Order ID, date, customer name + phone, items summary, total, payment status,
  order status, fulfilment, delivery status, actions.
- Filters: status, payment status, date range, product, fulfilment type, delivery provider, search
  by name/phone/order ID. Saved filter presets. **CSV export** of the filtered set.
- Bulk actions: advance status, print labels, export.
- **Order detail drawer:** full customer + address block with tap-to-call and WhatsApp buttons,
  itemised order with cost and margin per line, payment history, status timeline, admin notes,
  and the delivery panel.
- **Status control:** a clear stepper where the admin advances the order. Every change writes an
  `OrderStatusEvent`, updates the customer-facing tracker instantly, and sends a WhatsApp update to
  the customer with an admin-editable template per status.
- Actions: mark paid manually (cash/UPI-direct, with reference note), send payment link, cancel with
  reason (auto-releases capacity), initiate refund via Razorpay, duplicate order, print invoice PDF
  and packing label.

### 7.3 Menu & Inventory

- Product CRUD with drag-to-reorder, multi-image upload (drag-drop, crop to square, auto-compress,
  reorder, set primary), rich-text description, ingredients, allergens, veg flag.
- **Cost of making** and **selling price** per product (and per variant) — margin % shown live as
  you type.
- Category CRUD with reordering.
- **Capacity manager:** a month calendar grid, products as rows, dates as columns. Inline-edit any
  cell. Bulk-set weekday/weekend defaults. Colour-coded fill: green < 50%, amber 50–99%, red 100%.
  Block entire dates.
- Active/inactive toggle and "hide from menu" per product.

### 7.4 Financials

- P&L view for any date range: Revenue → COGS (from `unitCostPaise` snapshots) → Gross Profit →
  Expenses (from the `Expense` table) → **Net Profit** and margin %.
- Per-product profitability table: units sold, revenue, cost, profit, margin %, sorted by profit.
- Expense CRUD with categories and receipt image upload.
- Delivery charge reconciliation: charged to customer vs actual fare paid, per order.
- GST summary: taxable value and tax collected per period.
- Charts: profit trend, cost breakdown, margin by product.
- Export any view to CSV and to a printable PDF report.

### 7.5 Customers

- Table: name, phone, orders count, lifetime value, last order date, saved address.
- Detail view: order history, favourite products, notes, one-click WhatsApp.
- Export CSV.

### 7.6 Settings

Tabbed: **Branding** · **Theme** · **Content** · **Ordering** · **Delivery** · **Payments** ·
**Notifications** · **Users**

- Branding: logo, favicon, business name, tagline, contact, socials, FSSAI/GST numbers.
- Theme: everything in §3, with live preview.
- Content: hero, about, why-us, testimonials, FAQ, footer — all editable, all rendering on the site.
- Ordering: master toggle, pause message, next available date, blocked dates, lead time (hours),
  time slots, min order value, GST rate, packaging charge, serviceable pincodes.
- Delivery: provider config, base charge, per-km charge, free-delivery threshold, pickup address.
- Payments: Razorpay key display (masked), test/live mode toggle.
- Notifications: WhatsApp templates per status with `{{name}}`, `{{orderId}}`, `{{status}}`,
  `{{trackingUrl}}` variables; toggle each notification on/off; admin alert recipients.
- Users: invite staff, roles.

---

## 8. DELIVERY — BUILD IT AS AN ADAPTER

**Facts to build around:** Dunzo's consumer delivery service shut down in January 2025 and the
company entered insolvency proceedings — **do not integrate it, do not reference it in the UI.**
Porter operates intra-city two-wheeler and truck delivery across Indian cities including Chennai and
offers API integration, but access is granted to business/enterprise accounts on request rather than
via instant self-serve keys.

Therefore:

1. Define a `DeliveryProvider` TypeScript interface: `getQuote(pickup, drop, weight)`,
   `createBooking(order)`, `cancelBooking(id)`, `getStatus(id)`, `handleWebhook(payload)`.
2. Implement **`PorterProvider`** against that interface, driven entirely by env vars
   (`PORTER_API_KEY`, `PORTER_BASE_URL`). Keep all Porter-specific request/response shaping in one
   file so it can be corrected against the real docs once credentials are issued. If the key is
   absent or the API returns an auth error, the provider self-disables gracefully and the system
   falls back to manual — **never break the order flow**.
3. Implement **`ManualProvider`** as the default, fully functional day-one path:
   - Admin clicks "Arrange delivery" on a packed order.
   - Modal shows the pickup address, the drop address, a "Copy address" button, and deep links that
     open the Porter and Rapido apps/sites with the addresses prefilled where their URL schemes
     allow.
   - Admin books in the third-party app, then enters: provider name, fare charged to the customer,
     actual fare paid, rider name, rider phone, tracking URL.
   - Saving this creates the `Delivery` row, sets `deliveryChargePaise`,
     `deliveryChargeStatus = PENDING`, moves the order to `OUT_FOR_DELIVERY`, and **automatically
     sends the customer a WhatsApp message with a Razorpay payment link for the delivery charge**
     plus the rider details and tracking link.
4. Implement **`SelfProvider`** for owner-delivered orders (record fare, mark delivered).
5. Delivery charge is **always borne by the customer** and is **never bundled into the initial
   payment**. It is a second, separate collection after packing. The financials page reconciles
   charged vs actual.
6. Build an admin toggle: "Try automatic booking first" (uses Porter if configured, falls back to
   manual with a clear banner explaining why).

---

## 9. NOTIFICATIONS

WhatsApp Cloud API, all templates admin-editable, all individually toggleable:

| Trigger | To | Content |
|---|---|---|
| Order confirmed & paid | Customer | Order ID, items, total, expected date, tracking link |
| Status change | Customer | New status in plain language + tracking link |
| Delivery arranged | Customer | Rider name/phone, tracking URL, delivery-charge payment link |
| Delivery charge unpaid > 2h | Customer | Polite reminder + link |
| Order delivered | Customer | Thank-you + review request |
| New order | Admin | Customer, items, total |
| Payment failed | Admin | Order ID + retry link to send |
| Capacity full / 80% | Admin | Product + date |
| Blocked-by-capacity attempts | Admin | Product, date, attempt count |

Email (Resend): order receipt PDF to the customer, daily summary to the admin.
Build a `NotificationService` abstraction so providers can be swapped; log every send attempt with
status so failures are visible in admin.

---

## 10. SECURITY, RELIABILITY, COMPLIANCE

- All mutations via server actions or route handlers with zod validation. Never trust the client.
- Row Level Security on Supabase; admin routes protected by middleware, not just by hidden UI.
- Rate limiting on `/track`, order creation, and OTP-ish endpoints.
- Razorpay signature verification on both the callback and the webhook; webhook handlers idempotent
  via a processed-event table.
- Secrets only in env vars; never expose the Razorpay secret or Supabase service key client-side.
- CSRF protection, security headers, input sanitisation on all rich-text output.
- Structured error logging; a global error boundary with a friendly branded error page.
- Soft-delete for orders and products; nothing customer-facing is ever hard-deleted.
- Full audit trail on every admin action.
- GST-compliant invoice PDF: business name, address, GSTIN, invoice number, HSN, taxable value,
  CGST/SGST split, total in words.
- Cookie consent banner and a privacy policy page.

---

## 11. RESPONSIVENESS, ACCESSIBILITY, POLISH

- Mobile-first. Test at 360, 390, 768, 1024, 1440, 1920px. **Most customers will be on a phone.**
- Touch targets ≥ 44px. Bottom-anchored primary CTAs on mobile checkout.
- WCAG 2.1 AA: semantic HTML, keyboard navigation, visible focus rings, ARIA labels, alt text,
  contrast ≥ 4.5:1 (validate the default theme, and warn the admin in the theme editor when a
  chosen colour pair fails contrast).
- Skeleton loaders for every async surface — never a bare spinner on a full page.
- Optimistic UI on cart operations with rollback on failure.
- Empty states with illustration + helpful copy for: empty cart, no orders, no products, no results.
- Toast notifications for every action outcome.
- `prefers-reduced-motion` respected.
- SEO: per-page metadata, OpenGraph images, JSON-LD (`LocalBusiness`, `Product`, `Offer`),
  sitemap.xml, robots.txt.
- PWA manifest so customers can add the site to their home screen.

---

## 12. SEED DATA (create this, so the app is usable the moment it boots)

- Site settings with the default theme from §3 and realistic Chennai bakery content.
- 3 categories: Brownies, Cookies, Combo Boxes.
- 9 products with codes C1–C9, realistic names, descriptions, ingredients, allergens, prices in
  ₹150–₹950, costs at roughly 40–50% of price, and placeholder images.
- Daily capacities: C1 = 8, C2 = 4, C3 = 6, others 5–10, seeded for the next 30 days.
- 25 sample orders spread across the last 60 days in varied statuses, with payments and a few
  deliveries and refunds, so the dashboard and financials render meaningfully.
- 12 customers, some repeat.
- 15 expenses across categories.
- One admin user: `admin@bakery.local` / `Admin@12345` (printed to console on seed).

---

## 13. DELIVERABLES

1. Full source in a clean monorepo-ready structure with clear folder organisation.
2. `README.md`: setup, env vars, Supabase setup, Razorpay setup (test keys), WhatsApp setup, seed,
   deploy to Vercel, and how to switch to live payments.
3. `.env.example` with every variable and a comment explaining each.
4. `DECISIONS.md` documenting choices made where the spec was silent.
5. Prisma schema + migrations + seed script.
6. Tests: unit tests for pricing/GST/capacity maths; an integration test for the concurrent
   last-unit checkout race; an E2E happy path (Playwright) from landing → order → payment (Razorpay
   test mode) → tracking.
7. A final self-verification report against §14.

---

## 14. ACCEPTANCE CRITERIA — VERIFY EACH BEFORE DECLARING DONE

- [ ] Landing page matches the heidako-style aesthetic with **exactly one** hero CTA, "Place an Order"
- [ ] Logo sits top-left; "Find My Order" and "Order" sit top-right
- [ ] Full flow works end-to-end: land → menu → cart → details → payment → confirmation → track
- [ ] Every customer detail (name, phone, alt phone, address, instructions, date, slot) is persisted
      and visible in admin
- [ ] Totals correctly compute subtotal + GST + packaging, and clearly exclude delivery
- [ ] Razorpay UPI intent opens GPay/PhonePe on mobile; payment verified by signature **and** webhook
- [ ] Order confirmation shows a copyable Order ID and sends a WhatsApp message
- [ ] Tracking works with phone + Order ID; lost-ID path surfaces the business WhatsApp number
- [ ] Admin ordering toggle instantly blocks customer ordering and shows the pause modal with the
      next-available date
- [ ] Per-product daily caps enforce correctly (C1 = 8 blocks the 9th), with customer-facing message
      and admin alert
- [ ] Concurrent checkout for the last unit yields exactly one success
- [ ] Admin can advance order status and the customer tracker updates immediately
- [ ] Admin can arrange delivery, set the charge, and the customer receives a separate payment link
- [ ] Porter adapter exists and degrades gracefully to manual when unconfigured
- [ ] Dashboard KPIs, charts, and all filters return correct numbers
- [ ] Financials compute gross and net profit from real cost, price, and expense data
- [ ] Theme editor changes colours and fonts site-wide instantly, with no code change
- [ ] Menu editor adds products with photos and per-product daily limits
- [ ] Fully responsive at all six breakpoints; Lighthouse mobile ≥ 90 across all four categories
- [ ] No console errors, no broken links, no dead buttons, no `TODO` comments anywhere

---

## 15. BUILD ORDER

1. Scaffold, Tailwind + shadcn, token/theming system, Prisma schema, seed.
2. Customer site shell: header, footer, landing page.
3. Menu, product modal, cart drawer, cart page.
4. Checkout details, order creation, capacity reservation transaction.
5. Razorpay integration, webhook, confirmation page.
6. Order tracking page.
7. Admin auth, layout, orders table + detail drawer + status control.
8. Menu & inventory management, capacity calendar.
9. Dashboard and financials.
10. Settings (branding, theme, content, ordering, notifications).
11. Delivery adapters, manual flow, delivery-charge collection.
12. Notifications, alerts, invoices/PDFs.
13. Tests, accessibility pass, performance pass, polish.
14. README, DECISIONS, self-verification report.

**Build all fifteen sections. Do not stop early. Do not ask for confirmation between phases.**
