# 🚀 LAUNCH_READY.md — Secured Tampa (Dave App)

**Date:** February 13, 2026  
**QA Pass:** Foundation Hardening v1

---

## ✅ Current State Assessment

### What Works
- **Shop / Product Browsing** — Product grid, filtering, sorting, search all functional
- **Product Detail Pages** — Dynamic pages with image gallery, size selection, add-to-cart
- **Cart System** — Zustand-persisted cart with add/remove/quantity update, cart drawer
- **Checkout Flow** — 3-step checkout (info → review/payment → confirmation)
  - Server-side stock validation prevents overselling
  - Server-side price computation (no client-trusted totals)
  - Stripe PaymentIntent created with full metadata
  - Promo codes and gift cards validated server-side
- **Stripe Webhook** — Creates order record, decrements inventory (product + variant level), sends confirmation email via Resend, syncs to Clover POS
- **Cart Clears** after successful purchase on confirmation page
- **Order Confirmation Email** — Branded HTML email sent via Resend API from webhook
- **Admin Dashboard** — Full admin panel with sidebar navigation
  - Products CRUD (create, edit, list)
  - Orders list + detail + status updates + packing slips
  - Customer list + detail pages
  - Inventory management with adjustments
  - Analytics dashboard with revenue charts
  - Shipping labels (Shippo integration)
  - Pokemon card inventory management
  - Drops management
  - Gift cards, discounts, payment links
  - Refunds processing
- **Admin Auth** — Client-side layout gating via `useAuth()` hook (role check against profiles table)
- **Mobile Responsive** — All core pages use responsive Tailwind classes (grid-cols-2 → grid-cols-4, proper padding)
- **SEO** — Metadata, OpenGraph, sitemap.xml, robots.txt, JSON-LD
- **Error Handling** — Error boundary, global error page, 404 page, rate limiting on checkout

### Build Status
✅ `npx next build` — **PASSES with zero errors** (116 routes)

---

## ⚠️ Known Issues & Limitations

### Security (Medium Priority)
- **Admin API routes check auth but not admin role** — Most `/api/admin/*` routes verify the user is logged in (`supabase.auth.getUser()`) but don't verify the user has an admin role. The client-side admin layout gates access, and Supabase RLS provides a second layer, but API endpoints should also check role. A `requireAdmin()` helper has been created at `src/lib/admin-auth.ts` and applied to `/api/admin/products` — remaining routes should be migrated.

### Checkout Flow
- **No Stripe keys in .env.local** — Checkout will fail until `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are added
- **Gift card payment not deducted from Stripe amount** — Gift card balance is shown in UI but the full amount is still sent to Stripe PaymentIntent. Need to subtract gift card balance before creating the intent (or use Stripe's built-in coupons).
- **Race condition on stock** — Two simultaneous checkouts could both pass stock validation before either decrements. Consider using Supabase RPC with `FOR UPDATE` locks for critical stock checks.
- **Discount code applied client-side then re-validated server-side** — This is correct behavior but the `useEffect` dependency on `appliedDiscount` re-creates the PaymentIntent each time a promo is applied/removed. Could cause multiple payment intents.

### Email
- **Resend domain** — `orders@securedtampa.com` must be verified in Resend dashboard before emails will deliver
- **Duplicate RESEND_API_KEY** in .env.local — Two different keys are set; last one wins

### Integrations
- **Clover sync** is fire-and-forget — failures are logged but not retried
- **StockX OAuth** callback URL points to `securedtampa.com` — must match actual domain
- **Shippo** — Requires `SHIPPO_API_KEY` env var (not in current .env.local)

---

## 📋 Required Environment Variables on Vercel

### Required (app won't function without these)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_SITE_URL` | `https://securedtampa.com` |
| `RESEND_API_KEY` | Resend API key for emails |

### Optional (features degrade gracefully without these)
| Variable | Feature |
|----------|---------|
| `STOCKX_CLIENT_ID` / `STOCKX_CLIENT_SECRET` / `STOCKX_API_KEY` | StockX market data |
| `NEXT_PUBLIC_CLOVER_APP_ID` / `CLOVER_*` | Clover POS sync |
| `SHIPPO_API_KEY` | Shipping labels |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS notifications |
| `NEXT_PUBLIC_GA4_ID` | Google Analytics |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel |
| `SENTRY_AUTH_TOKEN` / `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring |

---

## 🛫 Steps to Go Live

### 1. Vercel Setup
1. Import `AidanFromm/Dave-App` repo → select `website` as root directory
2. Framework preset: Next.js
3. Add all required environment variables (see table above)
4. Deploy

### 2. Stripe Setup
1. Get live Stripe keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create webhook endpoint: `https://securedtampa.com/api/webhooks/stripe`
3. Subscribe to `payment_intent.succeeded` event
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Domain & DNS
1. Add `securedtampa.com` custom domain in Vercel
2. Configure DNS (Vercel will provide records)
3. Update `NEXT_PUBLIC_SITE_URL` to `https://securedtampa.com`

### 4. Email (Resend)
1. Verify `securedtampa.com` domain in Resend dashboard
2. Add required DNS records (SPF, DKIM, DMARC)
3. Confirm `orders@securedtampa.com` works as sender

### 5. Supabase
1. Ensure all database tables and RLS policies are set up (see `database/` and `migrations/` folders)
2. Create admin user profile with `role: 'owner'` in profiles table
3. Enable email auth in Supabase dashboard

### 6. Post-Launch
- [ ] Test a real purchase end-to-end (use Stripe test mode first)
- [ ] Verify webhook receives events and creates orders
- [ ] Verify confirmation email arrives
- [ ] Test admin login and product management
- [ ] Set up Sentry for error monitoring
- [ ] Set up Google Analytics
- [ ] Migrate remaining admin API routes to use `requireAdmin()` helper

---

## 🏗️ Architecture Notes

- **Framework:** Next.js 16 (App Router) with Turbopack
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Payments:** Stripe (PaymentIntents API)
- **Email:** Resend
- **State:** Zustand (cart, wishlist, theme)
- **UI:** Tailwind CSS v4 + shadcn/ui + Framer Motion
- **POS:** Clover integration (optional sync)
- **Shipping:** Shippo (label creation + tracking)
