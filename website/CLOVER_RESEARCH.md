# Clover POS API Integration Research — Dave App (Secured Tampa)

> **Date:** 2026-02-13  
> **Status:** Research Complete  
> **App Context:** Next.js website with Supabase backend, Stripe payments, sneaker/streetwear retail

---

## Table of Contents

1. [Existing Code Audit](#1-existing-code-audit)
2. [Clover REST API v3 — Key Endpoints](#2-clover-rest-api-v3--key-endpoints)
3. [Inventory Sync: Clover ↔ Supabase](#3-inventory-sync-clover--supabase)
4. [Clover Webhooks](#4-clover-webhooks)
5. [Item & Category Management](#5-item--category-management)
6. [Variants (Sneaker Sizes)](#6-variants-sneaker-sizes)
7. [Stripe Connect + Clover](#7-stripe-connect--clover)
8. [Real-Time Inventory Sync Strategy](#8-real-time-inventory-sync-strategy)
9. [Sandbox / Test Environment](#9-sandbox--test-environment)
10. [Rate Limits & Best Practices](#10-rate-limits--best-practices)
11. [Initial Sync Strategy](#11-initial-sync-strategy)
12. [Recommendations & Next Steps](#12-recommendations--next-steps)

---

## 1. Existing Code Audit

The Dave App already has **substantial Clover integration scaffolding**. Here's what exists:

### Files

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/clover.ts` | CloverClient class — full REST API wrapper | ✅ Complete |
| `src/lib/clover-sync.ts` | Bidirectional sync logic | ✅ Complete |
| `src/app/api/clover/oauth/route.ts` | OAuth callback handler | ✅ Complete |
| `src/app/api/clover/sync/route.ts` | Sync API routes (from/to/full/status/test) | ✅ Complete |
| `src/app/api/clover/webhook/route.ts` | Webhook receiver with HMAC verification | ✅ Complete |
| `src/app/admin/clover/page.tsx` | Admin UI — connection status, sync controls, mismatches | ✅ Complete |
| `src/app/api/admin/settings/clover/route.ts` | Settings API for Clover config | ✅ Exists |

### CloverClient (`src/lib/clover.ts`)

A well-built client class with:
- **Retry logic** with exponential backoff (handles 429s and 5xx)
- **Timeout support** (15s default)
- **Configurable environment** (sandbox/production)
- **Methods:** `getInventory()`, `getItem()`, `createItem()`, `updateItem()`, `updateStock()`, `getOrders()`, `getOrder()`, `getCategories()`, `createCategory()`, `testConnection()`
- **Factory functions:** `getCloverClient()` (reads from Supabase `clover_settings` table, falls back to env vars), `getCloverClientFromEnv()`

### Sync Logic (`src/lib/clover-sync.ts`)

- `syncFromClover()` — Pull all Clover items, match to Supabase products by `clover_item_id`, SKU, or barcode. Updates quantities and logs adjustments.
- `syncToClover(productId)` — Push single product to Clover. Creates or updates, stores `clover_item_id` link.
- `handleCloverSale(orderId)` — Deducts website inventory when Clover sale occurs.
- `handleWebsiteSale(productId, qty)` — Updates Clover stock when website sale occurs.
- `fullSync()` — Bidirectional: pulls from Clover (source of truth for stock), then pushes unlinked active website products to Clover.
- `getSyncStatus()` — Returns connection status, last sync time, and inventory mismatches.

### OAuth (`src/app/api/clover/oauth/route.ts`)

- Handles GET callback from Clover OAuth flow
- Exchanges authorization code for access token
- Stores in `clover_settings` Supabase table (deactivates previous settings)
- Currently hardcoded to sandbox URL (`https://sandbox.dev.clover.com/oauth/token`)

### Webhook Handler (`src/app/api/clover/webhook/route.ts`)

- Receives POST from Clover
- Verifies HMAC-SHA256 signature (if `webhook_secret` is set)
- Handles order webhooks: fetches full order from Clover, creates order record in Supabase, decrements product stock
- Generates order numbers with `SEC-` prefix
- Logs inventory adjustments with `clover_webhook` source

### Admin UI (`src/app/admin/clover/page.tsx`)

- Shows connection status (green/red indicator)
- Test Connection button
- Sync controls: From Clover, To Clover, Full Sync
- Shows sync results with summary stats
- Inventory mismatches table
- Setup instructions for merchants

### Supabase Schema (inferred)

- `clover_settings` table: `merchant_id`, `access_token`, `refresh_token`, `webhook_secret`, `is_active`, `last_sync_at`
- `products` table has: `clover_item_id`, `sku`, `barcode`, `quantity`, `name`, `price`, `is_active`
- `inventory_adjustments` table: `product_id`, `quantity_change`, `reason`, `previous_quantity`, `new_quantity`, `notes`, `adjusted_by`, `source`
- `orders` table has: `clover_order_id`, `sales_channel`, `order_number`, `items`, `subtotal`, `tax`, `shipping`, `total`

---

## 2. Clover REST API v3 — Key Endpoints

**Base URLs:**
- Sandbox: `https://apisandbox.dev.clover.com/v3/merchants/{mId}`
- Production (NA): `https://api.clover.com/v3/merchants/{mId}`
- Production (EU): `https://api.eu.clover.com/v3/merchants/{mId}`

**Auth:** Bearer token in Authorization header.

### Inventory

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/items` | GET | List all items (supports `?expand=itemStock&limit=500`) |
| `/items/{itemId}` | GET | Get single item |
| `/items` | POST | Create item (`name`, `price` in cents required) |
| `/items/{itemId}` | POST | Update item |
| `/items/{itemId}` | DELETE | Delete item |
| `/item_stocks/{itemId}` | POST | Update stock quantity |
| `/item_stocks/{itemId}` | GET | Get stock for item |
| `/categories` | GET/POST | List/create categories |
| `/categories/{catId}/items` | GET | Items in a category |
| `/item_groups` | GET/POST | Item groups (variants) |
| `/attributes` | POST | Create variant attributes (e.g., "Size") |
| `/attributes/{attrId}/options` | POST | Create options (e.g., "Size 10") |

### Orders

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders` | GET | List orders (`?expand=lineItems,payments`) |
| `/orders/{orderId}` | GET | Get single order |
| `/orders` | POST | Create order |
| `/orders/{orderId}/line_items` | POST | Add line item to order |
| `/atomic_order/orders` | POST | Create complete order atomically |

### Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/payments` | GET | List payments |
| `/payments/{paymentId}` | GET | Get payment details |
| `/refunds` | GET | List refunds |

### Customers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/customers` | GET/POST | List/create customers |
| `/customers/{custId}` | GET/POST/DELETE | CRUD on customer |

### Useful Query Parameters

- `?expand=itemStock,categories,modifierGroups` — Include related data
- `?filter=modifiedTime>={timestamp}` — Only items modified since X
- `?limit=100&offset=0` — Pagination (max 1000)
- `?orderBy=modifiedTime+DESC` — Sorting

---

## 3. Inventory Sync: Clover ↔ Supabase

### Current Implementation (Already Built ✅)

The app already implements bidirectional sync:

**Clover → Supabase (Pull):**
1. Fetch all Clover items with `?expand=itemStock`
2. Match to Supabase products by: `clover_item_id` > `sku` > `barcode`
3. Update quantity if different
4. Log adjustment to `inventory_adjustments` table
5. Update `last_sync_at` in `clover_settings`

**Supabase → Clover (Push):**
1. Find unlinked active products (no `clover_item_id`)
2. Create in Clover via POST `/items`
3. Store returned `clover_item_id` back in Supabase
4. Update stock via POST `/item_stocks/{itemId}`

**Full Sync:** Pull first (Clover = source of truth for stock), then push unlinked products.

### What's Missing / Could Improve

- **Pagination:** Current implementation uses `limit=500` which may miss items if inventory exceeds 500. Should paginate.
- **Conflict resolution:** Currently Clover always wins for stock counts. May want timestamp-based resolution.
- **Scheduled sync:** No cron/scheduled sync exists — only manual triggers from admin UI.
- **Name matching:** `findMatchingProduct` only matches by `clover_item_id`, `sku`, `barcode` — not by name (good, name matching is fragile).

---

## 4. Clover Webhooks

### Event Types Available

Clover webhooks notify on these categories:

| Category | Object Prefix | Events | Required Permission |
|----------|---------------|--------|-------------------|
| **Inventory** | `I:` | CREATE, UPDATE, DELETE on items | Read Inventory |
| **Orders** | `O:` | CREATE, UPDATE, DELETE on orders | Read Orders |
| **Payments** | `P:` | CREATE, UPDATE on payments | Read Payments |
| **Customers** | `C:` | CREATE, UPDATE, DELETE on customers | Read Customers |
| **Apps** | `A:` | App install/uninstall events | — |
| **Merchants** | `M:` | Merchant info updates | Read Merchant |

### Webhook Payload Format

```json
{
  "appId": "DRKVJT2ZRRRSC",
  "merchants": {
    "MERCHANT_ID": [
      {
        "objectId": "O:ORDER_ID",
        "type": "CREATE",
        "ts": 1537970958000
      }
    ]
  }
}
```

- `objectId` prefix indicates type: `O:` = Order, `I:` = Item, `P:` = Payment, `C:` = Customer
- `type`: CREATE, UPDATE, DELETE
- `ts`: Unix timestamp in milliseconds

### Setup Process

1. In Developer Dashboard → Your App → App Settings → Webhooks
2. Enter callback URL (must be HTTPS, publicly accessible)
3. Clover sends a POST with `{"verificationCode":"..."}` — echo it back to verify
4. Subscribe to event types (checkboxes)
5. Clover sends `X-Clover-Auth` header with auth code key for verification

### Current Implementation Notes

The existing webhook handler (`/api/clover/webhook/route.ts`):
- ✅ Verifies HMAC-SHA256 signature
- ✅ Handles order webhooks (fetches order, creates record, decrements stock)
- ⚠️ Webhook payload parsing assumes flat `{type, merchantId, objectId}` but Clover actually sends the nested merchants format shown above — **this needs fixing**
- ⚠️ Doesn't handle inventory update webhooks (just has a comment placeholder)
- ⚠️ Doesn't handle the verification code handshake for webhook setup

---

## 5. Item & Category Management

### Items

- Price is always in **cents** ($20.99 = 2099)
- Items have: `id`, `name`, `price`, `priceType` (FIXED/VARIABLE/PER_UNIT), `sku`, `code` (barcode), `hidden`, `colorCode`
- Default tax rates apply unless overridden
- Can assign items to categories via `/v3/merchants/{mId}/category_items`

### Categories

- Simple name-based grouping
- `POST /categories` with `{"name": "Sneakers"}`
- Associate items: `POST /v3/merchants/{mId}/category_items` with `{"elements": [{"category": {"id": "CAT_ID"}, "item": {"id": "ITEM_ID"}}]}`

---

## 6. Variants (Sneaker Sizes)

This is **critical** for the Dave App since sneakers come in multiple sizes.

### Clover's Variant System: Item Groups

Clover uses **Item Groups** (not modifiers) for true variants. Each variant combination becomes a **separate item** linked to the group.

#### How It Works

1. **Create Item Group** — e.g., "Nike Air Max 90"
   ```
   POST /v3/merchants/{mId}/item_groups
   {"name": "Nike Air Max 90"}
   → Returns group ID
   ```

2. **Create Attributes** — e.g., "Size"
   ```
   POST /v3/merchants/{mId}/attributes
   {"name": "Size", "itemGroup": {"id": "GROUP_ID"}}
   → Returns attribute ID
   ```

3. **Create Options** for each attribute — e.g., "8", "8.5", "9", "9.5", "10", etc.
   ```
   POST /v3/merchants/{mId}/attributes/{attrId}/options
   {"name": "10"}
   → Returns option ID
   ```

4. **Create Items** linked to the group — one per variant
   ```
   POST /v3/merchants/{mId}/items
   {"name": "Nike Air Max 90 - Size 10", "price": 15000, "itemGroup": {"id": "GROUP_ID"}}
   → Returns item ID
   ```

5. **Associate Items with Options**
   ```
   POST /v3/merchants/{mId}/option_items
   {"elements": [{"option": {"id": "OPT_ID"}, "item": {"id": "ITEM_ID"}}]}
   ```

#### Key Points for Sneakers

- Each size is a **separate Clover item** with its own `itemId` and stock count
- The item group links them visually on the POS
- You can have multiple attributes (Size + Color/Condition)
- Each item can have its own price (useful for different conditions: DS vs Used)
- **Stock is tracked per-variant** — Size 10 can be out of stock while Size 11 is available

#### Impact on Dave App

The current sync code treats each product as a single item. For size variants:
- Each Supabase product row would need to map to potentially **many** Clover items (one per size)
- OR: restructure Supabase to have a `product_variants` table with individual `clover_item_id` per size
- The `products` table could remain the parent, with variants tracking size + stock + clover link

---

## 7. Stripe Connect + Clover

### How They Coexist

**Clover and Stripe serve different channels:**

| Channel | Payment Processor | Flow |
|---------|------------------|------|
| **In-store (POS)** | Clover (Fiserv) | Clover device → Clover payment processing |
| **Online (Website)** | Stripe | Website → Stripe Checkout/Elements |

**They are NOT directly integrated.** Clover uses Fiserv as its payment processor for in-store transactions. Stripe handles online payments. They are separate payment rails.

### Integration Strategy

The integration happens at the **inventory/order level**, not payment level:

1. **Customer buys in-store** → Clover processes payment → Webhook fires → Dave App decrements website stock
2. **Customer buys online** → Stripe processes payment → Dave App calls Clover API to decrement POS stock
3. **Revenue reporting** → Combine Clover order data + Stripe payment data in Supabase for unified dashboard

### Stripe Connect Relevance

If the Dave App uses Stripe Connect (for marketplace features), it's independent of Clover. Stripe Connect handles:
- Multi-party payments (if Dave has multiple sellers)
- Platform fees

Clover has no awareness of Stripe Connect. The bridge is always your server-side code syncing inventory.

---

## 8. Real-Time Inventory Sync Strategy

### In-Store Sale → Website Stock Update

**Current flow (already built):**
1. Customer buys sneaker at Clover POS
2. Clover fires webhook to `/api/clover/webhook`
3. Webhook handler fetches full order from Clover API
4. Matches line items to Supabase products by `clover_item_id`
5. Decrements `quantity` in `products` table
6. Logs to `inventory_adjustments`

**Latency:** Clover webhooks typically fire within 1-5 seconds. Good enough for most cases.

### Online Sale → Clover Stock Update

**Current flow (already built in `handleWebsiteSale`):**
1. Customer completes Stripe checkout
2. Stripe webhook confirms payment
3. App calls `handleWebsiteSale(productId, qty)`
4. Fetches product's `clover_item_id` from Supabase
5. Calls `PUT /item_stocks/{itemId}` to update Clover stock

**Gap:** The Stripe webhook handler (`/api/webhooks/stripe/route.ts`) may or may not call `handleWebsiteSale` — this should be verified and wired up.

### Race Conditions

Potential issue: simultaneous in-store and online purchase of last item.

**Mitigation strategies:**
1. **Supabase RLS + transactions** — Use `UPDATE products SET quantity = quantity - 1 WHERE quantity > 0` (atomic decrement)
2. **Buffer stock** — Keep 1-2 units buffer (don't sell the absolute last unit online)
3. **Periodic reconciliation** — Run `syncFromClover()` on a schedule (every 15-30 min) to catch any drift

---

## 9. Sandbox / Test Environment

### URLs

- **API:** `https://apisandbox.dev.clover.com`
- **Dashboard:** `https://sandbox.dev.clover.com` (legacy) or `https://www.clover.com/global-developer-home`

### Setup

1. Create account at [Clover Global Developer Dashboard](https://www.clover.com/global-developer-home)
2. Create a test app
3. Create a test merchant
4. Generate a test API token (no OAuth needed in sandbox)
5. Use merchant ID + API token for API calls

### Key Differences from Production

- Sandbox uses **test API tokens** (don't expire) vs production **OAuth access + refresh tokens** (expire)
- No real payment processing
- Separate database — no crossover with production
- Same API endpoints, just different base URL

### Current App Status

The OAuth route is hardcoded to sandbox: `https://sandbox.dev.clover.com/oauth/token`  
The CloverClient supports both via `environment` option.  
**Action needed:** Make OAuth URL dynamic based on environment setting.

---

## 10. Rate Limits & Best Practices

### Rate Limits

| Level | Per-Second Limit | Concurrent Limit |
|-------|-----------------|-----------------|
| **Per token** | 16 requests/sec | 5 concurrent |
| **Per app** | 50 requests/sec | 10 concurrent |

### Handling 429 Errors

The existing `CloverClient` already implements retry with exponential backoff ✅

Response headers to check:
- `X-RateLimit-tokenLimit` / `X-RateLimit-crossTokenLimit`
- `X-RateLimit-tokenConcurrentLimit` / `X-RateLimit-crossTokenConcurrentLimit`
- `retry-after` (seconds to wait)

### Best Practices

1. **Use webhooks** instead of polling for real-time updates ✅ (already implemented)
2. **Cache data** in Supabase — don't re-fetch from Clover on every page load ✅
3. **Use `modifiedTime` filter** to only fetch changes since last sync
4. **Stagger requests** for bulk operations — don't fire 50 requests at once
5. **Backfill during off-peak hours** (overnight for initial sync)
6. **Use `expand` parameter** to reduce API calls (e.g., `?expand=itemStock` instead of separate call)
7. **Pagination:** Use `limit` + `offset` for large datasets (max 1000 per page)
8. **Use Export API** for historical orders/payments older than 2 months

---

## 11. Initial Sync Strategy (Import Clover Items into Supabase)

### Recommended Approach

```
Phase 1: Import Clover → Supabase (one-time)
Phase 2: Link existing Supabase products to Clover items
Phase 3: Enable webhooks for ongoing sync
```

### Phase 1: Full Import

1. **Fetch all categories:** `GET /categories`
2. **Fetch all items with expansions:** `GET /items?expand=itemStock,categories,itemGroup&limit=1000&offset=0`
   - Paginate if > 1000 items
   - Respect rate limits (16 req/sec per token)
3. **Fetch item groups** for variant info: `GET /item_groups?expand=items,attributes`
4. For each item:
   - Check if already exists in Supabase (by SKU, barcode, or name)
   - If exists: update `clover_item_id` link, sync stock
   - If new: create product in Supabase with Clover data

### Phase 2: Matching Strategy

Priority order for matching:
1. `clover_item_id` (exact, already linked)
2. `sku` match
3. `code` (barcode) match
4. Manual matching via admin UI for ambiguous cases

### Phase 3: Ongoing Sync

1. Configure webhook URL in Clover developer dashboard
2. Subscribe to: Inventory (CREATE, UPDATE, DELETE) + Orders (CREATE, UPDATE)
3. Set up scheduled full sync as safety net (every 30 min via cron)

### Estimated API Calls for Initial Sync

For a store with ~200 items:
- 1 call for categories
- 1 call for all items (under 500 limit)
- 1 call for item groups
- ~200 calls to update stock (if needed)
- **Total: ~203 calls** — well within rate limits, takes < 15 seconds

---

## 12. Recommendations & Next Steps

### Critical Fixes

1. **🔴 Fix webhook payload parsing** — Current handler expects flat `{type, merchantId, objectId}` but Clover sends nested `{appId, merchants: {mId: [{objectId, type, ts}]}}` format. This will cause webhook processing to silently fail.

2. **🔴 Wire up `handleWebsiteSale`** — Verify that the Stripe webhook handler calls `handleWebsiteSale()` after successful payment to update Clover stock.

3. **🟡 Make OAuth URL dynamic** — Currently hardcoded to sandbox. Should use `CLOVER_ENVIRONMENT` env var.

### Feature Additions

4. **🟡 Add variant support** — Implement Item Groups for sneaker sizes:
   - Add `product_variants` table in Supabase
   - Map each variant to a Clover item
   - Update sync logic to handle variant-level stock

5. **🟡 Add pagination** to `getInventory()` — Current `limit=500` may miss items.

6. **🟡 Add scheduled sync** — Cron job every 15-30 minutes as safety net.

7. **🟢 Add webhook verification handshake** — Endpoint to respond to Clover's initial verification code POST.

8. **🟢 Add `modifiedTime` filter** to sync — Only fetch items changed since last sync for efficiency.

9. **🟢 Add Export API usage** for historical order backfill.

### Environment Variables Needed

```env
# Required
CLOVER_MERCHANT_ID=your_merchant_id
CLOVER_API_TOKEN=your_api_token          # For sandbox/simple auth
CLOVER_ENVIRONMENT=sandbox               # or "production"

# OAuth (for merchant-initiated auth flow)
CLOVER_APP_ID=your_app_id
CLOVER_APP_SECRET=your_app_secret

# Webhook
CLOVER_WEBHOOK_SECRET=your_webhook_secret  # For HMAC verification
```

### Architecture Summary

```
┌─────────────┐     Webhook      ┌──────────────┐     Supabase     ┌──────────┐
│  Clover POS  │ ──────────────→ │  Dave App API │ ──────────────→ │ Supabase │
│  (In-Store)  │ ←────────────── │  (Next.js)    │ ←────────────── │   DB     │
└─────────────┘   REST API sync  └──────────────┘                  └──────────┘
                                        ↑
                                        │ Stripe Webhook
                                        │
                                 ┌──────────────┐
                                 │    Stripe     │
                                 │  (Online Pay) │
                                 └──────────────┘
```

---

*Research completed 2026-02-13. The Dave App has a solid Clover integration foundation — the main gaps are webhook payload format, variant support for sizes, and wiring up the Stripe→Clover stock update flow.*
