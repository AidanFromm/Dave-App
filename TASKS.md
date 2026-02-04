# Secured App - Task Tracker

## How To Use This File
- Mark tasks with `[ ]` (not started), `[~]` (in progress), `[x]` (done)
- Add your name when you start a task: `[~] Task name - @Kyle`
- Always `git pull` before starting work, `git push` after finishing

---

## ACTIVE WORK LOG

### Kyle is currently working on: ADMIN INVENTORY SYSTEM
**Started:** February 4, 2026
**Last Update:** February 4, 2026 (late night)

**What I'm building:**
- Admin-only inventory scanner in the iOS app (hidden tab for admins)
- Barcode scanning using iPhone camera + Bluetooth scanner support
- StockX API integration for automatic product lookup (I have the API key)
- Scan workflow: Scan barcode → Auto-fill product data → Choose New/Used → Set price → Add to inventory
- For NEW items: Auto-pull images from StockX
- For USED items: Upload custom photos
- All inventory changes logged for audit trail

**COMPLETED TODAY:**
- ✅ StockX OAuth 2.0 authentication system (with PKCE)
- ✅ Keychain storage for secure token management
- ✅ StockX API service for product/barcode lookup
- ✅ Admin tab added to the app (visible during development)
- ✅ StockX login UI

**Files I created:**
- `Utilities/KeychainHelper.swift` - Secure token storage in iOS Keychain
- `Services/StockXAuthManager.swift` - OAuth 2.0 with PKCE, handles login/logout/token refresh
- `Services/StockXService.swift` - StockX API client (search, get product, barcode lookup)
- `Views/Admin/StockXLoginView.swift` - UI for connecting StockX account
- `Views/Admin/AdminTabView.swift` - Main admin dashboard with navigation
- Updated `App/ContentView.swift` - Added Admin tab

**NEXT UP (tomorrow):**
- Register URL scheme in Xcode for OAuth callback (securedapp://)
- Test StockX OAuth flow end-to-end
- Build the barcode scanner using AVFoundation
- Create product entry form after successful barcode scan

**Files still to create:**
- Services/BarcodeScannerService.swift (camera/scanner handling)
- Views/Admin/BarcodeScannerView.swift (camera UI - placeholder exists)
- Views/Admin/ProductEntryView.swift (form after scan)
- ViewModels/InventoryViewModel.swift

**Partner can work on:**
- Pokemon item entry system (TCGPlayer API integration)
- Website development
- Customer-facing features
- Stripe payment integration

---

## Current Sprint: iOS App Core Features

### High Priority - COMPLETED
- [x] App builds and runs in simulator - @Kyle
- [x] Xcode project setup with Supabase + Stripe SDKs - @Kyle
- [x] Fixed all Swift 6 compatibility issues - @Kyle

### Admin Inventory System - @Kyle (IN PROGRESS)
- [x] Design admin inventory scanner UI - @Kyle
- [x] StockX OAuth 2.0 authentication - @Kyle
- [x] Secure token storage (Keychain) - @Kyle
- [x] StockX API client (search, product lookup, barcode) - @Kyle
- [x] Admin tab and dashboard UI - @Kyle
- [~] Register URL scheme for OAuth callback - @Kyle (next session)
- [~] Test StockX OAuth flow end-to-end - @Kyle (next session)
- [ ] Implement barcode scanning (camera + bluetooth)
- [ ] Product entry form after scan
- [ ] New vs Used item workflow
- [ ] Image upload for used items
- [ ] Inventory logging system
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

## FOR PARTNER (Morning Update)

Hey! I made good progress on the admin inventory system last night. Here's what's done:

**StockX Integration (Complete):**
- OAuth 2.0 authentication with PKCE (industry standard secure auth)
- Tokens stored securely in iOS Keychain
- API service ready to search products and lookup barcodes
- Login UI for connecting the StockX account
- Admin tab added to the app

**Files I Created:**
- `Utilities/KeychainHelper.swift` - Handles secure storage
- `Services/StockXAuthManager.swift` - Manages login/logout/tokens
- `Services/StockXService.swift` - Calls StockX API
- `Views/Admin/StockXLoginView.swift` - Login button UI
- `Views/Admin/AdminTabView.swift` - Admin dashboard

**What I'll Do Next:**
1. Register URL scheme in Xcode (needed for OAuth redirect)
2. Test the full StockX login flow
3. Build the barcode scanner
4. Create the product entry form

**You Can Work On:**
- Pokemon system (see Config/Pokemon.md)
- Website
- Customer-facing app features
- Stripe payment setup

To run the app: Open Xcode (double-click SecuredApp.xcodeproj), select iPhone simulator, Cmd+R to run.
