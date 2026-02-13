# SecuredTampa — Master Plan
### Custom E-Commerce + POS Platform for Dave's Sneaker & Pokémon Card Store
**Budget:** $4,500 | **Stack:** Next.js 16 + Supabase + Stripe + Clover POS  
**Last Updated:** February 13, 2026

---

## 1. Executive Summary

We're building Dave a **custom Shopify replacement** — a unified platform that runs his sneaker and Pokémon card business from one dashboard. Customers browse and buy online (shipped or in-store pickup), Dave manages everything from an admin panel, and the website stays in sync with his Clover POS for in-store transactions.

**Why custom instead of Shopify?**
- Zero monthly platform fees (just hosting ~$20/mo + Stripe processing)
- Domain-specific features Shopify doesn't have: Pokemon card grading system, StockX market pricing, walk-in purchase logging, Clover POS sync
- Dave owns everything — no vendor lock-in, no app subscription bloat
- Already 60% built — the foundation exists, it just needs to be production-ready

**What Dave gets when we're done:**
- A working online store at securedtampa.com with shipping + in-store pickup
- Clover POS synced with website inventory (one source of truth)
- Admin dashboard for orders, inventory, customers, analytics
- Pokemon card system with grading, sealed products, and market pricing
- Walk-in purchase flow for buying sneakers/cards from customers
- iPad kiosk mode for in-store browsing
- Staff accounts with appropriate permissions

---

## 2. Current State (Audit Score: 4.3/10)

### What Already Works ✅
- Product browsing with category filters, search, sort
- Cart with Zustand persistence + drawer UI
- 2-step checkout (shipping info → Stripe payment)
- Stripe PaymentIntent + webhook-based order creation
- Auth (email/password, role-based: owner/manager/staff/customer)
- Admin dashboard with KPIs, revenue charts, channel breakdown
- Product CRUD with image upload
- Order management (list, detail, mark shipped, cancel)
- Barcode scanning, StockX integration, Pokemon TCG search
- Clover OAuth + sync + webhook scaffolding
- Dark/light theme, responsive header, policy pages

### What's Broken 🔴 (P0 — Must Fix Before Launch)
| Issue | Impact |
|-------|--------|
| Orders RLS policy allows ANY user to read ALL orders | **Security breach** — customer data exposed |
| Stripe webhook inserts `"stripe_webhook"` as `adjusted_by` — FK violation on UUID column | **Orders silently fail** to create |
| Stripe webhook `source` value not in CHECK constraint | **Same — orders break** |
| No server-side stock validation before checkout | **Overselling** — two people buy last item |
| Tax/shipping hardcoded to $0 in webhook | **Wrong order totals** stored |
| No order confirmation email sent | **Customers get nothing** after paying |

### What's Missing 🟡 (Critical for a Real Store)
- Discount/promo codes
- Refund processing (Stripe refund API)
- Shipping label generation (FedEx API keys exist but no integration)
- Transactional emails (confirmation, shipping, delivery)
- Product variants (size matrix with individual stock)
- Pagination on products/orders/customers
- Sitemap + JSON-LD for SEO
- Low-stock alerts
- CSV export
- Admin mobile responsiveness

---

## 3. Architecture

### Tech Stack (No Changes Needed)
```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 16 (App Router, RSC + Client)          │
│  Tailwind v4 + shadcn/ui + Framer Motion        │
│  Zustand (cart, wishlist, theme state)           │
│  Recharts (analytics)                            │
├─────────────────────────────────────────────────┤
│                   BACKEND                        │
│  Next.js API Routes                              │
│  Supabase (PostgreSQL + Auth + Storage + RLS)    │
│  Stripe (PaymentIntents + Webhooks + Refunds)    │
│  Resend (transactional email)                    │
│  Twilio (SMS notifications — already configured) │
├─────────────────────────────────────────────────┤
│               INTEGRATIONS                       │
│  Clover POS (OAuth + REST API + Webhooks)        │
│  FedEx API (shipping labels + rates)             │
│  StockX API (sneaker market pricing)             │
│  Pokemon TCG API (card search + data)            │
│  html5-qrcode (barcode scanning)                 │
├─────────────────────────────────────────────────┤
│                  HOSTING                         │
│  Vercel (frontend + API routes)                  │
│  Supabase Cloud (database + auth + storage)      │
└─────────────────────────────────────────────────┘
```

### Key Architecture Decisions
1. **Supabase is the source of truth** — Clover syncs TO Supabase, not the other way around
2. **Stripe handles all online payments** — Clover handles in-store card processing
3. **No separate backend** — Next.js API routes are sufficient for this scale
4. **RLS enforces security** — Every table has row-level security policies
5. **Webhooks for sync** — Stripe webhook creates orders, Clover webhook syncs inventory changes

### Database Schema Additions Needed
```sql
-- Product variants (size matrix for sneakers)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  condition TEXT, -- DS, VNDS, Used-Excellent, Used-Good, Used-Fair
  sku TEXT UNIQUE,
  barcode TEXT,
  price DECIMAL(10,2),
  quantity INT DEFAULT 0,
  clover_item_id TEXT, -- sync reference
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Discount codes
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'percentage', 'fixed'
  value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2),
  max_uses INT,
  uses INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Walk-in purchases (buying FROM customers)
CREATE TABLE purchase_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_name TEXT,
  seller_phone TEXT,
  seller_email TEXT,
  items JSONB NOT NULL, -- [{description, category, condition, offered_price, market_price}]
  total_paid DECIMAL(10,2) NOT NULL,
  payment_method TEXT, -- 'cash', 'zelle', 'store_credit'
  notes TEXT,
  photos TEXT[], -- receipt/item photos
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pokemon card grading details
CREATE TABLE pokemon_card_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL, -- 'raw', 'graded', 'sealed'
  set_name TEXT,
  card_number TEXT,
  rarity TEXT,
  condition TEXT, -- NM, LP, MP, HP, DMG (for raw)
  grading_company TEXT, -- PSA, BGS, CGC (for graded)
  grade DECIMAL(3,1), -- 10.0, 9.5, etc.
  cert_number TEXT, -- grading cert number
  tcgplayer_price DECIMAL(10,2),
  last_price_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. Sprint Plan

### Sprint 1: Critical Fixes + Foundation (Weeks 1-2)
**Goal:** Make the existing app safe and functional for real transactions.

| # | Task | Priority | Hours |
|---|------|----------|-------|
| 1.1 | Fix orders RLS — restrict to own orders by email or admin role | P0 | 1 |
| 1.2 | Fix Stripe webhook — correct `adjusted_by` (use system UUID) and `source` constraint | P0 | 2 |
| 1.3 | Add server-side stock validation in `/api/checkout` | P0 | 3 |
| 1.4 | Pass tax/shipping through Stripe metadata, use real values in webhook | P0 | 3 |
| 1.5 | Wire up order confirmation email via Resend in webhook | P0 | 4 |
| 1.6 | Clear cart on successful checkout (confirmation page) | P0 | 1 |
| 1.7 | Fix desktop checkout submit button (proper form submission) | P0 | 1 |
| 1.8 | Add pagination to products, orders, and customers | P1 | 6 |
| 1.9 | Fix customer N+1 query (use join/aggregate) | P1 | 2 |
| 1.10 | Replace empty catch blocks with error toasts across admin | P1 | 4 |
| 1.11 | Research Clover API — test OAuth with Dave's credentials when available | P1 | 4 |
| **Total** | | | **~31 hrs** |

**Deliverable:** App is safe for real money. No data leaks, no broken orders.

### Sprint 2: Core E-Commerce (Weeks 3-4)
**Goal:** Ship orders, handle pickups, take promo codes.

| # | Task | Priority | Hours |
|---|------|----------|-------|
| 2.1 | Discount code system — `discounts` table + checkout integration + admin CRUD | P1 | 8 |
| 2.2 | Refund flow — Stripe refund API + order status update + email notification | P1 | 6 |
| 2.3 | Shipping label generation — FedEx API integration (rates + labels) | P1 | 10 |
| 2.4 | In-store pickup flow — checkout option + SMS notification via Twilio when ready | P1 | 6 |
| 2.5 | Transactional emails — shipping confirmation, delivery notification templates | P1 | 5 |
| 2.6 | Order confirmation page polish — show order details, tracking link | P1 | 3 |
| 2.7 | Stripe Payment Links — generate shareable links from admin for Instagram/DM orders | P1 | 4 |
| 2.8 | Admin: manual order creation (for phone/DM orders) | P2 | 5 |
| **Total** | | | **~47 hrs** |

**Deliverable:** Dave can take online orders, ship them, offer pickup, and send promo codes.

### Sprint 3: Inventory Management (Weeks 5-6)
**Goal:** Smart inventory for sneakers + Pokemon cards with walk-in buying.

| # | Task | Priority | Hours |
|---|------|----------|-------|
| 3.1 | Product variants system — size matrix for sneakers with individual stock | P1 | 10 |
| 3.2 | Walk-in purchase flow — form to log buying sneakers/cards from customers | P1 | 8 |
| 3.3 | Pokemon card detail system — grading, sets, rarity, cert numbers | P1 | 8 |
| 3.4 | Sealed product management — booster boxes, ETBs with UPC scanning | P2 | 4 |
| 3.5 | Barcode scanning improvements — camera-based scan → auto-populate product | P2 | 5 |
| 3.6 | StockX price sync — auto-fetch market prices for sneaker pricing reference | P2 | 4 |
| 3.7 | Low-stock alerts — email/SMS when products hit threshold | P2 | 4 |
| 3.8 | Clover inventory sync — bidirectional sync between Supabase and Clover | P1 | 10 |
| **Total** | | | **~53 hrs** |

**Deliverable:** Full inventory system handling sneakers (sized) and Pokemon cards (graded) with Clover sync.

### Sprint 4: Customer Experience (Weeks 7-8)
**Goal:** Make the storefront look and feel professional.

| # | Task | Priority | Hours |
|---|------|----------|-------|
| 4.1 | Catalog polish — better filters (brand, size, condition, price range) | P2 | 8 |
| 4.2 | Mobile optimization — responsive product grid, touch-friendly checkout | P2 | 6 |
| 4.3 | iPad in-store kiosk mode — simplified browsing UI, easy add-to-cart | P2 | 8 |
| 4.4 | Product page improvements — breadcrumbs, related products, size guide | P2 | 5 |
| 4.5 | Instagram integration — product links, "Shop on Instagram" landing | P2 | 4 |
| 4.6 | Search improvements — predictive search, multi-facet filtering | P2 | 5 |
| 4.7 | Empty/error states — proper messaging when no results, API failures | P2 | 3 |
| 4.8 | Product image zoom on mobile | P3 | 2 |
| **Total** | | | **~41 hrs** |

**Deliverable:** Store looks professional, works great on mobile/iPad.

### Sprint 5: Admin Dashboard + Operations (Weeks 9-10)
**Goal:** Give Dave the tools to run his business daily.

| # | Task | Priority | Hours |
|---|------|----------|-------|
| 5.1 | Admin mobile responsiveness — collapsible sidebar, responsive tables | P2 | 6 |
| 5.2 | CSV export — orders, customers, products, inventory | P2 | 4 |
| 5.3 | Print packing slips / invoices | P2 | 5 |
| 5.4 | Employee management — staff accounts, permissions, activity log | P2 | 6 |
| 5.5 | Daily operations dashboard — today's orders, pickups pending, low stock | P2 | 5 |
| 5.6 | Profit margin reporting — cost vs. revenue by product/category | P2 | 4 |
| 5.7 | Customer notes + communication log | P3 | 3 |
| 5.8 | Batch order actions — bulk mark shipped, bulk print labels | P3 | 4 |
| **Total** | | | **~37 hrs** |

**Deliverable:** Dave has a complete admin toolkit for daily store operations.

### Sprint 6: Polish + Launch (Weeks 11-12)
**Goal:** SEO, final QA, go live.

| # | Task | Priority | Hours |
|---|------|----------|-------|
| 6.1 | SEO — sitemap.xml, JSON-LD product schema, meta tags, OG images | P2 | 6 |
| 6.2 | Google Business Profile optimization + local SEO | P2 | 2 |
| 6.3 | Email notification templates polish (branded HTML) | P2 | 4 |
| 6.4 | Performance optimization — caching, image optimization, lazy loading | P2 | 4 |
| 6.5 | Security audit — rate limiting on public APIs, input sanitization | P2 | 4 |
| 6.6 | Full QA pass — every checkout path, every admin function | P1 | 8 |
| 6.7 | Dave onboarding — walkthrough of admin features, documentation | P1 | 4 |
| 6.8 | DNS/hosting setup, production environment config | P1 | 2 |
| 6.9 | Launch monitoring — error tracking, uptime alerts | P2 | 2 |
| **Total** | | | **~36 hrs** |

**Deliverable:** Site is live, optimized, and Dave knows how to use everything.

---

## 5. Clover Integration Plan

### Overview
Dave already has Clover hardware in-store. The website needs to stay in sync so inventory is accurate across both channels.

### Architecture: Supabase = Source of Truth
```
                    ┌──────────────┐
                    │   SUPABASE   │ ← Source of truth
                    │  (Products,  │
                    │   Orders,    │
                    │  Inventory)  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐
        │  Website   │ │Clover │ │   Admin   │
        │ (Next.js)  │ │  POS  │ │ Dashboard │
        └───────────┘ └───────┘ └───────────┘
```

### Sync Strategy
1. **Clover → Supabase (via webhooks):**
   - When an item sells on Clover POS → Clover fires webhook → `/api/clover/webhook` decrements Supabase stock
   - When Dave adds an item on Clover → webhook creates/updates product in Supabase

2. **Supabase → Clover (via API):**
   - When a product is created/updated in admin dashboard → API call updates Clover inventory
   - When an online order sells an item → API call decrements Clover stock

3. **Daily reconciliation:**
   - Nightly cron job compares Supabase quantities vs. Clover quantities
   - Flags discrepancies for Dave to review in admin dashboard
   - Auto-corrects if within tolerance (±1 unit) with audit log

### Clover API Integration Points
| Endpoint | Purpose |
|----------|---------|
| `GET /v3/merchants/{mId}/items` | Pull full Clover catalog |
| `POST /v3/merchants/{mId}/items` | Create item in Clover |
| `PUT /v3/merchants/{mId}/items/{id}` | Update item (price, stock) |
| `GET /v3/merchants/{mId}/orders` | Pull Clover orders for analytics |
| `POST /v3/merchants/{mId}/webhooks` | Register webhook subscriptions |

### Implementation Steps
1. Dave provides Clover merchant login → complete OAuth flow
2. Pull full Clover catalog → map to Supabase products (by SKU/barcode)
3. Set up webhook subscriptions for inventory changes and new orders
4. Build sync status dashboard in admin (`/admin/clover`) — already scaffolded
5. Test bidirectional sync with small inventory subset
6. Roll out to full catalog

---

## 6. Pokemon Card System

### Product Types
| Type | Fields | Pricing Source |
|------|--------|---------------|
| **Raw Singles** | Set, card number, name, rarity, condition (NM/LP/MP/HP/DMG) | TCGplayer market price |
| **Graded Slabs** | All above + grading company (PSA/BGS/CGC), grade (1-10), cert number | eBay sold comps |
| **Sealed Product** | Product name, set, UPC, product type (booster box/ETB/blister/tin) | MSRP or market for out-of-print |

### Card Entry Workflow
```
Dave gets cards →
  1. Search Pokemon TCG API by set + card number (already built)
  2. Auto-populate: name, set, rarity, image
  3. Dave selects: condition (raw) OR enters grade + cert (graded)
  4. System suggests price from TCGplayer/market data
  5. Dave confirms or adjusts price
  6. Product created with proper SKU format:
     - Raw: PKM-{SET}-{NUMBER}-{CONDITION} (e.g., PKM-OBF-006-NM)
     - Graded: PKM-{SET}-{NUMBER}-{COMPANY}{GRADE} (e.g., PKM-OBF-006-PSA10)
     - Sealed: PKM-SEALED-{SET}-{TYPE} (e.g., PKM-SEALED-OBF-BB)
  7. Print barcode label for physical storage
```

### Display & Organization
- **$50+ cards:** Locked display case (graded slabs + high-value raw)
- **$5-$49 cards:** Binder behind counter, browsable with staff
- **Under $5 cards:** Open bins/binders for customer self-service
- **Sealed product:** Display shelf with one of each, overstock in back

### Pricing Reference
- Pokemon TCG API search is already built (`/api/pokemon/search`)
- Add TCGplayer price scraping or API for market pricing
- Reference CardLedger for graded card valuations
- Weekly price audit reminder in admin dashboard

---

## 7. Walk-in Purchase Flow

When someone walks in to sell sneakers or Pokemon cards to Dave:

### UI: `/admin/purchases/new`
```
┌─────────────────────────────────────────────┐
│  📦 New Walk-in Purchase                     │
│                                              │
│  Seller Info (optional):                     │
│  [Name: ___________] [Phone: __________]     │
│  [Email: __________]                         │
│                                              │
│  Items:                                      │
│  ┌──────────────────────────────────────┐   │
│  │ + Add Sneaker | + Add Pokemon Card   │   │
│  │ + Scan Barcode                       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Item 1: Air Jordan 1 Bred, Size 10, VNDS   │
│    Market Price: $280 (StockX)               │
│    Offer Price:  [$180_____] ← Dave enters   │
│                                              │
│  Item 2: Charizard ex 006/165, NM Raw        │
│    Market Price: $45.00 (TCGplayer)          │
│    Offer Price:  [$25______] ← 55% of market │
│                                              │
│  ─────────────────────────────────────       │
│  Total to Pay Seller: $205.00                │
│  Payment Method: [Cash ▼] [Zelle] [Credit]  │
│                                              │
│  [📸 Take Photo of Items]                    │
│  [Notes: ________________________]           │
│                                              │
│  [Complete Purchase] → Items added to        │
│                        inventory automatically│
└─────────────────────────────────────────────┘
```

### Business Rules
- Market price auto-populated from StockX (sneakers) or TCGplayer (cards)
- Suggested offer = 50-65% of market for cards, 60-75% for sneakers
- Dave can override any price
- On completion: items automatically created as products in inventory
- Photo documentation stored in Supabase Storage
- Purchase transaction logged for accounting/tax purposes
- Receipt printable for seller

---

## 8. Shipping + Pickup

### Shipping Integration (FedEx Primary)
**FedEx API credentials already configured** (Account: 201536679)

| Feature | Implementation |
|---------|---------------|
| Rate calculation | FedEx Rate API at checkout — show Ground, Express, 2-Day options |
| Label generation | FedEx Ship API from admin order detail page |
| Tracking | FedEx Track API — auto-update order status |
| Label printing | Generate PDF label → print from admin |

**Shipping rates strategy:**
- Free shipping over $150
- Flat $8 for sneakers under $150
- Flat $5 for cards under $150
- $2 PWE option for single raw cards under $20 (no tracking)

**Packaging guidelines (shown in admin):**
- Cards: Toploader + penny sleeve + team bag → bubble mailer
- Sneakers: OG box inside shipping box with air pillows
- Graded slabs: Bubble wrap + cardboard insert → small box

### In-Store Pickup
```
Customer selects "Pick Up In-Store" at checkout →
  1. Order created with fulfillment_type = 'pickup'
  2. Dave gets notification in admin dashboard + push/SMS
  3. Dave pulls items, marks "Ready for Pickup" in admin
  4. Customer gets SMS via Twilio: "Your order is ready! Pick up at [address]"
  5. Customer arrives, Dave marks "Picked Up" → order complete
```

**Pickup hours:** Displayed at checkout, matching store hours  
**Hold period:** 7 days, then auto-cancel with notification

---

## 9. iPad In-Store Experience

### Kiosk Mode (`/kiosk` or `/browse`)
A simplified, touch-optimized browsing experience for the iPad on the store counter.

**Features:**
- Large product cards with swipe gestures
- Category tabs: Sneakers | Pokemon Cards | Sealed | New Arrivals
- Size filter (prominent for sneakers)
- Tap product → full-screen gallery + details
- "Ask Staff About This Item" button (no self-checkout in kiosk — Dave handles payment via Clover)
- Optional: "Buy Online for Shipping" button that adds to a web cart with QR code

**Technical:**
- PWA with `display: standalone` for fullscreen iPad experience
- Add to Home Screen for app-like launch
- Auto-lock to kiosk route (no navigation to admin)
- Disable pull-to-refresh, zoom, and other browser gestures
- Large touch targets (min 48px), big fonts

**Hardware:**
- iPad (any recent model) in a stand/enclosure
- Positioned on counter or display table
- Connected to store WiFi

---

## 10. Staff Features

### Role Permissions Matrix

| Feature | Owner (Dave) | Manager | Staff |
|---------|:---:|:---:|:---:|
| View dashboard & analytics | ✅ | ✅ | ❌ |
| View/manage orders | ✅ | ✅ | ✅ (view + fulfill only) |
| Create/edit products | ✅ | ✅ | ✅ |
| Delete products | ✅ | ✅ | ❌ |
| Adjust inventory | ✅ | ✅ | ✅ (with reason required) |
| Process refunds | ✅ | ✅ | ❌ |
| Walk-in purchases (buy from customers) | ✅ | ✅ | ❌ |
| View customers | ✅ | ✅ | ❌ |
| Manage discount codes | ✅ | ✅ | ❌ |
| Manage staff accounts | ✅ | ❌ | ❌ |
| Clover settings | ✅ | ❌ | ❌ |
| View financial reports | ✅ | ❌ | ❌ |
| Export data (CSV) | ✅ | ✅ | ❌ |
| Manage drops | ✅ | ✅ | ✅ |
| Generate shipping labels | ✅ | ✅ | ✅ |

### Staff-Specific Features
- **Quick-switch:** PIN-based login for fast cashier switching (no full logout)
- **Activity log:** All staff actions logged (inventory changes, order updates)
- **Daily task checklist:** Opening/closing procedures shown in dashboard

---

## 11. Timeline

| Sprint | Weeks | Dates (Estimated) | Hours | Key Milestone |
|--------|-------|--------------------|-------|---------------|
| **Sprint 1** | 1-2 | Feb 17 – Mar 2 | ~31 | Security fixed, app safe for real money |
| **Sprint 2** | 3-4 | Mar 3 – Mar 16 | ~47 | Can ship orders + accept promo codes |
| **Sprint 3** | 5-6 | Mar 17 – Mar 30 | ~53 | Full inventory system + Clover sync |
| **Sprint 4** | 7-8 | Mar 31 – Apr 13 | ~41 | Store looks professional + iPad kiosk |
| **Sprint 5** | 9-10 | Apr 14 – Apr 27 | ~37 | Admin dashboard complete |
| **Sprint 6** | 11-12 | Apr 28 – May 11 | ~36 | Launch-ready, SEO, QA, onboarding |
| **Total** | 12 weeks | Feb 17 – May 11 | **~245 hrs** | 🚀 Launch |

### Budget Breakdown
- **Total budget:** $4,500
- **Total estimated hours:** ~245
- **Effective rate:** ~$18.37/hr
- **Contingency:** 10% buffer built into sprint estimates

### Milestones & Checkpoints
- **End of Sprint 1:** Dave can test checkout safely → get feedback
- **End of Sprint 2:** Dave can take his first real online order → soft launch to friends
- **End of Sprint 3:** Clover syncing → Dave starts using for real inventory
- **End of Sprint 4:** Soft launch to Instagram followers
- **End of Sprint 6:** Full public launch

---

## 12. Success Metrics

### Launch Criteria (Must Hit All)
- [ ] Zero security vulnerabilities (RLS fixed, stock validation, rate limiting)
- [ ] End-to-end checkout works (browse → cart → pay → confirmation email → order in admin)
- [ ] Shipping label generation works for at least FedEx Ground
- [ ] In-store pickup flow works with SMS notification
- [ ] Clover POS syncs inventory bidirectionally without data loss
- [ ] Dave can add products (sneakers with sizes, Pokemon cards with grading) in under 2 minutes
- [ ] Admin dashboard loads in under 3 seconds
- [ ] Mobile storefront scores 80+ on Lighthouse performance
- [ ] Dave has been onboarded and can operate independently

### Post-Launch Success (30-60 days)
- [ ] First 10 online orders processed without manual intervention
- [ ] Inventory stays in sync between website and Clover (< 2% discrepancy)
- [ ] Dave spends less time on order management than with Instagram/Zelle workflow
- [ ] At least 50 products listed with proper photos and pricing
- [ ] Zero customer complaints about checkout or payment issues
- [ ] Site uptime > 99.5%

### Long-Term Value
- Dave saves ~$140-300/mo vs. Shopify + BinderPOS + specialized tools
- Full ownership of platform and data
- Can evolve features as business grows without platform limitations
- Foundation for future features: loyalty program, live selling integration, multi-location

---

## Appendix: Quick Reference

### Key URLs
- **Store:** https://securedtampa.com
- **Admin:** https://securedtampa.com/admin
- **Kiosk:** https://securedtampa.com/kiosk (Sprint 4)

### Key API Accounts
- **Stripe:** Connected (via Clover bridge)
- **FedEx:** Account 201536679 (API configured)
- **Twilio:** +18628292840 (SMS configured)
- **Resend:** Configured for transactional email
- **StockX:** API key configured
- **Clover:** Awaiting Dave's merchant login

### Repository
- **Location:** `projects/dave-app/website/`
- **Framework:** Next.js 16.1.6
- **Deployment:** Vercel (assumed)

---

*This plan is a living document. Update as priorities shift or new requirements emerge.*
