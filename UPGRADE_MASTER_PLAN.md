# SecuredTampa V2 — Master Upgrade Plan

## Printer
- **Epson TM-M30II-NT (M362C)** — USB + LAN, 3.13" thermal, ESC/POS, auto-cutter
- **Library:** `node-thermal-printer` (server-side via API route) — supports Epson ESC/POS natively
- **Fallback:** `window.print()` with CSS `@media print` receipt layout (if USB not connected)

## Stripe In-Store
- **Approach:** Stripe Checkout Session with `expires_at` set to 30 minutes
- Generate QR code client-side with `qrcode` npm library from the checkout session URL
- Customer scans QR on phone → pays via Stripe (Apple Pay, Google Pay, card all supported automatically)
- Webhook fires on success → order created, inventory decremented (same flow as online)
- **Timeout:** 30 minutes (Stripe minimum), then session auto-expires

## Ship-Only Toggle
- Add `inventory_location` column: `store` | `warehouse` (default: `store`)
- On scan-in page: toggle switch "Store" vs "Warehouse"
- Shop displays all products; warehouse products show fulfillment options
- Customer checkout: for ship-only items, choose "Ship to Home" or "Ship to Store"
- Ship-to-store = online payment → partner ships to Dave → Dave notifies customer for pickup

## Ticket System
- New `tickets` table in Supabase: id, customer_email, customer_name, subject, category, status (open/in_progress/resolved/closed), messages (jsonb array), attachments, created_at, updated_at
- Categories: Order Issue, Product Question, Authentication, General
- Customer-facing: floating help button bottom-right (not chat widget — ticket form)
- Admin: new "Tickets" tab in sidebar with unread count badge in header bell icon
- Email notifications both ways via Resend (customer gets reply, Dave gets new ticket)
- Customers can attach images (upload to Supabase Storage)

## IP Tracker / Visitor Globe
- Middleware captures visitor IP on every page load → stores in `visitors` table (ip, city, country, lat, lng, page, device, timestamp)
- Free geolocation via Vercel headers (`x-vercel-ip-city`, `x-vercel-ip-country`, `x-vercel-ip-latitude`, `x-vercel-ip-longitude`) — zero API calls needed
- Admin dashboard: new "Visitors" tab with `cobe` 3D globe + visitor table below
- Same style as Vantix globe (dark bg, orange arcs)

## Analytics Overhaul
Key metrics from Supabase order/visitor/product data:
- **Revenue:** Today / 7d / 30d / 90d / All with period comparison
- **Orders:** Total, by channel (web vs in-store), by status
- **AOV:** Average order value with trend
- **Conversion Rate:** Visitors → orders
- **Top Products:** By revenue and by units sold
- **Revenue by Category:** Sneakers vs Pokemon pie chart
- **Sales by Day of Week:** Bar chart (when does Dave sell most?)
- **Sales by Hour:** Heatmap (peak hours)
- **Inventory Turnover:** How fast products sell after being scanned in
- **Customer Metrics:** New vs returning, top customers by spend
- **Channel Split:** Online vs in-store revenue comparison
- **Profit Margins:** If cost data exists (sell price - cost price)
- **Geographic:** Where orders/visitors come from (state/city)

## UI Overhaul
- Reference: Nike.com + Adidas.com clean e-commerce
- Keep Broncos theme (#FB4F14 orange, #002244 navy)
- Mobile-first everything — Dave uses computer at counter, customers on phone
- Every button, every tab, every link verified working
- Admin sidebar: clean, every tab functional
- Shop: premium product grid, clean filters, fast loading

---

## Execution Plan — 6 Parallel Agents

### Agent 1: POS Scan-Out System
- New `/admin/pos` page (or section below scan-in on `/admin/scan`)
- Barcode scan → product lookup → popup with:
  - Product image, name, size
  - Cost price (from DB)
  - Sell price (editable input, defaults to product price)
  - Tax auto-calculated (FL rate)
  - Total
  - Payment method: [Cash] [Stripe QR]
- **Cash flow:** Enter amount received → show change → confirm → order created (status: paid, channel: in_store, payment: cash) → inventory decremented → receipt prints
- **Stripe QR flow:** Create Stripe Checkout Session → generate QR code → display on screen → customer scans and pays → webhook fires → order created → receipt auto-prints
- Receipt via API route → `node-thermal-printer` → Epson USB
- Receipt format: Store name, date, items, tax, total, payment method, "All Sales Final"

### Agent 2: Ticket System
- Supabase migration: `tickets` table + `ticket_messages` table
- Customer-facing: floating "Need Help?" button → slide-up form (name, email, category, subject, message, image upload)
- Admin: `/admin/tickets` page — list view with filters (open/resolved/all), detail view with message thread
- Reply from admin → email sent to customer via Resend
- Customer reply (via email link or ticket page) → notification to admin
- Bell icon in admin header with unread ticket count

### Agent 3: IP Tracker + Visitor Globe
- Next.js middleware to capture visitor data from Vercel headers
- Supabase `visitors` table (ip, city, country, region, lat, lng, page_path, user_agent, device_type, created_at)
- Admin: `/admin/visitors` page with:
  - 3D globe (cobe) with visitor dots
  - Stats row: Today's visitors, unique IPs, top country, top city
  - Table: Recent visitors with location, device, page, time

### Agent 4: Analytics Overhaul
- Rebuild `/admin/analytics` with comprehensive metrics
- Time period selector: Today / 7d / 30d / 90d / Custom
- Dashboard cards: Revenue, Orders, AOV, Conversion, Items Sold
- Charts: Revenue over time (area), orders by channel (bar), top products (horizontal bar), revenue by category (donut), sales by day/hour (heatmap), geographic (map)
- Customer insights: New vs returning, top spenders, LTV
- Inventory: Turnover rate, low stock alerts, dead stock
- All data from Supabase queries (orders + products + visitors)

### Agent 5: Ship-Only / Fulfillment Upgrade
- Add `inventory_location` enum column to products: `in_store` | `warehouse`
- Scan page: toggle for location when scanning in
- Shop: products show fulfillment badge ("In Store" / "Ships Direct")
- Checkout: ship-only items get shipping options (home delivery or ship-to-store pickup)
- Admin orders: show fulfillment source clearly

### Agent 6: Full UI Audit + Sync Check
- Every admin sidebar tab → verify page loads, data displays, actions work
- Every button on every page → verify it does what it says
- Every form → verify submission works and data saves
- Shop: every product card, filter, search, cart, checkout → verify flow
- Mobile: test every page at 375px
- Fix any broken links, dead buttons, mismatched data
- Polish UI to Nike/Adidas standard
- Ensure consistent styling (no mixed themes, no broken layouts)

---

## Database Migrations Needed
1. `tickets` table + `ticket_messages` table
2. `visitors` table
3. Add `inventory_location` column to `products` (default: 'in_store')
4. Add `payment_method` column to `orders` (cash/stripe/payment_link)
5. Add `cost_price` display support (already exists as `cost` on products)

## NPM Packages to Install
- `node-thermal-printer` — Epson ESC/POS receipt printing
- `qrcode` — QR code generation for Stripe payment links
- `cobe` — 3D globe visualization (already used in Vantix)

## Files Affected (Estimated)
- New pages: ~8 (POS, tickets admin, tickets customer, visitors, analytics rebuild)
- Modified pages: ~12 (scan, orders, sidebar, header, shop, checkout, product detail)
- New API routes: ~6 (POS sell, receipt print, tickets CRUD, visitors log, payment link)
- New components: ~15 (POS modal, receipt template, ticket form, globe, analytics charts)
- Migrations: 3 SQL files
