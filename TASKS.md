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

### Admin Inventory System - @Kyle (MAJOR PROGRESS)
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
- [~] Register URL scheme for OAuth callback - @Kyle (in Xcode)
- [~] Add camera permission to Info.plist - @Kyle (in Xcode)
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

## FOR PARTNER (Morning Update)

Hey! The full admin inventory system is now built! Here's what's done:

**COMPLETE Admin System Features:**
- ✅ Dashboard with live inventory stats (total, low stock, out of stock, value)
- ✅ Barcode scanning (iPhone camera, Bluetooth scanner, or manual entry)
- ✅ StockX integration - scan barcode → auto-fill product data
- ✅ Product entry form with StockX pre-fill or manual entry
- ✅ Full inventory list with search, filters (category, condition, stock status)
- ✅ Product editing
- ✅ Quick quantity adjustments with reason logging
- ✅ Pokemon manual entry with grading support
- ✅ New vs Used item handling

**Files I Created:**
```
Services/
├── BarcodeScannerService.swift    # Camera barcode scanning
├── BluetoothScannerService.swift  # Bluetooth scanner support
├── StockXAuthManager.swift        # OAuth 2.0 + PKCE
└── StockXService.swift            # StockX API client

ViewModels/
└── InventoryViewModel.swift       # Full inventory CRUD

Views/Admin/
├── AdminTabView.swift             # Dashboard with stats
├── BarcodeScannerView.swift       # Camera/Bluetooth/Manual modes
├── ProductLookupView.swift        # StockX search results
├── ProductEntryView.swift         # Add new products
├── InventoryListView.swift        # Browse all inventory
├── ProductEditView.swift          # Edit existing products
├── QuickAdjustSheet.swift         # Quantity adjustments
├── ManualEntryView.swift          # Manual entry (sneakers/pokemon)
└── StockXLoginView.swift          # StockX OAuth login
```

**Before Testing - Do These in Xcode:**
1. Add camera permission: Project → Info → add "Privacy - Camera Usage Description"
2. Register URL scheme: Project → Info → URL Types → add "securedapp"

**You Can Work On:**
- TCGPlayer API for Pokemon (see Config/Pokemon.md)
- Website development
- Customer checkout flow
- Stripe payment integration

To run: Double-click SecuredApp.xcodeproj → Select simulator → Cmd+R
