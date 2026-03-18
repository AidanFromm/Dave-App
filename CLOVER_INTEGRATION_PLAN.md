# Clover POS Integration — Master Plan
### SecuredTampa.com → Replace Lightspeed, Full Clover Sync
**Date:** 2026-03-18 | **Status:** Planning

---

## A. Current State Audit

### What Already Exists in Code ✅
The codebase already has **significant Clover scaffolding** built (from Feb 2026):

| Component | File | Status |
|-----------|------|--------|
| **Clover API Client** | `src/lib/clover.ts` | ✅ Full REST wrapper with retry/backoff |
| **Bidirectional Sync** | `src/lib/clover-sync.ts` | ✅ Pull from Clover, push to Clover, full sync |
| **OAuth Handler** | `src/app/api/clover/oauth/route.ts` | ⚠️ Hardcoded to sandbox URL |
| **Sync API Routes** | `src/app/api/clover/sync/route.ts` | ✅ From/to/full/status/test endpoints |
| **Webhook Handler** | `src/app/api/clover/webhook/route.ts` | ⚠️ Wrong payload format (see bugs below) |
| **Admin UI** | `src/app/admin/clover/page.tsx` | ✅ Connection status, sync controls, mismatch viewer |
| **Settings API** | `src/app/api/admin/settings/clover/route.ts` | ✅ CRUD for Clover config |

### Database Schema (Supabase)
- **822 products** in `products` table — all have SKU + barcode, none linked to Clover yet (`clover_item_id` = null for all)
- **2 orders** in `orders` table
- **`clover_settings` table** exists but is empty (no Clover connection yet)
- **`inventory_adjustments` table** exists for audit trail
- Products have: `id, name, price, quantity, sku, barcode, clover_item_id, category_id, condition, size, brand, images, is_active`

### Known Bugs to Fix 🔴
1. **Webhook payload parsing is WRONG** — Handler expects flat `{type, merchantId, objectId}` but Clover actually sends nested format: `{appId, merchants: {MERCHANT_ID: [{objectId: "O:ORDER_ID", type: "CREATE", ts: 1234}]}}`
2. **OAuth URL hardcoded to sandbox** — `https://sandbox.dev.clover.com/oauth/token` needs to be dynamic
3. **Stripe → Clover stock sync not wired** — When someone buys online via Stripe, Clover stock doesn't get updated
4. **Inventory sync uses `limit=500`** — Dave has 822 products, this will miss 322 of them
5. **No webhook verification handshake** — Clover sends a verification POST when first setting up webhooks that needs to be echoed back

### Stripe Integration Status
- Stripe webhook handler exists at `src/app/api/webhooks/stripe/route.ts`
- Handles `checkout.session.completed` — creates orders, decrements stock
- Does NOT call `handleWebsiteSale()` to update Clover stock ← **needs wiring**

---

## B. Architecture

```
                    ┌─────────────────────┐
                    │     SUPABASE        │
                    │  (Source of Truth)   │
                    │                     │
                    │  products (822)     │
                    │  orders             │
                    │  inventory_adj      │
                    │  clover_settings    │
                    └──────┬──────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────┐
     │   CLOVER   │ │  WEBSITE  │ │  ADMIN   │
     │   (POS)    │ │  (Shop)   │ │ Dashboard│
     │            │ │           │ │          │
     │ In-store   │ │  Online   │ │ Manage   │
     │ sales      │ │  sales    │ │ inventory│
     │ Labels     │ │  Stripe   │ │ Reports  │
     └────────────┘ └───────────┘ └──────────┘

     FLOW:
     In-store sale → Clover webhook → Supabase stock -1 → Website reflects
     Online sale → Stripe webhook → Supabase stock -1 → Clover API stock -1
     New product → Admin adds to Supabase → Auto-push to Clover inventory
     Label print → From Clover POS (built-in) or Admin dashboard
```

**Key Principle:** Supabase is the single source of truth. Both Clover and the website read/write to Supabase, with sync keeping Clover's inventory mirrored.

---

## C. Implementation Plan

### Phase 1: Clover Connection Setup (Aidan does this)
**Time: ~30 minutes**

1. **Create a Clover Developer Account** at https://www.clover.com/global-developer-home
2. **Create a Clover App** in the developer dashboard:
   - App Name: "Secured Tampa Sync"
   - Permissions needed: Read/Write Inventory, Read/Write Orders, Read/Write Merchant, Read Payments
   - Set Web URL: `https://securedtampa.com/api/clover/oauth`
   - Set Webhook URL: `https://securedtampa.com/api/clover/webhook`
3. **Install the app on Dave's merchant** — this triggers OAuth and gives us the access token
4. **Get these values and send them to me:**
   - `APP_ID` (from developer dashboard)
   - `APP_SECRET` (from developer dashboard)
   - `MERCHANT_ID` (from Dave's Clover dashboard URL)
   - The Clover hardware model Dave has (Station/Mini/Flex)

### Phase 2: Fix Bugs + Wire Everything (I do this)
**Time: ~2-3 hours**

1. **Fix webhook payload parsing** — Parse the nested `merchants` format correctly
2. **Add webhook verification handshake** — Echo back `verificationCode` on initial POST
3. **Make OAuth URL dynamic** — Use `CLOVER_ENVIRONMENT` env var
4. **Fix inventory pagination** — Paginate past 500 items
5. **Wire Stripe → Clover** — After Stripe webhook processes a sale, call Clover API to decrement stock
6. **Add scheduled sync cron** — Every 15 min safety net via Supabase pg_cron or Vercel cron

### Phase 3: Initial Inventory Sync (After connection)
**Time: ~1 hour**

1. Push all 822 Supabase products to Clover via the admin sync UI
2. Match by SKU/barcode where possible
3. Verify stock counts match on both sides
4. All products get `clover_item_id` stored in Supabase

### Phase 4: Label Printing
**Time: ~1-2 hours**

**Option A: Clover-native (recommended if Dave has a label printer connected to Clover)**
- Clover can print item labels from the POS
- Supports barcode + name + price on label
- Works with most Dymo/Zebra printers via Clover's Print app
- No code needed — just configure in Clover settings

**Option B: Web-based (if Dave wants to print from the admin dashboard)**
- Add a "Print Label" button to admin product list
- Generate barcode image (Code128 or UPC) + product name + price + size
- Browser print dialog → label printer
- Libraries: `bwip-js` for barcode generation, CSS print media query for label format

**Recommended label printers for Clover:**
- **Dymo LabelWriter 450/550** (~$60-80) — most popular, works with Clover
- **Zebra ZD220** (~$200) — industrial grade, faster
- **Brother QL-800** (~$70) — good middle ground

**Label format for used sneakers:**
```
┌─────────────────────────┐
│ [BARCODE]               │
│ FZ1233-002              │
│ Nike SB Dunk Low        │
│ Size: 10 | Used         │
│ $149.99                 │
│ SECURED TAMPA           │
└─────────────────────────┘
```

### Phase 5: Admin Dashboard Updates
**Time: ~2-3 hours**

- Unified sales view (online + in-store in same table)
- Filter by channel: Website / Clover / All
- Revenue breakdown by channel
- Inventory sync status widget on main dashboard

### Phase 6: Lightspeed Decommission
**Time: ~1 hour**

1. Export all remaining Lightspeed data (orders, customer history)
2. Import any missing products/history into Supabase
3. Disable Lightspeed POS on Clover hardware
4. Remove Lightspeed subscription
5. Dave starts using Clover exclusively

---

## D. What Aidan Needs to Do

### Before I can start coding:
1. ☐ **Create Clover developer account** → https://www.clover.com/global-developer-home
2. ☐ **Create app** with permissions: Inventory R/W, Orders R/W, Merchant R/W, Payments R
3. ☐ **Send me:** APP_ID, APP_SECRET, MERCHANT_ID
4. ☐ **Ask Dave:** What label printer does he have (or does he need one)?
5. ☐ **Ask Dave:** What Clover hardware model? (Station, Mini, Flex, Station Duo?)

### Vercel Environment Variables to set:
```
NEXT_PUBLIC_CLOVER_APP_ID=<from step 2>
CLOVER_APP_SECRET=<from step 2>
CLOVER_MERCHANT_ID=<Dave's merchant ID>
CLOVER_ENVIRONMENT=production
```

### After initial sync:
6. ☐ **Dave tests:** Sell something on Clover → verify website stock updates
7. ☐ **Dave tests:** Buy something on website → verify Clover stock updates
8. ☐ **Dave tests:** Print a label from Clover

---

## E. Technical Specs

### API Endpoints (existing + new)
| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/clover/oauth` | GET | OAuth callback | ⚠️ Fix sandbox URL |
| `/api/clover/webhook` | POST | Receive Clover events | ⚠️ Fix payload parsing |
| `/api/clover/sync` | POST | Manual sync triggers | ✅ Exists |
| `/api/clover/labels` | POST | Generate label PDF | 🆕 New (Phase 4B only) |

### Database Changes Needed
- None — schema already has `clover_item_id`, `clover_settings`, `inventory_adjustments`
- Optional: Add `clover_last_sync_at` to products table for per-item sync tracking

### Environment Variables
```env
NEXT_PUBLIC_CLOVER_APP_ID=       # Clover App ID (safe for client)
CLOVER_APP_SECRET=               # Clover App Secret (server only)
CLOVER_MERCHANT_ID=              # Dave's merchant ID
CLOVER_ENVIRONMENT=production    # "sandbox" or "production"
CLOVER_WEBHOOK_SECRET=           # From Clover app settings (optional but recommended)
```

---

## F. Timeline

| Phase | What | Time | Who |
|-------|------|------|-----|
| 1 | Clover account + app setup | 30 min | Aidan |
| 2 | Fix bugs + wire sync | 2-3 hrs | Vantix |
| 3 | Initial inventory sync | 1 hr | Vantix + Dave verify |
| 4 | Label printing | 1-2 hrs | Vantix |
| 5 | Dashboard updates | 2-3 hrs | Vantix |
| 6 | Lightspeed decommission | 1 hr | Dave |
| **Total** | | **~8-10 hrs** | |

Can realistically be done in **2-3 days** if credentials come quick.

---

## G. Risks & Gotchas

1. **Race condition on last item** — Simultaneous in-store + online sale of last unit. Mitigation: atomic decrements in Supabase (`quantity = quantity - 1 WHERE quantity > 0`), already partially implemented.

2. **Webhook delivery failures** — Clover webhooks can fail/delay. Mitigation: scheduled 15-min full sync as safety net catches any drift.

3. **Clover rate limits** — 16 req/sec per token, 50/sec per app. With 822 products, initial sync takes ~50 seconds. Not a problem.

4. **Used sneakers are one-of-a-kind** — Each used pair is unique (different condition/wear). They map 1:1 as individual products with qty=1. No variant/size grouping needed for used. New sneakers may need size variants if Dave stocks multiple sizes of the same shoe.

5. **Clover offline mode** — If Clover loses internet, sales still process locally but webhooks won't fire until reconnection. The scheduled sync catches these.

6. **Payment processors are separate** — Clover uses Fiserv for in-store card processing, Stripe handles online. Revenue reporting needs to pull from both. This is normal and by design — don't try to route Clover payments through Stripe.

7. **Existing Lightspeed data** — Need to confirm with Dave if there's historical data in Lightspeed that needs migrating (past orders, customer records) before cutting over.
