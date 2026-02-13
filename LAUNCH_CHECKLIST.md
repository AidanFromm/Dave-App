# SecuredTampa — Production Launch Checklist

> **Stack:** Next.js · Supabase · Stripe · Vercel  
> **Domain:** securedtampa.com  
> **Business:** Sneaker & Pokémon card resale (Florida-based)  
> **Last updated:** 2026-02-13

---

## Priority Legend

| Icon | Meaning |
|------|---------|
| 🔴 | **MUST-HAVE** — Cannot launch without this |
| 🟡 | **SHOULD-HAVE** — Launch is risky without it |
| 🟢 | **NICE-TO-HAVE** — Add post-launch |

---

## 1. Legal Compliance

### Privacy Policy 🔴
- [ ] Create a Privacy Policy page at `/privacy`
- [ ] **Must cover:**
  - What personal data is collected (name, email, address, payment info, browsing data)
  - How data is used (order fulfillment, marketing, analytics)
  - Third parties receiving data (Stripe, Vercel Analytics, shipping providers, Google/Meta)
  - Cookie usage and tracking technologies
  - Data retention periods
  - User rights (access, deletion, correction)
  - Contact information for privacy inquiries
- [ ] **CCPA compliance** (California customers):
  - "Do Not Sell My Personal Information" link in footer
  - Right to know what data is collected
  - Right to delete personal data
  - Right to opt out of data sale
  - Cannot discriminate against users who exercise rights
  - Must respond to requests within 45 days
- [ ] **GDPR** (if selling internationally):
  - Explicit consent for data processing
  - Right to data portability
  - Right to be forgotten
  - Data Processing Agreement (DPA) with all processors
  - Cookie consent before non-essential cookies fire
  - **Recommendation:** If not selling outside the US initially, add a geo-block or note "US customers only" and revisit GDPR later

### Terms of Service 🔴
- [ ] Create ToS page at `/terms`
- [ ] **Essential clauses for resale shop:**
  - **Authenticity guarantee** — All items guaranteed authentic; describe verification process
  - **All sales final / limited returns** — Clear and conspicuous (see Return Policy below)
  - **Condition descriptions** — Define your grading system (DS, VNDS, Used, etc.)
  - **Pricing disclaimer** — Prices subject to change; market-value based
  - **Order cancellation policy** — Timeframe for cancellation (if any)
  - **Account terms** — Age requirement (18+), accurate info, one account per person
  - **Prohibited conduct** — No bots, no fraud, no chargebacks
  - **Intellectual property** — You don't own Nike/Pokémon trademarks; you're an authorized reseller of authentic goods
  - **Limitation of liability** — Cap liability at purchase price
  - **Dispute resolution** — Arbitration clause with Florida jurisdiction
  - **Governing law** — State of Florida
  - **Indemnification** — Users indemnify you against misuse claims
  - **Modification clause** — Right to update terms with notice

### Return / Refund Policy 🔴
- [ ] Create policy page at `/returns`
- [ ] **Industry standard for sneaker resale:**
  - **All sales are final** — This is standard for sneaker resale (StockX, GOAT, eBay sneaker sales)
  - **Exceptions:** Item not as described, wrong item shipped, item damaged in transit
  - **Refund method:** Original payment method via Stripe refund
  - **Timeframe for claims:** 48-72 hours after delivery with photo evidence
  - **Pokémon cards:** All sales final; document card condition with photos pre-shipment
  - **Chargebacks:** Warn that fraudulent chargebacks will be pursued
- [ ] Display policy prominently at checkout (checkbox acknowledgment recommended)

### Cookie Consent Banner 🟡
- [ ] **Yes, you need one if:**
  - Using Google Analytics, Meta Pixel, or any non-essential cookies
  - Selling to California residents (CCPA) or EU (GDPR)
- [ ] Implement a cookie consent banner (libraries: `cookie-consent-banner`, `react-cookie-consent`)
- [ ] Categories: Essential (always on), Analytics, Marketing
- [ ] Don't fire GA4 or Meta Pixel until user consents to those categories
- [ ] Store consent preference in cookie/localStorage

### ADA / WCAG Accessibility 🟡
- [ ] Target **WCAG 2.1 Level AA** (legal standard for most ADA e-commerce lawsuits)
- [ ] Key requirements:
  - All images have descriptive `alt` text
  - Color contrast ratio ≥ 4.5:1 for text
  - Keyboard navigable (tab through all interactive elements)
  - Form inputs have associated labels
  - Error messages are descriptive and associated with fields
  - Skip navigation link
  - Responsive/mobile-friendly
  - Video/audio has captions (if applicable)
- [ ] Run automated audit: Lighthouse Accessibility, axe DevTools, WAVE
- [ ] **Why this matters:** E-commerce ADA lawsuits have exploded; small businesses are targets. A basic WCAG AA pass is strong defense.

---

## 2. Payment & Tax

### Florida Sales Tax 🔴
- [ ] **Florida requires sales tax collection on online sales**
  - Current rate: **6% state** + county surtax (varies, 0.5%–2.5%)
  - Tampa (Hillsborough County): **7.5% total** (6% state + 1.5% county)
- [ ] Register for a Florida Sales Tax Certificate (Florida Dept. of Revenue, Form DR-1)
- [ ] File and remit sales tax (monthly, quarterly, or annually depending on volume)
- [ ] Clothing/shoes **are taxable** in Florida (no clothing exemption like some states)
- [ ] Trading cards / collectibles **are taxable** in Florida

### Tax Nexus — Other States 🟡
- [ ] **Post-South Dakota v. Wayfair (2018):** States can require sales tax from online sellers exceeding thresholds
- [ ] **Common thresholds:** $100K in sales OR 200 transactions in a state per year
- [ ] **Practical approach for a new store:**
  - Start by collecting Florida tax only
  - Once you approach $100K total revenue, implement multi-state tax
  - Use **Stripe Tax** or **TaxJar** to automate multi-state calculation
- [ ] Enable **Stripe Tax** when ready (automatic calculation, filing reports)
- [ ] Keep records of sales by state from day one

### Stripe Setup Checklist 🔴
- [ ] **Account setup:**
  - Business type: Sole Proprietor or LLC (whichever Dave has)
  - Business category: Retail → Clothing/Shoes/Accessories
  - Bank account connected for payouts
  - Enable 2FA on Stripe Dashboard
- [ ] **Payment methods:**
  - Cards (Visa, MC, Amex, Discover)
  - Apple Pay / Google Pay (via Stripe Payment Element — nearly free to enable)
  - Consider Afterpay/Klarna for higher-value sneakers 🟢
- [ ] **Webhooks** (critical):
  - `checkout.session.completed` → Create order, send confirmation email
  - `payment_intent.succeeded` → Update order status
  - `payment_intent.payment_failed` → Notify customer, update order
  - `charge.refunded` → Update order status, notify customer
  - `charge.dispute.created` → Alert Dave immediately (chargeback)
  - `customer.subscription.*` → If any subscription features
  - Verify webhook signatures with `STRIPE_WEBHOOK_SECRET`
- [ ] **Fraud prevention:**
  - Enable **Stripe Radar** (included free, blocks known frauds)
  - Set Radar rules:
    - Block if CVC check fails
    - Block if ZIP/postal code check fails
    - Review if order > $500 (high-value sneakers)
    - Block if >3 failed payment attempts in 1 hour
  - Enable 3D Secure for high-risk transactions
- [ ] **Other settings:**
  - Set payout schedule (daily or weekly)
  - Enable receipt emails from Stripe (or handle via Resend)
  - Set statement descriptor: `SECUREDTAMPA` (13 char max)
  - Configure Stripe Customer Portal for order history 🟢

### PCI Compliance 🔴
- [ ] **Using Stripe Elements/Checkout = PCI SAQ-A** (simplest level)
  - Card data never touches your server
  - Stripe handles all PCI requirements
- [ ] **Your responsibilities:**
  - Use HTTPS everywhere (Vercel handles this)
  - Never log or store card numbers
  - Keep Stripe.js loaded from `js.stripe.com` (never self-host)
  - Use Stripe's hosted payment fields (Payment Element or Checkout)
  - Complete Stripe's PCI self-assessment questionnaire annually (Dashboard → Settings → Compliance)

---

## 3. Shipping

### Shipping Platform Comparison 🟡

| Feature | **Pirate Ship** | **GoShippo** | **ShipStation** |
|---------|-----------------|--------------|-----------------|
| **Cost** | Free (no markup, no monthly fee) | Free tier + $10/mo+ | $25/mo+ |
| **Best for** | Small shops, cheapest labels | API integration, dev-friendly | High volume, multi-channel |
| **Carriers** | USPS, UPS | USPS, UPS, FedEx, DHL | All major carriers |
| **API** | Limited | Full REST API | Full REST API |
| **Insurance** | Via Shipsurance, cheap | Built-in option | Built-in option |
| **Ease** | Dead simple web UI | Good API docs | Feature-rich dashboard |
| **Recommendation** | **Start here** | Upgrade when you need API | Overkill for launch |

**Recommendation:** Start with **Pirate Ship** for cost savings. Move to **GoShippo** when you need API-driven label generation from the app.

### Insurance for High-Value Items 🔴
- [ ] **Insure all sneakers shipped over $200**
- [ ] Options:
  - **Carrier insurance:** USPS up to $5K, UPS/FedEx built-in
  - **Third-party (cheaper):** Shipsurance (via Pirate Ship), ParcelGuard, Route
  - **Route** — Customer-facing package protection at checkout (customer pays ~1-2%)
- [ ] For Pokémon cards: Use rigid mailer + bubble wrap; insure anything over $50

### Signature Required 🔴
- [ ] **Require signature for orders over $250** (matches Stripe/PayPal chargeback protection thresholds)
- [ ] USPS Signature Confirmation: ~$3.45
- [ ] UPS/FedEx: Included in many services or ~$5
- [ ] **For orders over $750:** Consider Adult Signature Required
- [ ] **Document this in shipping policy** — customers should know

### Package Protection 🟢
- [ ] Consider adding **Route** or **Extend** package protection at checkout
  - Customer pays a small fee (1-2% of order)
  - Covers lost, stolen, damaged packages
  - Reduces support burden and chargebacks
  - Easy Shopify/custom integration via API

### Shipping Policy Page 🔴
- [ ] Create `/shipping` page covering:
  - Processing time (1-3 business days)
  - Shipping methods and estimated delivery
  - Signature requirements for high-value orders
  - Insurance policy
  - International shipping (if offered — recommend US only at launch)

---

## 4. Email Deliverability

### Domain Authentication 🔴
- [ ] **SPF record** for securedtampa.com:
  ```
  v=spf1 include:amazonses.com include:resend.com ~all
  ```
  (Adjust based on actual sending services)
- [ ] **DKIM** — Add Resend's DKIM records (2 CNAME records provided in Resend dashboard)
- [ ] **DMARC** record:
  ```
  _dmarc.securedtampa.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@securedtampa.com; pct=100"
  ```
  Start with `p=none` to monitor, then move to `p=quarantine`
- [ ] Verify all records with [MXToolbox](https://mxtoolbox.com)

### Resend Setup 🔴
- [ ] Verify domain in Resend dashboard
- [ ] Add DNS records (SPF, DKIM, DMARC) as provided by Resend
- [ ] Set "From" address: `orders@securedtampa.com` or `noreply@securedtampa.com`
- [ ] Set "Reply-To" address: `support@securedtampa.com`
- [ ] Test deliverability to Gmail, Outlook, Yahoo before launch

### Transactional vs Marketing Email 🟡
- [ ] **Transactional** (via Resend): Order confirmation, shipping updates, password reset
- [ ] **Marketing** (separate): Newsletters, promotions, restocks
- [ ] Best practice: Use separate subdomains
  - Transactional: `orders@securedtampa.com`
  - Marketing: `news@mail.securedtampa.com` (separate subdomain)
- [ ] This protects transactional deliverability if marketing emails get spam complaints

### CAN-SPAM Compliance 🔴
- [ ] **Required for all commercial email:**
  - Clear "From" name and email
  - Accurate subject line (no deception)
  - Physical mailing address in footer (PO Box is fine)
  - Unsubscribe link in every marketing email (must work within 10 business days)
  - Honor opt-outs promptly
- [ ] Transactional emails (order confirmations) are exempt from unsubscribe requirement but must still be honest

---

## 5. Analytics & Tracking

### Google Analytics 4 🟡
- [ ] Create GA4 property for securedtampa.com
- [ ] Add GA4 measurement ID to Next.js (use `@next/third-parties` or `gtag.js`)
- [ ] **Only fire after cookie consent**
- [ ] Set up e-commerce events:
  - `view_item` — Product page view
  - `add_to_cart`
  - `begin_checkout`
  - `purchase` — With value, transaction_id, items
- [ ] Set up conversions: `purchase`, `sign_up`
- [ ] Link to Google Search Console
- [ ] Enable Enhanced Measurement (scroll, outbound clicks, site search)

### Meta Pixel 🟡
- [ ] Create Meta Pixel in Meta Business Suite
- [ ] Install pixel on site (load after cookie consent)
- [ ] Set up events:
  - `PageView` — All pages
  - `ViewContent` — Product pages (with content_id, value)
  - `AddToCart`
  - `InitiateCheckout`
  - `Purchase` — With value and currency
- [ ] Verify events in Meta Events Manager
- [ ] Set up Custom Audiences for retargeting:
  - Visited site in last 30 days
  - Added to cart but didn't purchase (7 days)
  - Past purchasers (for lookalike audiences)
- [ ] Verify domain in Meta Business Settings

### Google Search Console 🟡
- [ ] Verify securedtampa.com ownership (DNS TXT record or HTML file)
- [ ] Submit sitemap: `securedtampa.com/sitemap.xml`
- [ ] Ensure Next.js generates sitemap (use `next-sitemap` package)
- [ ] Check for crawl errors after launch
- [ ] Submit important pages for indexing

### Conversion Tracking 🟡
- [ ] **Server-side conversion tracking** (more reliable than client-side):
  - Stripe webhook → send purchase event to GA4 Measurement Protocol
  - Stripe webhook → send purchase event to Meta Conversions API
- [ ] This ensures conversions are tracked even if client-side JS is blocked
- [ ] Deduplicate with client-side events using event_id

---

## 6. Security

### SSL / HTTPS 🔴
- [ ] Vercel provides automatic SSL — verify it's active
- [ ] Check with `curl -I https://securedtampa.com` — should show `HTTP/2 200`
- [ ] Verify HTTP → HTTPS redirect works
- [ ] Check SSL grade at [SSL Labs](https://ssllabs.com/ssltest/) — target A+
- [ ] Ensure all resources loaded over HTTPS (no mixed content)

### Supabase Row Level Security (RLS) 🔴
- [ ] **Audit every table:**
  - `products` — Public read, admin-only write
  - `orders` — Users read own orders only, admin reads all
  - `profiles` — Users read/update own profile only
  - `cart` / `cart_items` — Users access own cart only
  - `inventory` — Public read (stock counts), admin-only write
  - `reviews` — Public read, authenticated users create own
- [ ] **Verify RLS is ENABLED on every table** (Supabase disables by default!)
- [ ] Test with a non-admin user — try to read/modify other users' data
- [ ] Ensure `service_role` key is **never** exposed to the client
- [ ] `anon` key should only have permissions defined by RLS policies

### API Rate Limiting 🟡
- [ ] Implement rate limiting on API routes:
  - Auth endpoints (login, register): 5 req/min per IP
  - Checkout/order creation: 10 req/min per user
  - Product listing: 60 req/min per IP
  - Search: 30 req/min per IP
- [ ] Use Vercel Edge Middleware or `upstash/ratelimit` (Redis-based, works on Vercel)
- [ ] Rate limit Supabase API calls from client (use Supabase's built-in rate limiting)

### Content Security Policy 🟡
- [ ] Add CSP headers via `next.config.js` or Vercel headers:
  ```
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://connect.facebook.net;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com;
  connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://www.facebook.com;
  style-src 'self' 'unsafe-inline';
  ```
- [ ] Test thoroughly — CSP can break things if too restrictive
- [ ] Add `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`

### Additional Security 🟡
- [ ] Environment variables: Verify no secrets in client-side code (`NEXT_PUBLIC_` prefix only for public keys)
- [ ] Supabase `anon` key is safe to expose (it's meant to be public, RLS protects data)
- [ ] `service_role` key: Server-side only, never in `NEXT_PUBLIC_*`
- [ ] Stripe secret key: Server-side only
- [ ] Enable Supabase Auth email confirmation
- [ ] Implement CSRF protection on forms (Next.js App Router handles this natively with Server Actions)

---

## 7. Performance

### Core Web Vitals Targets 🟡
- [ ] **LCP (Largest Contentful Paint):** < 2.5s
- [ ] **INP (Interaction to Next Paint):** < 200ms
- [ ] **CLS (Cumulative Layout Shift):** < 0.1
- [ ] Test with Lighthouse, PageSpeed Insights, and Chrome DevTools
- [ ] Test on mobile (3G throttle) — most sneaker buyers are on mobile

### Image Optimization 🔴
- [ ] Use Next.js `<Image>` component for all product images (automatic WebP/AVIF, lazy loading, responsive sizes)
- [ ] Set explicit `width` and `height` on all images (prevents CLS)
- [ ] Configure Supabase Storage image transforms or use Vercel Image Optimization
- [ ] Compress product photos before upload (target < 200KB per image)
- [ ] Use `priority` prop on above-the-fold hero/product images
- [ ] Consider a max of 4-6 product images per listing

### CDN & Caching 🟡
- [ ] Vercel Edge Network handles CDN automatically
- [ ] Set `Cache-Control` headers:
  - Static assets (JS, CSS, images): `public, max-age=31536000, immutable`
  - Product pages (ISR): `s-maxage=60, stale-while-revalidate=300`
  - Cart/checkout: `no-store` (never cache)
  - API routes: `no-store` or short `s-maxage`
- [ ] Use Next.js ISR (Incremental Static Regeneration) for product pages
- [ ] Preload critical fonts with `<link rel="preload">`
- [ ] Minimize third-party scripts (each one hurts LCP)

### Mobile Performance 🟡
- [ ] Test checkout flow on mobile (this is where most sales happen)
- [ ] Ensure touch targets are ≥ 48x48px
- [ ] Test on real devices, not just Chrome DevTools
- [ ] Keep JavaScript bundle small — analyze with `@next/bundle-analyzer`

---

## 8. Pre-Launch Final Checks

### Technical 🔴
- [ ] All environment variables set in Vercel (production)
- [ ] Stripe is in **live mode** (not test mode)
- [ ] Webhook endpoints point to production URL
- [ ] Custom domain `securedtampa.com` configured in Vercel
- [ ] `www.securedtampa.com` redirects to `securedtampa.com` (or vice versa — pick one)
- [ ] Favicon and social meta tags (Open Graph) set
- [ ] `robots.txt` allows crawling
- [ ] `sitemap.xml` generated and accessible
- [ ] 404 page looks good
- [ ] Error boundaries catch and display errors gracefully

### Business 🔴
- [ ] Place a test order (real card, real checkout, full flow)
- [ ] Verify confirmation email arrives
- [ ] Verify Stripe dashboard shows the order
- [ ] Verify order appears in admin dashboard
- [ ] Test refund flow
- [ ] Test on multiple devices (iPhone, Android, desktop)
- [ ] Load real product inventory (photos, descriptions, sizes, prices)
- [ ] Set up `support@securedtampa.com` email forwarding

### Content 🔴
- [ ] All legal pages published: Privacy, Terms, Returns, Shipping
- [ ] About page with business story
- [ ] Contact page with support email
- [ ] FAQ page covering common questions (authentication process, shipping times, returns)
- [ ] Physical address or PO Box on site (required for CAN-SPAM and trust)

---

## 9. Post-Launch (First 30 Days)

### Week 1 🔴
- [ ] Monitor Stripe for failed payments and disputes
- [ ] Monitor error logs in Vercel
- [ ] Watch email deliverability (check spam folders)
- [ ] Respond to customer inquiries within 24 hours
- [ ] Fix any bugs found by real users

### Week 2-4 🟡
- [ ] Review GA4 data — where do users drop off?
- [ ] Set up Meta retargeting campaigns
- [ ] Collect and display customer reviews
- [ ] Start building email list for marketing
- [ ] Consider adding product reviews/ratings feature
- [ ] Evaluate shipping costs vs. what you're charging
- [ ] File first Florida sales tax return

### Ongoing 🟢
- [ ] Monthly: Review Supabase RLS policies after schema changes
- [ ] Monthly: Check Core Web Vitals in Search Console
- [ ] Quarterly: Update legal pages if policies change
- [ ] Quarterly: Review Stripe Radar rules and blocked payments
- [ ] Annually: Complete Stripe PCI self-assessment
- [ ] As needed: Register for sales tax in new states when approaching thresholds

---

## Quick Reference: Costs

| Item | Cost |
|------|------|
| Vercel Pro | $20/mo |
| Supabase Pro | $25/mo |
| Stripe fees | 2.9% + $0.30 per transaction |
| Pirate Ship | Free |
| Resend | Free tier (3K emails/mo), then $20/mo |
| Domain renewal | ~$12/yr |
| Google Analytics | Free |
| Meta Pixel | Free |
| Route (package protection) | Free (customer-funded) |
| Cookie consent tool | Free (open source) |
| Legal pages | Free (template) or $200-500 (lawyer review) |
| **Total minimum monthly** | **~$45/mo + Stripe fees** |

---

*Generated 2026-02-13. Review and update quarterly.*
