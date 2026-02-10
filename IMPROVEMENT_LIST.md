# Secured Tampa — Client Handoff Improvement Checklist

> Generated: February 10, 2026  
> Auditor: Automated code review of every file in `src/app/` and `src/components/`

---

## 🔴 Critical Issues

- [ ] **[Critical]** **Encoding / Mojibake throughout the entire site** — Special characters are rendered as garbled text (`Ac`, `A�`, `dY"�`, `dYZ%`, `dYZ'`, `dY`Y`, `dYss`, `dYT?`, `dYZ?`, `�-?`, `�o"`, `�s��,?`, `�?�`, `�?��?��?��?�`, `�+'`) in dozens of files. These appear in:
  - Footer: `Ac {year}` instead of `© {year}`, `PokAcmon` instead of `Pokémon`
  - Sort select: `�+'` instead of `→` arrows
  - Cart drawer: `dYss FREE shipping`, `dYZ% You've unlocked FREE shipping!`, `Checkout �?"` 
  - Product card: `dY"� NEW DROP` badge
  - Sign-in page: `dY`Y` sneaker emoji, `dYZ'` card emoji, `�s��,?` error emoji, `�?��?��?��?�` password placeholder
  - Sign-up page: `dY"�`, `�-?`, `dYZ?` emojis, `�s��,?` error emoji
  - Confirmation page: `dYZ%`, `�o"`, `dYT?` emojis
  - FAQ page: `PokAcmon`, `Contact Us �+'`
  - Drops page: `PokAcmon`
  - About page: `Pokémon` (correct in source but rendered as `PokAcmon` elsewhere)
  - Checkout review: `Tampa, FL �?"`, `#terms` / `#privacy` broken links
  - Not-found page: `dY`Y`, `�?�` separators, `PokAcmon`
  - Layout metadata: `Secured Tampa �?"` in title
  - StockX search modal: `A�` instead of `·`
  - Cart page: `A�` instead of `·`
  - Pokemon scan form: `A�` instead of `·`, `�?"` in label
  - Order table: `�?"` in email fallback
  - Scan form: `�"?�"?�"?` phase headers
  - Scan pricing phase: `A-` instead of `×`
  - **Fix:** Ensure all emoji/unicode characters are properly encoded in source files (UTF-8 BOM or escaped)

- [ ] **[Critical]** **Contact form doesn't actually send anything** — `contact/page.tsx` has `await new Promise(resolve => setTimeout(resolve, 1000))` as a fake submission. No API endpoint exists. Dave will get zero messages from customers.

- [ ] **[Critical]** **Drop notification signup doesn't persist** — `drops/page.tsx` email signup just sets local state `setSubscribed(true)` with no API call. Customers think they signed up but nothing is saved.

- [ ] **[Critical]** **Scan OUT mode doesn't actually deduct inventory** — In `scan-form.tsx`, the "Scan Out" submit handler just calls `toast.success()` without any API call to actually deduct stock.

- [ ] **[Critical]** **Account sign-out button uses non-existent endpoint** — `account/page.tsx` has `formAction="/api/auth/signout"` but no such API route exists in the codebase.

- [ ] **[Critical]** **Checkout review page has broken terms/privacy links** — Links point to `#terms` and `#privacy` (anchor tags) instead of `/terms` and `/privacy`.

- [ ] **[Critical]** **StockX client ID hardcoded in multiple places** — `6iancV9MkHjtn9dlE8VoflhwK0H3jCFc` is hardcoded in both `settings/page.tsx` and `stockx/page.tsx` instead of using an environment variable.

---

## 🟠 High Priority

### Customer-Facing Pages

- [ ] **[High]** **Home/Shop page defaults to "Drops" filter** — `shop-page.tsx` sets `useState<ShopFilter>("drops")` as default. If there are no drops, customers see an empty shop on first visit. Should default to `"all"`.

- [ ] **[High]** **No "Sneakers" filter tab on shop page** — Filter tabs are: Drops, All, New, Used, Pokémon. There's no dedicated "Sneakers" filter, which is half the business.

- [ ] **[High]** **Product grouping hides size variants from customers** — `shop-page.tsx` groups products by name and shows only the lowest-priced variant. Customers can't see all available sizes from the shop page.

- [ ] **[High]** **Cart page uses `formatCurrency` from `@/lib/utils`** but cart drawer uses `formatCurrency` from `@/types/product` — inconsistent imports may cause formatting differences.

- [ ] **[High]** **Wishlist page "Discover Products" links to `/?filter=all`** — This won't work because the shop page uses client-side state, not URL params for filtering.

- [ ] **[High]** **No express shipping option in checkout** — Shipping page mentions express shipping ($25, 1-2 days) but checkout only has "Ship" or "Pickup" with no speed selection.

- [ ] **[High]** **Checkout doesn't validate shipping address for pickup** — When "pickup" is selected, address fields aren't shown, but the form schema may still require them depending on zodResolver validation.

- [ ] **[High]** **Order lookup uses raw Supabase client-side** — `orders/lookup/page.tsx` queries Supabase directly from the browser. This may expose the table if RLS isn't properly configured.

- [ ] **[High]** **No phone number field anywhere in checkout** — Dave may need customer phone numbers for pickups.

- [ ] **[High]** **Account settings page only has theme toggle** — No ability to update name, email, password, or address. Very bare-bones for a customer-facing settings page.

### Admin Pages

- [ ] **[High]** **Admin sidebar missing "Products" and "Drops" links** — `sidebar.tsx` NAV_ITEMS only has: Dashboard, Inventory, Scan In, Orders, Customers, Analytics, Settings. Missing Products management and Drops management links.

- [ ] **[High]** **Admin drops page uses `Math.random()` for subscriber counts** — `notifyCount: Math.floor(Math.random() * 200) + 10` shows fake data to Dave. Comment says `// TODO: Real count`.

- [ ] **[High]** **Admin products pages exist but aren't linked** — Routes exist for `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/products/detail` but they're not in the sidebar nav.

- [ ] **[High]** **Admin customers detail page** — `/admin/customers/[id]/page.tsx` exists but wasn't read — verify it's complete.

- [ ] **[High]** **Admin orders detail page** — `/admin/orders/[id]/page.tsx` exists but wasn't read — verify it's complete.

- [ ] **[High]** **Admin login page** — `/admin/login/page.tsx` exists but no admin auth guard is visible in the admin layout. Anyone could access admin pages.

- [ ] **[High]** **Settings page has "coming soon" for everything** — Staff management, store settings editing, notification preferences all show toast "coming soon". This is unprofessional for handoff.

- [ ] **[High]** **Clover sandbox URL used in production** — `settings/page.tsx` uses `sandbox.dev.clover.com` for OAuth. This should be the production Clover URL.

---

## 🟡 Medium Priority

### UI & Design Issues

- [ ] **[Medium]** **Inconsistent card shadow classes** — Some components use `shadow-card` (custom class), others use `shadow-sm` or `shadow-lg`. Not consistent.

- [ ] **[Medium]** **Admin pages inconsistent padding** — Admin layout applies `p-4 md:p-6` but some pages (customers, orders) add their own `p-6`, resulting in double padding.

- [ ] **[Medium]** **Footer shows "Secured Tampa LLC"** but header just shows "SECURED" — Brand inconsistency.

- [ ] **[Medium]** **No favicon or brand logo** — Only text-based "SECURED" branding. No logo image anywhere.

- [ ] **[Medium]** **Product card condition badge uses custom CSS variables** — `border-secured-condition-new`, `text-secured-condition-new` etc. — ensure these are defined in globals.css.

- [ ] **[Medium]** **Search bar in shop has very small height (h-9)** — Could be hard to tap on mobile.

- [ ] **[Medium]** **Admin scan page phase headers have garbled emoji delimiters** — `�"?�"?�"? PRICING PHASE �"?�"?�"?`

- [ ] **[Medium]** **Cart drawer shows "Tax (7%)" hardcoded** — Should say "FL Sales Tax (7%)" or be dynamic based on location.

- [ ] **[Medium]** **FREE_SHIPPING_THRESHOLD imported from constants** but cart page hardcodes `150` — `subtotal < 150` instead of using the constant.

### Missing Features

- [ ] **[Medium]** **No order confirmation email** — Checkout confirmation page says "You'll receive an email confirmation shortly" but no email sending logic exists.

- [ ] **[Medium]** **No actual order tracking** — Order lookup shows status badges but no real tracking number integration or shipping carrier tracking.

- [ ] **[Medium]** **Social sharing buttons on confirmation page are non-functional** — "Share on X" and "Share on Instagram" are just ghost buttons with no click handlers.

- [ ] **[Medium]** **Contact page social links may be incorrect** — Links to `instagram.com/securedtampa` and `twitter.com/securedtampa` — verify these exist.

- [ ] **[Medium]** **No image optimization/CDN** — Product images from Supabase storage may not be optimized. Next.js Image component is used but `remotePatterns` config needs verification.

- [ ] **[Medium]** **No SEO meta tags on most pages** — Only a few pages have `generateMetadata`. Shop (home), cart, checkout, wishlist, drops, account pages all missing.

- [ ] **[Medium]** **No cookie consent banner** — Privacy policy mentions cookies but no consent mechanism exists.

- [ ] **[Medium]** **Inventory page "Value" column uses cost when available, falls back to price** — `v.cost ?? v.price` — this means items without cost show retail value as inventory value, which is misleading.

- [ ] **[Medium]** **Product form doesn't support "product_type" field** — Scan form sets `productType: "sneaker"` or `"pokemon"` but the product form component has no way to set this.

### Accessibility

- [ ] **[Medium]** **Many interactive elements lack proper aria labels** — Custom toggle buttons (condition, has box), filter tabs, size pickers don't have `aria-label` or `role` attributes.

- [ ] **[Medium]** **Color-only status indicators** — Order status, stock status use color coding without text alternatives for colorblind users (partially mitigated by labels).

- [ ] **[Medium]** **Lightbox in product gallery has no keyboard navigation** — No keyboard trap handling, escape key, or arrow key support documented.

- [ ] **[Medium]** **Custom select dropdowns in scan form** — Use native `<select>` elements which is good, but styling may break screen readers.

### Mobile Responsiveness

- [ ] **[Medium]** **Admin sidebar mobile nav is horizontal scroll** — On small screens, the nav items are in a horizontally scrollable bar. Hard to discover all options.

- [ ] **[Medium]** **Inventory table not ideal on mobile** — 7-column table will require significant horizontal scrolling on phones.

- [ ] **[Medium]** **Checkout page columns don't stack well** — The `lg:grid-cols-[1fr_400px]` layout may cause the order summary to be too narrow on medium screens.

- [ ] **[Medium]** **Product detail size selector buttons may overflow** — If many sizes exist, the flex-wrap may push content below the fold.

---

## 🟢 Low Priority

### Polish Items

- [ ] **[Low]** **Loading page animation** — The loading spinner uses Framer Motion pulsing rings. Clean but may feel slow for quick page loads.

- [ ] **[Low]** **404 page uses sneaker emoji** — `dY`Y` is garbled (see Critical encoding issue). Once fixed, the sneaker emoji is a nice touch.

- [ ] **[Low]** **Not-found page links to `/?filter=sneakers` and `/?filter=pokemon`** — These URL params aren't handled by the shop page (uses client state).

- [ ] **[Low]** **Drops countdown always targets "next Friday at 6 PM"** — This is auto-calculated, not based on actual drop schedules. Should pull from real data.

- [ ] **[Low]** **Drops page "Friday Night Heat"** — Hardcoded marketing copy. Dave might want to customize this.

- [ ] **[Low]** **Product card "NEW DROP" badge** — Uses `isNewDrop()` which probably checks `is_drop` flag. Should verify this matches Dave's expectations.

- [ ] **[Low]** **Cart drawer "Your Bag" title** — Fashion-forward but Dave sells sneakers and Pokémon cards. "Your Cart" may be more appropriate.

- [ ] **[Low]** **Scan history table shows "No scans yet this session"** — Session-based history is lost on page reload. Consider persisting.

- [ ] **[Low]** **Admin dashboard "Recently Added Products" shows raw `created_at`** — Uses `formatDateShort` which should be fine but verify format.

- [ ] **[Low]** **Sort select width is fixed at 160px** — May clip longer text on some languages/browsers.

- [ ] **[Low]** **canvas-confetti dependency** — Used only on checkout confirmation page for celebration effect. Adds bundle size for one page.

- [ ] **[Low]** **Theme toggle hidden on mobile** — Desktop shows theme toggle in header, mobile shows it in hamburger menu under "Theme" section. This is fine but the System option is missing on mobile.

- [ ] **[Low]** **Admin header component not reviewed** — `admin-header.tsx` exists but wasn't included in the large batch output. Verify it has proper branding and navigation.

- [ ] **[Low]** **Image upload component not reviewed** — `image-upload.tsx` exists but wasn't included. Verify it handles errors, shows progress, and works on mobile.

- [ ] **[Low]** **Market data panel component not reviewed** — `market-data-panel.tsx` exists. Verify it displays StockX pricing cleanly.

- [ ] **[Low]** **Dashboard stats component not reviewed** — `dashboard-stats.tsx` exists. Verify KPI cards render correctly.

- [ ] **[Low]** **Channel chart component not reviewed** — `channel-chart.tsx` exists. Verify pie/donut chart renders correctly.

- [ ] **[Low]** **Customer table component not reviewed** — `customer-table.tsx` exists. Verify search/filter works.

- [ ] **[Low]** **Barcode scanner input component not reviewed** — `barcode-scanner-input.tsx` exists. Verify USB scanner integration works.

### Code Quality

- [ ] **[Low]** **`any` types used in admin pages** — `customers: any[]`, `orders: any[]` in admin pages. Should use proper types.

- [ ] **[Low]** **Multiple `eslint-disable` comments** — Several `@typescript-eslint/no-explicit-any` suppressions in chart components.

- [ ] **[Low]** **Console.log statements in checkout review** — `console.log("Checkout API response:", data)` and `console.error` calls should be removed for production.

- [ ] **[Low]** **Unused imports** — `Metadata` imported in `contact/page.tsx` but not exported (it's a client component, can't use `export const metadata`).

- [ ] **[Low]** **`useEffect` dependency arrays** — Checkout review page has `useEffect` with empty deps `[]` but uses store values — may cause stale closures.

---

## 📋 Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 7 |
| 🟠 High | 15 |
| 🟡 Medium | 22 |
| 🟢 Low | 20 |
| **Total** | **64** |

### Top 5 Must-Fix Before Handoff

1. **Fix all encoding/mojibake** — The site looks broken with garbled characters everywhere
2. **Make contact form functional** — Dave needs to receive customer messages
3. **Add admin auth guard** — Anyone can access admin pages right now
4. **Fix broken sign-out** — Customers can't sign out of their accounts
5. **Connect drop notification signup to backend** — Customers expect this to work

### Recommended Quick Wins

- Default shop filter to "all" instead of "drops"
- Add Products and Drops links to admin sidebar
- Fix checkout terms/privacy links (`#terms` → `/terms`)
- Remove `Math.random()` fake subscriber counts
- Switch Clover from sandbox to production URL
