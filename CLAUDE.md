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

## Database Tables
- categories
- products
- customers
- orders
- inventory_logs
- scheduled_drops

## Priority #1: Real-Time Inventory Sync
All channels must see instant stock updates to prevent overselling.

## Current Phase
Phase 2: iOS App Development - Core Structure Complete

## Completed Setup
- [x] Supabase project created
- [x] Database tables: categories, products, customers, orders, inventory_logs, scheduled_drops
- [x] Row Level Security (RLS) policies applied
- [x] Realtime enabled for: products, orders, scheduled_drops
- [x] Storage bucket: product-images
- [x] Functions: deduct_inventory, restore_inventory, generate_order_number
- [x] Default categories inserted: New Sneakers, Used Sneakers, Pokemon

## File Structure (Created)

### iOS App
```
/SecuredApp/SecuredApp/
├── App/
│   ├── SecuredAppApp.swift      # App entry point
│   └── ContentView.swift        # Tab navigation
├── Models/
│   ├── Product.swift            # Product model
│   ├── Category.swift           # Category model
│   ├── Customer.swift           # Customer + Address
│   ├── Order.swift              # Order model
│   └── Cart.swift               # Shopping cart
├── Views/
│   ├── Shop/
│   │   ├── ShopView.swift       # Main shop + categories
│   │   ├── ProductGridView.swift # Product grid
│   │   └── ProductDetailView.swift # Product detail
│   ├── Cart/
│   │   ├── CartView.swift       # Cart view
│   │   └── CheckoutView.swift   # Checkout flow
│   └── Profile/
│       └── ProfileView.swift    # Profile + Auth
├── ViewModels/
│   ├── ProductViewModel.swift   # Product data + real-time
│   ├── CartViewModel.swift      # Cart state
│   └── AuthViewModel.swift      # Auth state
└── Services/
    └── SupabaseService.swift    # Supabase client
```

### Website
```
/secured-app-web
  /app
  /components
  /lib
```

## How to Open iOS App in Xcode

### Step 1: Open Xcode
1. Open **Xcode** from Applications folder (or Spotlight: Cmd+Space, type "Xcode")
2. If first time, wait for it to install components

### Step 2: Create New Project
1. Click **"Create New Project"** (or File → New → Project)
2. Select **iOS** tab at top
3. Select **App** → Click **Next**
4. Fill in:
   - Product Name: `SecuredApp`
   - Team: Select your Apple Developer account
   - Organization Identifier: `com.secured`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Uncheck "Include Tests"
5. Click **Next**
6. Save location: `/Applications/Secured App/`
7. Click **Create**

### Step 3: Add Supabase Package
1. In Xcode menu: **File → Add Package Dependencies**
2. In search bar, paste: `https://github.com/supabase/supabase-swift`
3. Click **Add Package**
4. Wait for it to load, then click **Add Package** again
5. Select **Supabase** from the list → Click **Add Package**

### Step 4: Add Stripe Package
1. **File → Add Package Dependencies** again
2. Paste: `https://github.com/stripe/stripe-ios`
3. Click **Add Package** → Select **Stripe** → **Add Package**

### Step 5: Import Source Files
1. In Finder, navigate to: `/Applications/Secured App/SecuredApp/SecuredApp/`
2. You'll see folders: `App`, `Models`, `Views`, `ViewModels`, `Services`
3. In Xcode, right-click on **SecuredApp** folder (yellow folder icon) in left sidebar
4. Select **"Add Files to SecuredApp..."**
5. Select ALL 5 folders (App, Models, Views, ViewModels, Services)
6. Check ✓ "Copy items if needed"
7. Check ✓ "Create groups"
8. Check ✓ "Add to targets: SecuredApp"
9. Click **Add**

### Step 6: Delete Duplicate Files
Xcode auto-created some files we're replacing:
1. In Xcode sidebar, find and delete:
   - `ContentView.swift` (the original one Xcode made)
   - `SecuredAppApp.swift` (the original one Xcode made)
2. Right-click → Delete → **Move to Trash**

### Step 7: Build & Run
1. At top of Xcode, select a simulator (e.g., "iPhone 15 Pro")
2. Press **Cmd + R** (or click the Play button)
3. Wait for build to complete
4. App will launch in simulator

### Troubleshooting
- If build fails with "No such module 'Supabase'": Wait for packages to finish downloading (check progress in Xcode navigator)
- If "Signing" error: Go to project settings → Signing & Capabilities → Select your Team
- If files not found: Make sure you added files to the correct target

## Notes
- Replacing Lightspeed (current POS/inventory system)
- Client has Apple Developer account ready
- Using Clover POS hardware, connected to Stripe
- eBay/Whatnot start with manual sync, automate in Phase 2

## Links
- Plan File: /Users/bozo/.claude/plans/breezy-marinating-jellyfish.md
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Clover Docs: https://docs.clover.com
