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
```
# Supabase
SUPABASE_URL=https://wupfvvwypyvzkznekksw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjkzMjIsImV4cCI6MjA4NTc0NTMyMn0.zDSY9wgurlBCEskYvihLmZYqbrt6ovtGj6ntk4WsYDY
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cGZ2dnd5cHl2emt6bmVra3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2OTMyMiwiZXhwIjoyMDg1NzQ1MzIyfQ.0dzNEm4ygSQUEUWuXQqXXzmsslvayB7xpXBWB1BTUVg

# Stripe (TO BE CREATED)
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Clover (TO BE CONFIGURED)
CLOVER_MERCHANT_ID=
CLOVER_API_KEY=

# Firebase (TO BE CREATED)
FIREBASE_PROJECT_ID=
```

---

## Current Phase
**Phase 2: iOS App Development - App Running, Building Admin Inventory System**

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
- [~] **Admin Inventory Scanner** - Kyle working on this
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

### Files to Create
```
SecuredApp/
├── Views/Admin/
│   ├── AdminTabView.swift          # Admin-only tab container
│   ├── InventoryScannerView.swift  # Barcode scanner UI
│   ├── ProductEntryView.swift      # Form after scan
│   └── InventoryListView.swift     # View/edit existing inventory
├── Services/
│   ├── StockXService.swift         # StockX API integration
│   └── BarcodeScannerService.swift # Camera/scanner handling
└── ViewModels/
    └── InventoryViewModel.swift    # Inventory management logic
```

### StockX API Integration
- Kyle has developer API key (will add to credentials)
- Lookup by UPC/barcode returns: name, brand, colorway, size, retail price, images
- Rate limits: TBD based on plan

### Work Division
| Feature | Owner |
|---------|-------|
| Admin Inventory Scanner | Kyle |
| Sneaker barcode lookup (StockX) | Kyle |
| Pokemon item entry | Partner (TCGPlayer API) |
| Website | Partner |
| Stripe checkout | TBD |

---

## Project Structure

```
/Applications/Secured App/
├── CLAUDE.md                    # This file - project memory
├── SecuredApp.xcodeproj         # Xcode project (double-click to open)
├── SecuredApp/                  # iOS source code
│   ├── App/
│   │   ├── SecuredAppApp.swift      # App entry point
│   │   └── ContentView.swift        # Tab navigation
│   ├── Models/
│   │   ├── Product.swift
│   │   ├── Category.swift
│   │   ├── Customer.swift
│   │   ├── Order.swift
│   │   └── Cart.swift
│   ├── Views/
│   │   ├── Shop/
│   │   │   ├── ShopView.swift
│   │   │   ├── ProductGridView.swift
│   │   │   └── ProductDetailView.swift
│   │   ├── Cart/
│   │   │   ├── CartView.swift
│   │   │   └── CheckoutView.swift
│   │   └── Profile/
│   │       └── ProfileView.swift
│   ├── ViewModels/
│   │   ├── ProductViewModel.swift
│   │   ├── CartViewModel.swift
│   │   └── AuthViewModel.swift
│   ├── Services/
│   │   └── SupabaseService.swift
│   └── Assets.xcassets
└── database/                    # SQL migration files
    ├── 001_initial_schema.sql
    ├── 002_row_level_security.sql
    └── 003_realtime_and_storage.sql
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

## Links
- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Plan File: /Users/bozo/.claude/plans/breezy-marinating-jellyfish.md
