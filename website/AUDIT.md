# SecuredTampa (Dave App) — Full Codebase Audit

**Date:** February 12, 2026  
**Stack:** Next.js 16 / React 19 / Supabase / Stripe / Tailwind v4 / Zustand / Recharts  
**Domain:** securedtampa.com — Sneaker, streetwear & Pokémon card retail store

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [All Routes & Pages](#all-routes--pages)
3. [All Components](#all-components)
4. [Database Schema](#database-schema)
5. [API Routes](#api-routes)
6. [Feature Audit: What Works](#feature-audit-what-works)
7. [What's Broken / Risky](#whats-broken--risky)
8. [What's Missing](#whats-missing)
9. [What Needs Polish](#what-needs-polish)
10. [Comparison vs Shopify / Square / Lightspeed](#comparison-vs-shopify--square--lightspeed)
11. [Priority Recommendations](#priority-recommendations)

---

## Architecture Overview

| Layer | Tech |
|-------|------|
| Framework | Next.js 16.1.6 (App Router, RSC + Client Components) |
| Auth | Supabase Auth (email/password, role-based via `profiles` table) |
| Database | Supabase (PostgreSQL) with RLS |
| Payments | Stripe (PaymentIntents + Webhooks) |
| State | Zustand (cart, wishlist, cart-drawer, theme) |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Charts | Recharts |
| Email | Resend + Nodemailer |
| POS Integration | Clover (OAuth, sync, webhook) |
| Market Data | StockX API |
| Hosting | Unknown (likely Vercel) |

---

## All Routes & Pages

### Public Storefront
| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Homepage / Shop page (product grid with filters) |
| `/product/[id]` | `src/app/product/[id]/page.tsx` | Product detail page |
| `/cart` | `src/app/cart/page.tsx` | Cart page |
| `/checkout` | `src/app/checkout/page.tsx` | Checkout step 1 (contact + shipping) |
| `/checkout/review` | `src/app/checkout/review/page.tsx` | Checkout step 2 (Stripe payment) |
| `/checkout/confirmation` | `src/app/checkout/confirmation/page.tsx` | Order confirmation |
| `/wishlist` | `src/app/wishlist/page.tsx` | Wishlist (localStorage-based) |
| `/drops` | `src/app/drops/page.tsx` | Upcoming drops / releases |
| `/pokemon` | `src/app/pokemon/page.tsx` | Pokémon card hub |
| `/about` | `src/app/about/page.tsx` | About page |
| `/contact` | `src/app/contact/page.tsx` | Contact form |
| `/faq` | `src/app/faq/page.tsx` | FAQ |
| `/shipping` | `src/app/shipping/page.tsx` | Shipping policy |
| `/returns` | `src/app/returns/page.tsx` | Return policy |
| `/privacy` | `src/app/privacy/page.tsx` | Privacy policy |
| `/terms` | `src/app/terms/page.tsx` | Terms of service |
| `/orders/lookup` | `src/app/orders/lookup/page.tsx` | Guest order lookup |

### Auth
| Route | File | Description |
|-------|------|-------------|
| `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` | Sign in |
| `/auth/sign-up` | `src/app/auth/sign-up/page.tsx` | Sign up |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` | Password reset request |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` | Password reset |
| `/auth/callback` | `src/app/auth/callback/route.ts` | OAuth callback handler |

### Customer Account
| Route | File | Description |
|-------|------|-------------|
| `/account` | `src/app/account/page.tsx` | Account dashboard |
| `/account/orders` | `src/app/account/orders/page.tsx` | Order history |
| `/account/orders/[id]` | `src/app/account/orders/[id]/page.tsx` | Order detail |
| `/account/settings` | `src/app/account/settings/page.tsx` | Account settings |

### Admin Dashboard
| Route | File | Description |
|-------|------|-------------|
| `/admin` | `src/app/admin/page.tsx` | Dashboard (KPIs, charts, inventory overview) |
| `/admin/login` | `src/app/admin/login/page.tsx` | Admin login |
| `/admin/products` | `src/app/admin/products/page.tsx` | Product list |
| `/admin/products/new` | `src/app/admin/products/new/page.tsx` | Add product |
| `/admin/products/[id]/edit` | `src/app/admin/products/[id]/edit/page.tsx` | Edit product |
| `/admin/products/detail` | `src/app/admin/products/detail/page.tsx` | Product detail (admin) |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | Order list |
| `/admin/orders/[id]` | `src/app/admin/orders/[id]/page.tsx` | Order detail (status, ship, cancel) |
| `/admin/customers` | `src/app/admin/customers/page.tsx` | Customer list |
| `/admin/customers/[id]` | `src/app/admin/customers/[id]/page.tsx` | Customer detail |
| `/admin/inventory` | `src/app/admin/inventory/page.tsx` | Inventory management |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | Analytics (revenue, channels, AOV, day-of-week) |
| `/admin/scan` | `src/app/admin/scan/page.tsx` | Barcode scanner |
| `/admin/pokemon` | `src/app/admin/pokemon/page.tsx` | Pokémon card management |
| `/admin/drops` | `src/app/admin/drops/page.tsx` | Drop management |
| `/admin/stockx` | `src/app/admin/stockx/page.tsx` | StockX market data |
| `/admin/clover` | `src/app/admin/clover/page.tsx` | Clover POS integration |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Admin settings |

---

## All Components

### Admin (`src/components/admin/`)
- `admin-header.tsx` — Top bar for admin panel
- `sidebar.tsx` — Admin sidebar navigation
- `dashboard-stats.tsx` — KPI stat cards
- `revenue-chart.tsx` — Revenue over time chart
- `channel-chart.tsx` — Sales by channel pie chart
- `top-products.tsx` — Top-selling products chart
- `time-selector.tsx` — Period picker (today/7d/30d/90d)
- `order-table.tsx` — Orders data table
- `order-timeline.tsx` — Order status timeline
- `customer-table.tsx` — Customers data table
- `inventory-table.tsx` — Inventory data table
- `stock-adjust-modal.tsx` — Stock adjustment modal
- `product-form.tsx` — Product create/edit form
- `sealed-product-form.tsx` — Sealed product form (Pokémon)
- `image-upload.tsx` — Image upload component
- `scan-form.tsx` — Barcode scan form
- `scan-history-table.tsx` — Scan history
- `scan-result-card.tsx` — Scan result display
- `barcode-scanner-input.tsx` — Barcode input field
- `pokemon-card-search.tsx` — Pokémon TCG card search
- `pokemon-scan-form.tsx` — Pokémon card scan form
- `market-data-panel.tsx` — StockX market data panel
- `stockx-search-modal.tsx` — StockX search modal
- `size-variant-picker.tsx` — Size/variant picker

### Shop/Product (`src/components/product/` + `src/components/shop/`)
- `product-card.tsx` — Product card for grid
- `product-grid.tsx` — Product grid layout
- `product-grid-skeleton.tsx` — Loading skeleton
- `product-gallery.tsx` — Product image gallery
- `add-to-cart-button.tsx` — Add to cart button
- `wishlist-button.tsx` — Wishlist toggle button
- `shop-page.tsx` — Main shop page with filters
- `filter-tabs.tsx` — Category filter tabs
- `search-bar.tsx` — Product search bar
- `sort-select.tsx` — Sort dropdown
- `pokemon-hub.tsx` — Pokémon section

### Cart/Checkout (`src/components/cart/` + `src/components/checkout/`)
- `cart-drawer.tsx` — Slide-out cart drawer
- `checkout-progress.tsx` — Checkout step indicator

### Layout (`src/components/layout/`)
- `header.tsx` — Site header (sticky, responsive, theme toggle, auth menu)
- `footer.tsx` — Site footer
- `footer-wrapper.tsx` — Footer wrapper (hides on admin)

### UI (`src/components/ui/`) — shadcn/ui primitives
- alert-dialog, avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, select, separator, sheet, skeleton, sonner, switch, tabs, textarea

### Providers
- `theme-provider.tsx` — next-themes provider
- `toast-provider.tsx` — Sonner toast provider

---

## Database Schema

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Product catalog | name, price, cost, compare_at_price, quantity, images[], category_id, brand, size, condition, colorway, has_box, sku, barcode, is_drop, drop_date, is_featured, tags[], ebay/whatnot listing IDs |
| `categories` | Product categories | name, slug, image_url, sort_order, is_active |
| `customers` | Customer records | auth_user_id (FK→auth.users), email, first_name, last_name, phone, address (JSONB) |
| `orders` | Order records | order_number, customer_id, customer_email, sales_channel, items (JSONB), subtotal/tax/shipping/discount/total, status, fulfillment_type, shipping_address (JSONB), tracking_number, stripe_payment_id |
| `profiles` | User roles | auth_user_id (FK→auth.users), role (customer/owner/manager/staff) |

### Admin/Operational Tables
| Table | Purpose |
|-------|---------|
| `inventory_adjustments` | Audit log for all stock changes (reason, source, adjusted_by) |
| `daily_analytics` | Pre-aggregated daily sales metrics |
| `clover_settings` | Clover POS integration credentials |
| `contact_messages` | Contact form submissions |
| `drop_subscribers` | Email subscribers for drop notifications |
| `barcode_catalog` | Barcode lookup cache (migration 002) |
| `stockx_tokens` | StockX API tokens (migration 003) |

### RLS Policies
- Products: Public read, admin full CRUD, service_role full access
- Orders: Public read (⚠️ security concern), admin read/update, service_role full
- Customers: Own-record read only, admin read, service_role full
- Profiles: Own-record read, owner can read all
- Inventory adjustments: Admin read/insert
- Clover/Analytics: Owner only

### Helper Functions
- `is_admin_user()` — Checks if current user has owner/manager/staff role
- `is_owner_user()` — Checks if current user is owner
- `handle_new_user()` — Trigger: auto-creates profile with 'customer' role on signup

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/checkout` | POST | Create Stripe PaymentIntent |
| `/api/webhooks/stripe` | POST | Stripe webhook (payment_intent.succeeded → create order, decrement stock, sync Clover) |
| `/api/send-confirmation` | POST | Send order confirmation email |
| `/api/contact` | POST | Contact form submission |
| `/api/products` | GET | Public product listing |
| `/api/admin/products` | GET/POST | Admin product management |
| `/api/admin/products/drop` | POST | Drop product management |
| `/api/admin/analytics` | GET | Analytics data |
| `/api/admin/drop-subscribers` | GET | Drop subscriber list |
| `/api/admin/inventory/adjust` | POST | Inventory adjustment |
| `/api/admin/settings/clover` | GET/PUT | Clover settings |
| `/api/auth/role` | GET | Get user role |
| `/api/auth/signout` | POST | Sign out |
| `/api/clover/oauth` | GET | Clover OAuth flow |
| `/api/clover/sync` | POST | Sync inventory with Clover |
| `/api/clover/webhook` | POST | Clover webhook receiver |
| `/api/drops/subscribe` | POST | Email subscription for drops |
| `/api/notifications/subscribe` | POST | Push notification subscription |
| `/api/pokemon/search` | GET | Pokémon TCG card search |
| `/api/pokemon/card/[id]` | GET | Pokémon card detail |
| `/api/stockx/search` | GET | StockX product search |
| `/api/stockx/product/[id]` | GET | StockX product detail |
| `/api/stockx/market-data/[productId]/[variantId]` | GET | StockX market data |
| `/api/upc-lookup` | GET | UPC barcode lookup |
| `/api/upload/image` | POST | Image upload |
| `/stockx/callback` | GET | StockX OAuth callback |

---

## Feature Audit: What Works ✅

### Storefront
- ✅ **Product browsing** — Grid layout with category filter tabs, search bar, sort options
- ✅ **Product detail page** — Image gallery, add to cart, size display, condition badges
- ✅ **Cart** — Zustand-persisted cart with drawer + full page, quantity adjustment
- ✅ **Checkout flow** — 2-step (shipping info → Stripe payment), ship or pickup options
- ✅ **Stripe integration** — PaymentIntents, webhook-based order creation, auto inventory decrement
- ✅ **Wishlist** — Client-side wishlist with localStorage persistence
- ✅ **Auth** — Sign up, sign in, password reset, role-based access
- ✅ **Theme** — Dark/light/system mode toggle
- ✅ **Responsive header** — Mobile hamburger menu, sticky on scroll
- ✅ **Drop notifications** — Email subscription for upcoming drops
- ✅ **Contact form** — Working contact form
- ✅ **Policy pages** — Shipping, returns, privacy, terms, FAQ
- ✅ **Guest order lookup** — Look up order by email/number
- ✅ **Customer accounts** — Order history, account settings

### Admin Dashboard
- ✅ **Dashboard KPIs** — Revenue, orders, AOV, items sold with period-over-period comparisons
- ✅ **Inventory overview** — Total products, units, value (split by sneakers/Pokémon)
- ✅ **Revenue charts** — Area chart with web vs in-store stacking
- ✅ **Channel breakdown** — Pie chart (web vs in-store)
- ✅ **Top products** — Horizontal bar chart
- ✅ **Analytics page** — Full analytics with AOV trend, orders by day-of-week
- ✅ **Product CRUD** — Create, edit, delete products with image upload
- ✅ **Order management** — List, detail view, mark shipped (with tracking), cancel orders
- ✅ **Order timeline** — Visual status progression
- ✅ **Customer management** — List with aggregated spend, detail view with order history
- ✅ **Inventory management** — Stock adjust with audit log, search
- ✅ **Barcode scanning** — Scan to look up / add products
- ✅ **StockX integration** — Search, market data panel for pricing reference
- ✅ **Pokémon card tools** — TCG card search, scan form, sealed product form
- ✅ **Clover POS sync** — OAuth, inventory sync, webhook receiver
- ✅ **Role-based access** — owner/manager/staff/customer roles with RLS
- ✅ **Admin auth guard** — Layout-level redirect for unauthenticated users
- ✅ **Recently added products** — Dashboard widget

---

## What's Broken / Risky 🔴

### Security Issues
1. **Orders table RLS too permissive** — `CREATE POLICY "Users can view orders by email" ON orders FOR SELECT USING (true)` allows ANY user to read ALL orders. Should be scoped to `customer_email = auth.jwt()->>'email'` or similar.
2. **Stripe webhook `adjusted_by` type mismatch** — `adjusted_by` references `auth.users(id)` (UUID) but webhook inserts string `"stripe_webhook"`. This will fail the FK constraint.
3. **Stripe webhook `source` constraint violation** — Column has CHECK constraint allowing `('admin', 'clover_webhook', 'web_order')` but webhook inserts `"stripe_webhook"` which isn't in the allowed list.
4. **Checkout API doesn't validate stock** — No server-side check that items are in stock before creating PaymentIntent. Race condition: two customers can buy the last item.
5. **No CSRF protection on API routes** — API routes don't verify origin/referrer.
6. **Metadata truncation risk** — Stripe metadata values limited to 500 chars; `JSON.stringify(itemsData)` could exceed this for large orders.

### Functional Bugs
7. **Tax/shipping not stored correctly** — Webhook sets `tax: 0, shipping_cost: 0` hardcoded instead of using actual calculated values from the cart. The total is just `paymentIntent.amount / 100`.
8. **No email confirmation sent** — Webhook creates order but doesn't call `/api/send-confirmation`. Customer gets no notification.
9. **Cart doesn't clear on success** — After successful payment and redirect to confirmation page, the cart isn't programmatically cleared (depends on confirmation page implementation).
10. **Desktop checkout submit button uses `onClick` hack** — The desktop "Continue to Payment" button uses `onClick={handleSubmit(onSubmit)}` instead of being inside the form. May cause double-submission or form validation bypass.

---

## What's Missing 🟡

### Critical for a Real Store
| Feature | Shopify Has It | Square Has It | Status |
|---------|---------------|---------------|--------|
| **Discount codes / coupons** | ✅ | ✅ | ❌ Missing |
| **Refund processing** | ✅ | ✅ | ❌ Missing (status exists but no Stripe refund flow) |
| **Shipping label generation** | ✅ | ✅ | ❌ Missing (FedEx API keys exist in TOOLS.md but no integration) |
| **Email transactional flows** | ✅ | ✅ | ❌ Missing (order confirmation, shipping notification, etc.) |
| **Search/filter by multiple criteria** | ✅ | ✅ | ⚠️ Basic (single category tab + text search) |
| **Product variants (size/color matrix)** | ✅ | ✅ | ❌ Missing (size is a single text field, not a variant system) |
| **Inventory low-stock alerts** | ✅ | ✅ | ❌ Missing (threshold field exists but no notification) |
| **Tax calculation by jurisdiction** | ✅ | ✅ | ⚠️ Hardcoded 7% (Florida only) |
| **Shipping rate calculation** | ✅ | ✅ | ⚠️ Basic flat rate / free threshold |
| **Return/exchange workflow** | ✅ | ✅ | ❌ Missing |
| **Customer communication (email from admin)** | ✅ | ✅ | ❌ Missing |
| **Bulk product import/export** | ✅ | ✅ | ❌ Missing |
| **SEO (product structured data)** | ✅ | ✅ | ⚠️ Basic metadata only, no JSON-LD |
| **Sitemap.xml** | ✅ | ✅ | ❌ Missing |
| **Multi-image upload / reorder** | ✅ | ✅ | ⚠️ Unknown (image upload exists) |
| **Admin order creation (manual)** | ✅ | ✅ | ❌ Missing |
| **Print packing slip / invoice** | ✅ | ✅ | ❌ Missing |
| **Gift cards** | ✅ | ✅ | ❌ Missing |
| **Abandoned cart recovery** | ✅ | ❌ | ❌ Missing |
| **Customer groups / segments** | ✅ | ✅ | ❌ Missing |
| **Staff activity log** | ✅ | ✅ | ⚠️ Partial (inventory_adjustments only) |
| **Multi-currency** | ✅ | ✅ | ❌ Missing (USD only) |
| **Product reviews** | ✅ | ❌ | ❌ Missing |

### Nice-to-Have
| Feature | Notes |
|---------|-------|
| **Pagination** | Products and orders load all at once — no pagination |
| **Real-time inventory updates** | No Supabase Realtime subscriptions |
| **Push notifications** | API route exists but likely incomplete |
| **Social login** | OAuth callback exists but only email/password visible |
| **Admin audit log** | Only inventory adjustments logged, not order status changes |
| **Dashboard date range picker** | Only preset periods, no custom date range |
| **Export to CSV** | No data export for orders/customers/products |
| **Mobile admin** | Admin sidebar not optimized for mobile |
| **Batch order actions** | No bulk mark-shipped, bulk print labels |
| **Product collections/tags filtering** | Tags field exists but no tag-based filtering UI |
| **Related products** | No "you might also like" on product pages |
| **Recently viewed** | No recently viewed products tracking |
| **Address autocomplete** | No Google Places or similar integration |

---

## What Needs Polish 🟠

### UX/UI
1. **No category navigation page** — Homepage IS the shop; no dedicated `/shop` with sidebar filters
2. **No breadcrumbs** — Product pages lack breadcrumb navigation
3. **Loading states are skeleton-only** — No error states shown when API calls fail (empty catch blocks everywhere)
4. **Empty states** — No "No products found" message for search with no results shown
5. **Cart drawer** — Exists but unclear if it shows quantity controls or just a list
6. **Footer** — Exists but content not audited
7. **No product zoom** — Product gallery likely lacks pinch-to-zoom on mobile
8. **Checkout email stored in sessionStorage** — Lost if user refreshes or opens in new tab
9. **No order confirmation email template** — Resend is a dependency but likely basic

### Admin Dashboard
10. **Error handling** — All admin data fetches have empty `catch` blocks — errors silently swallowed
11. **No pagination on orders/customers/products** — Will be slow with growth
12. **Customer N+1 query** — `getAdminCustomers` does a separate query per customer for order aggregates
13. **Analytics computed client-side** — `daily_analytics` table exists but dashboard queries `orders` table directly
14. **No admin mobile responsive design** — Sidebar layout assumes desktop
15. **`any` types everywhere** — Orders/customers pages use `any[]` instead of proper types

### Code Quality
16. **No tests** — Zero test files
17. **No error boundary per page** — Only root `error.tsx`
18. **No rate limiting** — Public API routes have no rate limiting
19. **No input sanitization** — SQL injection protected by Supabase client, but no XSS protection on notes fields
20. **Inconsistent data fetching** — Mix of server actions and API routes for similar operations
21. **No caching strategy** — No `revalidate`, no `unstable_cache`, pages re-fetch on every load

---

## Comparison vs Shopify / Square / Lightspeed

### Admin Dashboard Quality
| Aspect | SecuredTampa | Shopify | Square | Lightspeed |
|--------|-------------|---------|--------|------------|
| Dashboard KPIs | ✅ Good | ✅ Excellent | ✅ Good | ✅ Good |
| Revenue charts | ✅ Good | ✅ Excellent | ✅ Good | ✅ Good |
| Real-time data | ❌ | ✅ | ✅ | ✅ |
| Customizable widgets | ❌ | ✅ | ❌ | ⚠️ |
| Mobile admin | ❌ | ✅ Native app | ✅ Native app | ✅ |
| Multi-location | ❌ | ✅ | ✅ | ✅ |
| Staff permissions | ⚠️ Basic roles | ✅ Granular | ✅ | ✅ |

**Score: 5/10** — Solid foundation but lacks depth. The charts and KPIs are genuinely good for a custom build, but missing the polish (export, drill-down, real-time) that pros expect.

### Shop UX
| Aspect | SecuredTampa | Shopify | Square | Lightspeed |
|--------|-------------|---------|--------|------------|
| Product browsing | ✅ Good | ✅ Excellent | ✅ Good | ✅ |
| Search | ⚠️ Basic text | ✅ Predictive | ✅ | ✅ |
| Filters | ⚠️ Category only | ✅ Multi-facet | ✅ | ✅ |
| Product variants | ❌ | ✅ Full matrix | ✅ | ✅ |
| Reviews | ❌ | ✅ | ❌ | ⚠️ |
| Wishlist | ✅ | ⚠️ Plugin | ❌ | ❌ |

**Score: 5/10** — Clean and functional but lacks the product discovery features customers expect.

### Checkout Flow
| Aspect | SecuredTampa | Shopify | Square | Lightspeed |
|--------|-------------|---------|--------|------------|
| Guest checkout | ✅ | ✅ | ✅ | ✅ |
| Saved addresses | ❌ | ✅ | ✅ | ✅ |
| Express checkout (Apple/Google Pay) | ❌ | ✅ | ✅ | ⚠️ |
| Discount codes | ❌ | ✅ | ✅ | ✅ |
| Order confirmation email | ❌ | ✅ | ✅ | ✅ |
| Shipping options | ⚠️ Flat rate | ✅ Carrier rates | ✅ | ✅ |
| Address validation | ❌ | ✅ | ✅ | ⚠️ |

**Score: 4/10** — The Stripe integration and step-by-step UI are polished, but missing table-stakes features (discounts, express pay, confirmation emails).

### Order Management
| Aspect | SecuredTampa | Shopify | Square |
|--------|-------------|---------|--------|
| View/filter/search | ⚠️ Filter by status | ✅ Full | ✅ |
| Status workflow | ✅ Good | ✅ Excellent | ✅ |
| Shipping labels | ❌ | ✅ Built-in | ✅ |
| Refunds | ❌ | ✅ | ✅ |
| Edit orders | ❌ | ✅ | ✅ |
| Partial fulfillment | ❌ | ✅ | ✅ |
| Batch actions | ❌ | ✅ | ✅ |
| Print invoices | ❌ | ✅ | ✅ |

**Score: 3/10** — Can view and mark orders as shipped. That's about it. No refund flow, no label printing, no batch operations.

### Customer Management
| Aspect | SecuredTampa | Shopify | Square |
|--------|-------------|---------|--------|
| Customer list | ✅ | ✅ | ✅ |
| Lifetime value | ✅ | ✅ | ✅ |
| Order history | ✅ | ✅ | ✅ |
| Segmentation | ❌ | ✅ | ✅ |
| Email customers | ❌ | ✅ | ✅ |
| Customer notes | ❌ | ✅ | ✅ |
| Merge duplicates | ❌ | ✅ | ❌ |

**Score: 4/10** — Basic CRM. Shows customer data but can't act on it.

### Reporting/Analytics
| Aspect | SecuredTampa | Shopify | Square | Lightspeed |
|--------|-------------|---------|--------|------------|
| Revenue over time | ✅ | ✅ | ✅ | ✅ |
| Sales by channel | ✅ | ✅ | ✅ | ✅ |
| Top products | ✅ | ✅ | ✅ | ✅ |
| AOV trend | ✅ | ✅ | ✅ | ✅ |
| Profit margins | ❌ | ✅ | ⚠️ | ✅ |
| Customer acquisition | ❌ | ✅ | ❌ | ⚠️ |
| Inventory reports | ❌ | ✅ | ✅ | ✅ |
| Export data | ❌ | ✅ | ✅ | ✅ |
| Custom reports | ❌ | ✅ | ⚠️ | ✅ |
| Scheduled reports | ❌ | ✅ | ✅ | ⚠️ |

**Score: 5/10** — Good visual charts but no profit analysis, no export, no drill-down.

### Overall Score: **4.3/10** compared to professional retail software

---

## Priority Recommendations

### 🔴 P0 — Fix Before Taking Real Orders
1. **Fix orders RLS policy** — Restrict to own orders or authenticated admin only
2. **Fix Stripe webhook FK/CHECK violations** — `adjusted_by` and `source` values need to match constraints
3. **Add stock validation before checkout** — Server-side check in `/api/checkout`
4. **Send order confirmation emails** — Wire up Resend in the webhook
5. **Fix tax/shipping in webhook** — Pass actual values through Stripe metadata or recalculate

### 🟠 P1 — Essential for Launch
6. **Discount/promo codes** — Add `discounts` table + checkout integration
7. **Refund flow** — Stripe refund API + order status update
8. **Order confirmation page** — Clear cart, show order details, provide tracking link
9. **Transactional emails** — Order confirmation, shipping notification, delivery
10. **Pagination** — Products, orders, customers
11. **Fix N+1 customer query** — Use a join or aggregate subquery

### 🟡 P2 — Important for Growth
12. **Product variants** — Size matrix with individual stock tracking
13. **Shipping label integration** — Use FedEx API (keys already available)
14. **Admin mobile responsiveness** — Collapsible sidebar, responsive tables
15. **CSV export** — Orders, customers, products
16. **Sitemap + JSON-LD** — SEO essentials
17. **Low-stock alerts** — Email/push when products hit threshold
18. **Address autocomplete** — Google Places API
19. **Error handling** — Replace empty catch blocks with user-facing error messages

### 🔵 P3 — Nice to Have
20. **Product reviews**
21. **Related products**
22. **Abandoned cart recovery**
23. **Apple Pay / Google Pay**
24. **Real-time inventory via Supabase Realtime**
25. **Admin activity log**
26. **Customer segmentation**
27. **Bulk product import (CSV)**
28. **Print packing slips**

---

## Summary

SecuredTampa has a **surprisingly solid foundation** for a custom-built retail app. The admin dashboard with Recharts visualizations, Clover POS sync, StockX market data integration, and Pokémon TCG tools are genuinely impressive domain-specific features that Shopify/Square don't offer out-of-the-box.

However, it's **not ready for production** due to security issues (orders RLS, webhook constraint violations) and missing table-stakes features (confirmation emails, refunds, discount codes). The checkout flow looks polished on the frontend but has backend gaps.

**Estimated effort to reach production-ready (P0+P1):** ~40-60 hours of development.
