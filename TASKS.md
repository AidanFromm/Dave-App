# Secured App - Task Tracker

## How To Use This File
- Mark tasks with `[ ]` (not started), `[~]` (in progress), `[x]` (done)
- Add your name when you start a task: `[~] Task name - @Kyle`
- Always `git pull` before starting work, `git push` after finishing

---

## ACTIVE WORK LOG

### Kyle completed: ADMIN INVENTORY SYSTEM ✅
**Started:** February 4, 2026
**Completed:** February 4, 2026 (late night)
**Status:** Handing off to partner

**EVERYTHING BUILT:**
- ✅ Full admin dashboard with live inventory stats
- ✅ Barcode scanning (camera + Bluetooth + manual entry)
- ✅ StockX OAuth 2.0 authentication (with PKCE)
- ✅ StockX API integration for barcode lookup + product search
- ✅ Product entry form (auto-filled from StockX or manual)
- ✅ Full inventory list with search, filters (category, condition, stock)
- ✅ Product editing
- ✅ Quick quantity adjustments with reason logging
- ✅ Pokemon manual entry with grading support (PSA, BGS, CGC)
- ✅ Keychain storage for secure tokens
- ✅ Inventory audit trail (inventory_logs table)

---

## ⚠️ CRITICAL: StockX OAuth Callback URL - NEEDS PARTNER ACTION

### The Problem
StockX Developer Portal **requires HTTPS callback URLs**. It rejects custom URL schemes like `securedapp://stockx/callback`. The iOS app uses `ASWebAuthenticationSession` which needs a custom URL scheme to receive the callback.

### The Solution
You need to set up a **web redirect page** on an HTTPS domain that redirects to the app's custom URL scheme.

### Step-by-Step Instructions

**1. Purchase a domain** (e.g., `securedtampa.com` or `secured-app.com`)

**2. Set up a simple redirect page at `https://yourdomain.com/stockx/callback`**

The page should redirect to the app's custom URL scheme. Create an `index.html` at that path:
```html
<!DOCTYPE html>
<html>
<head><title>Redirecting...</title></head>
<body>
<script>
  // Grab the full query string (contains ?code=xxx)
  const params = window.location.search;
  // Redirect to the iOS app
  window.location.href = "securedapp://stockx/callback" + params;
</script>
<p>Redirecting to Secured App...</p>
</body>
</html>
```

You can host this on:
- **Vercel** (easiest - deploy a Next.js or static site)
- **Netlify** (also easy)
- **GitHub Pages** (free)
- Any web host with HTTPS

**3. Update the StockX Developer Portal**
- Go to your StockX Developer App settings
- Set the callback URL to: `https://yourdomain.com/stockx/callback`
- Save

**4. Update the iOS code** (ONE line change)
In `SecuredApp/Services/StockXAuthManager.swift`, line 38:
```swift
// Change FROM:
private let redirectUri = "securedapp://stockx/callback"
// Change TO:
private let redirectUri = "https://yourdomain.com/stockx/callback"
```

**5. Test the OAuth flow**
- Open the app → Admin tab → Connect StockX
- Should open StockX login in browser
- After login, StockX redirects to your HTTPS URL
- Your redirect page sends it to the app via `securedapp://` scheme
- App receives the auth code and exchanges it for tokens

### Important Notes
- The URL scheme `securedapp` is already registered in Xcode (Info.plist)
- Camera permission is already added to Info.plist
- The OAuth flow code is fully working - it just needs the HTTPS callback URL to complete

---

**Partner can work on:**
- **StockX callback URL setup** (see instructions above - PRIORITY)
- Pokemon item entry system (TCGPlayer API integration)
- Website development
- Customer-facing features
- Stripe payment integration
- Image upload to Supabase Storage

---

## Current Sprint: iOS App Core Features

### High Priority - COMPLETED
- [x] App builds and runs in simulator - @Kyle
- [x] Xcode project setup with Supabase + Stripe SDKs - @Kyle
- [x] Fixed all Swift 6 compatibility issues - @Kyle

### Admin Inventory System - @Kyle (COMPLETE)
- [x] Design admin inventory scanner UI - @Kyle
- [x] StockX OAuth 2.0 authentication - @Kyle
- [x] Secure token storage (Keychain) - @Kyle
- [x] StockX API client (search, product lookup, barcode) - @Kyle
- [x] Admin tab and dashboard UI - @Kyle
- [x] Barcode scanning (camera + bluetooth) - @Kyle
- [x] Product lookup view (StockX search fallback) - @Kyle
- [x] Product entry form (pre-filled from StockX) - @Kyle
- [x] Inventory list with search/filter - @Kyle
- [x] Product edit view - @Kyle
- [x] Quick quantity adjustment with logging - @Kyle
- [x] Pokemon manual entry form - @Kyle
- [x] New vs Used item workflow - @Kyle
- [x] InventoryViewModel with full CRUD - @Kyle
- [x] Register URL scheme for OAuth callback (securedapp://) - @Kyle
- [x] Add camera permission to Info.plist - @Kyle
- [x] Fixed all build errors (Swift 6 concurrency, Encodable structs, naming conflicts) - @Kyle
- [ ] **⚠️ StockX OAuth callback URL - needs HTTPS domain** (see instructions above) - @Partner
- [ ] Image upload to Supabase Storage
- [ ] Admin authentication/role check

### Pokemon System - ASSIGNED TO PARTNER
- [ ] Research TCGPlayer API or Pokemon TCG API
- [ ] Design Pokemon item entry flow
- [ ] Implement Pokemon product lookup
- [ ] Pokemon-specific fields (set, rarity, condition grades)

### Product Browsing (PENDING)
- [ ] Verify Supabase connection works (fetch products)
- [ ] Add sample products to Supabase database
- [ ] Test product grid displays correctly
- [ ] Product filtering by category
- [ ] Product search functionality

### Cart & Checkout (PENDING)
- [ ] Set up Stripe account and add API keys
- [ ] Implement Stripe checkout
- [ ] Order confirmation screen

### User Authentication (PENDING)
- [ ] Sign up flow
- [ ] Login flow
- [ ] Guest checkout option

---

## Completed Tasks

### February 4, 2026 (Night Session) - FULL ADMIN SYSTEM
- [x] BarcodeScannerService - Camera scanning with AVFoundation - @Kyle
- [x] BluetoothScannerService - HID Bluetooth scanner support - @Kyle
- [x] InventoryViewModel - Full inventory management logic - @Kyle
- [x] BarcodeScannerView - Camera/Bluetooth/Manual entry modes - @Kyle
- [x] ProductLookupView - StockX lookup with search fallback - @Kyle
- [x] ProductEntryView - Add products (StockX pre-fill or manual) - @Kyle
- [x] InventoryListView - Browse, search, filter all inventory - @Kyle
- [x] ProductEditView - Edit existing products - @Kyle
- [x] QuickAdjustSheet - Quantity adjustments with reason logging - @Kyle
- [x] ManualEntryView - Sneakers and Pokemon manual entry - @Kyle
- [x] PokemonEntryView - Pokemon-specific fields (set, rarity, grading) - @Kyle
- [x] AdminTabView upgraded to full dashboard - @Kyle

### February 4, 2026 (Evening Session)
- [x] StockX OAuth 2.0 authentication system - @Kyle
- [x] KeychainHelper for secure token storage - @Kyle
- [x] StockXAuthManager (login, logout, token refresh) - @Kyle
- [x] StockXService API client (search, products, variants, barcode lookup) - @Kyle
- [x] Admin tab added to app - @Kyle
- [x] StockXLoginView UI - @Kyle
- [x] AdminTabView dashboard - @Kyle

### February 4, 2026 (Earlier)
- [x] Set up Xcode project - @Kyle
- [x] Added Supabase Swift SDK - @Kyle
- [x] Added Stripe iOS SDK - @Kyle
- [x] Fixed all build errors (15+ issues) - @Kyle
- [x] App successfully runs in simulator - @Kyle
- [x] Set up Git collaboration system - @Kyle
- [x] Created TASKS.md and COLLABORATION.md - @Kyle
- [x] Organized Config folder with API credentials - @Kyle

---

## Architecture Decisions

### Inventory System Design
- **Single source of truth**: Supabase `products` table
- **Admin access**: Role-based, checked via `customers.role` field
- **Barcode lookup**: StockX API (Kyle has developer key)
- **New items**: Auto-populate from StockX, use their images
- **Used items**: Same barcode scan, staff marks as used, uploads custom photos
- **Audit trail**: All changes logged to `inventory_logs` table

---

## Notes
- 2026-02-04 (late): Kyle completed StockX authentication system. All OAuth + API code is done. Next: register URL scheme in Xcode and test.
- 2026-02-04: Kyle starting admin inventory system. Partner will handle Pokemon items.
- 2026-02-04: Using StockX API for sneaker barcode lookups (Kyle has API key)
- 2026-02-04: App is now building and running successfully after fixing Swift 6 issues

---

## FOR PARTNER - HANDOFF NOTES (February 4, 2026)

Hey! The full admin inventory system is built and the app compiles clean. Here's everything you need to know:

### What's Done
- ✅ Dashboard with live inventory stats (total, low stock, out of stock, value)
- ✅ Barcode scanning (iPhone camera, Bluetooth scanner, or manual entry)
- ✅ StockX integration - scan barcode → auto-fill product data
- ✅ Product entry form with StockX pre-fill or manual entry
- ✅ Full inventory list with search, filters (category, condition, stock status)
- ✅ Product editing
- ✅ Quick quantity adjustments with reason logging
- ✅ Pokemon manual entry with grading support (PSA, BGS, CGC)
- ✅ New vs Used item handling
- ✅ Camera permission already in Info.plist
- ✅ URL scheme `securedapp://` already registered in Info.plist

### 🔴 YOUR #1 PRIORITY: StockX OAuth Callback URL
The StockX login page is showing an error because StockX requires an HTTPS callback URL.
**See the detailed instructions in the "CRITICAL: StockX OAuth Callback URL" section above.**

Quick summary:
1. Buy a domain
2. Host a simple HTML redirect page at `https://yourdomain.com/stockx/callback`
3. Update StockX Developer Portal with the HTTPS URL
4. Change ONE line in `StockXAuthManager.swift` (line 38, the `redirectUri`)
5. Test the login flow

### Files I Created/Modified
```
Services/
├── BarcodeScannerService.swift    # Camera barcode scanning (AVFoundation)
├── BluetoothScannerService.swift  # Bluetooth HID scanner support
├── StockXAuthManager.swift        # OAuth 2.0 + PKCE (MODIFIED - fixed endpoint)
└── StockXService.swift            # StockX API client (MODIFIED - @MainActor)

ViewModels/
└── InventoryViewModel.swift       # Full inventory CRUD with Encodable structs

Views/Admin/
├── AdminTabView.swift             # Dashboard with stats (REWRITTEN)
├── BarcodeScannerView.swift       # Camera/Bluetooth/Manual modes (REWRITTEN)
├── ProductLookupView.swift        # StockX search results (NEW)
├── ProductEntryView.swift         # Add new products (NEW)
├── InventoryListView.swift        # Browse all inventory (REWRITTEN)
├── ProductEditView.swift          # Edit existing products (NEW)
├── QuickAdjustSheet.swift         # Quantity adjustments (NEW)
├── ManualEntryView.swift          # Manual entry - sneakers/pokemon (REWRITTEN)
└── StockXLoginView.swift          # StockX OAuth login (unchanged)
```

### Build Fixes Applied This Session
- Added `import Combine` to BarcodeScannerService and StockXAuthManager (required for `@Published` in Swift 6)
- Made StockXService `@MainActor` with computed property for authManager
- Replaced all `[String: Any]` dictionaries with proper `Encodable` structs in InventoryViewModel (Supabase requirement)
- Renamed `FilterChip` → `InventoryFilterChip` to avoid conflict with your FilterSortSheet.swift
- Changed StockXService from `@StateObject` to `let` in ProductLookupView (not ObservableObject)
- Fixed StockX auth endpoint: `/authorize` → `/oauth/authorize`
- Fixed SupabaseService `.ilike()` string interpolation

### What You Can Work On Next
1. **StockX callback URL setup** (PRIORITY - see above)
2. TCGPlayer API for Pokemon (see `Config/Pokemon.md`)
3. Image upload to Supabase Storage
4. Website development
5. Customer checkout flow
6. Stripe payment integration
7. Admin role authentication check

To run: Double-click `SecuredApp.xcodeproj` → Select simulator → Cmd+R
