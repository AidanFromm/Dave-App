# Secured App - Project Memory

## Project Overview
Multi-channel e-commerce platform for a Tampa-based sneaker/Pokemon retail store.

## Business Details
- **Store Location**: Tampa, Florida
- **App Name**: Secured / Secured Tampa (TBD)
- **Categories**: New Sneakers, Used Sneakers, Pokemon
- **Inventory Size**: 2000+ SKUs
- **Sales Tax**: Florida only

## Sales Channels
1. iOS App (primary)
2. Website
3. In-store POS (Clover + Stripe)
4. eBay
5. Whatnot

## Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| iOS App | SwiftUI, MVVM, Supabase Swift SDK |
| Website | Next.js 14, Tailwind CSS |
| Payments | Stripe (online) + Clover (POS) |
| Push Notifications | Firebase Cloud Messaging |

## API Keys & Credentials

**All credentials are now organized in the `/Config` folder:**

| Config File | Service | Owner | Status |
|-------------|---------|-------|--------|
| `Config/Sneakers.md` | StockX API | Kyle | Ready |
| `Config/Pokemon.md` | TCGPlayer API | Partner | Not Started |
| `Config/Backend.md` | Supabase | Shared | Complete |
| `Config/Payments.md` | Stripe, Clover | TBD | Not Started |

See individual files in `/Config` for full credentials and documentation.

---

## Current Phase
**Phase 2: iOS App Development - Admin Inventory System Complete, StockX OAuth Needs HTTPS Callback**

## Progress Checklist

### Phase 1: Backend (COMPLETE)
- [x] Supabase project created
- [x] Database tables: categories, products, customers, orders, inventory_logs, scheduled_drops
- [x] Row Level Security (RLS) policies applied
- [x] Realtime enabled for: products, orders, scheduled_drops
- [x] Storage bucket: product-images
- [x] Functions: deduct_inventory, restore_inventory, generate_order_number
- [x] Default categories inserted: New Sneakers, Used Sneakers, Pokemon

### Phase 2: iOS App (IN PROGRESS)
- [x] Xcode project created
- [x] Supabase Swift SDK added
- [x] Stripe iOS SDK added
- [x] All Swift source files added
- [x] Fixed Swift 6 / iOS 26 compatibility issues
- [x] App builds and runs in simulator
- [x] StockX OAuth 2.0 authentication system
- [x] Keychain storage for secure tokens
- [x] StockX API service (search, product lookup, barcode)
- [x] Admin tab and dashboard UI
- [x] Barcode scanning (camera + Bluetooth + manual)
- [x] Product lookup (StockX barcode + search fallback)
- [x] Product entry form (StockX pre-fill or manual)
- [x] Inventory list with search/filter/swipe actions
- [x] Product editing
- [x] Quick quantity adjustments with audit logging
- [x] Pokemon manual entry with grading support
- [x] Register URL scheme for OAuth callback (securedapp://)
- [x] Camera permission in Info.plist
- [x] InventoryViewModel with full CRUD operations
- [ ] **⚠️ StockX OAuth needs HTTPS callback URL** (see TASKS.md for instructions)
- [ ] Image upload to Supabase Storage
- [ ] Admin role authentication check
- [ ] Connect to Supabase (test product fetch)
- [ ] Implement Stripe checkout
- [ ] Test full purchase flow

### Phase 3: Website (NOT STARTED)
- [ ] Next.js project setup
- [ ] Product browsing
- [ ] Checkout flow

---

## Admin Inventory System (Kyle Building)

### Overview
Admin-only inventory scanner accessible via hidden tab in the iOS app.

### Tech Stack
- **Barcode Scanning**: iPhone camera + Bluetooth scanner support
- **Product Lookup**: StockX API (Kyle has developer key)
- **Image Storage**: Supabase Storage bucket

### Scan Workflow
```
1. Admin opens Inventory tab (hidden for regular users)
2. Taps "Add Product" → Camera opens for barcode scan
3. Barcode scanned → StockX API lookup
4. Product data auto-fills (name, brand, size, colorway, retail price)
5. Admin selects: NEW or USED
   - NEW: Uses StockX product images automatically
   - USED: Admin uploads custom photos
6. Admin sets selling price, confirms condition
7. Product added to inventory → Logged in inventory_logs
```

### Files Created (Feb 4) - ADMIN SYSTEM COMPLETE
```
SecuredApp/
├── Utilities/
│   └── KeychainHelper.swift            ✅ Secure token storage
├── Services/
│   ├── StockXAuthManager.swift         ✅ OAuth 2.0 + PKCE
│   ├── StockXService.swift             ✅ StockX API client
│   ├── BarcodeScannerService.swift     ✅ Camera scanning (AVFoundation)
│   └── BluetoothScannerService.swift   ✅ HID Bluetooth scanner
├── ViewModels/
│   └── InventoryViewModel.swift        ✅ Full inventory CRUD
└── Views/Admin/
    ├── AdminTabView.swift              ✅ Dashboard with stats
    ├── StockXLoginView.swift           ✅ StockX OAuth login
    ├── BarcodeScannerView.swift        ✅ Camera/Bluetooth/Manual modes
    ├── ProductLookupView.swift         ✅ StockX search results
    ├── ProductEntryView.swift          ✅ Add new products
    ├── InventoryListView.swift         ✅ Browse/search/filter inventory
    ├── ProductEditView.swift           ✅ Edit existing products
    ├── QuickAdjustSheet.swift          ✅ Quantity adjustments
    └── ManualEntryView.swift           ✅ Sneakers + Pokemon manual entry
```

### StockX API Integration
- Kyle has developer API key (will add to credentials)
- Lookup by UPC/barcode returns: name, brand, colorway, size, retail price, images
- Rate limits: TBD based on plan

### Known Issue: StockX OAuth Callback
StockX Developer Portal requires HTTPS callback URLs. Custom URL schemes (`securedapp://`) are rejected.
**Solution**: Set up an HTTPS domain with a redirect page → `securedapp://stockx/callback`.
See TASKS.md for full step-by-step instructions.

### Work Division
| Feature | Owner | Status |
|---------|-------|--------|
| Admin Inventory Scanner | Kyle | ✅ Complete |
| Sneaker barcode lookup (StockX) | Kyle | ✅ Complete |
| StockX OAuth callback URL setup | Partner | ⚠️ Needs domain |
| Pokemon item entry | Partner | TCGPlayer API |
| Image upload to Supabase Storage | TBD | Not started |
| Website | Partner | Not started |
| Stripe checkout | TBD | Not started |

---

## Project Structure

```
/Applications/Secured App/
├── CLAUDE.md                    # This file - project memory
├── TASKS.md                     # Task tracking for team collaboration
├── COLLABORATION.md             # Git workflow guide
├── Config/                      # API keys organized by service
│   ├── README.md                # Config folder guide
│   ├── Sneakers.md              # StockX API (Kyle)
│   ├── Pokemon.md               # TCGPlayer API (Partner)
│   ├── Backend.md               # Supabase credentials
│   └── Payments.md              # Stripe, Clover
├── SecuredApp.xcodeproj         # Xcode project (double-click to open)
├── SecuredApp/                  # iOS source code
│   ├── App/
│   │   ├── SecuredAppApp.swift
│   │   └── ContentView.swift    # Updated - includes Admin tab
│   ├── Models/
│   ├── Views/
│   │   ├── Shop/                # Customer-facing shop
│   │   ├── Cart/                # Shopping cart
│   │   ├── Profile/             # User profile
│   │   └── Admin/               # Admin inventory system (COMPLETE)
│   │       ├── AdminTabView.swift        ✅ Dashboard with stats
│   │       ├── StockXLoginView.swift     ✅ StockX OAuth login
│   │       ├── BarcodeScannerView.swift  ✅ Camera/BT/Manual modes
│   │       ├── ProductLookupView.swift   ✅ StockX search results
│   │       ├── ProductEntryView.swift    ✅ Add new products
│   │       ├── InventoryListView.swift   ✅ Browse/search/filter
│   │       ├── ProductEditView.swift     ✅ Edit products
│   │       ├── QuickAdjustSheet.swift    ✅ Quantity adjustments
│   │       └── ManualEntryView.swift     ✅ Sneakers + Pokemon
│   ├── ViewModels/
│   │   └── InventoryViewModel.swift     ✅ Full inventory CRUD
│   ├── Services/
│   │   ├── SupabaseService.swift
│   │   ├── StockXAuthManager.swift      ✅ OAuth 2.0 + PKCE
│   │   ├── StockXService.swift          ✅ StockX API client
│   │   ├── BarcodeScannerService.swift  ✅ Camera scanning
│   │   └── BluetoothScannerService.swift ✅ BT HID scanner
│   ├── Utilities/
│   │   └── KeychainHelper.swift         ✅ Secure token storage
│   └── Assets.xcassets
└── database/                    # SQL migration files
```

---

## How to Open the Project

### Quick Start (Project Already Set Up)
1. In Finder, go to: `/Applications/Secured App/`
2. Double-click **SecuredApp.xcodeproj**
3. Wait for packages to download (check top right of Xcode)
4. Select an iPhone simulator at the top
5. Press **Cmd + R** to build and run

### Troubleshooting
- **"No such module 'Supabase'"**: Wait for packages to finish downloading
- **Signing error**: Go to project settings → Signing & Capabilities → Select your Team
- **Build fails**: Clean build folder (Cmd + Shift + K) then rebuild

---

## Database Tables
| Table | Purpose |
|-------|---------|
| categories | Product categories (New Sneakers, Used Sneakers, Pokemon) |
| products | All inventory items with quantity, price, images |
| customers | User accounts with addresses |
| orders | Purchase records from all channels |
| inventory_logs | Audit trail for stock changes |
| scheduled_drops | Upcoming product releases |

## Priority #1: Real-Time Inventory Sync
All channels must see instant stock updates to prevent overselling.

---

## Notes
- Replacing Lightspeed (current POS/inventory system)
- Client has Apple Developer account ready
- Using Clover POS hardware, connected to Stripe
- eBay/Whatnot start with manual sync, automate later
- 2026-02-04: Admin inventory system fully built by Kyle. App compiles clean.
- 2026-02-04: StockX OAuth login blocked by callback URL issue (needs HTTPS domain). See TASKS.md.
- 2026-02-04: Handed off to partner to set up domain and finish StockX callback.

## Links
- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Plan File: /Users/bozo/.claude/plans/breezy-marinating-jellyfish.md
