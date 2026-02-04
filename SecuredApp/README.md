# Secured App - iOS

SwiftUI e-commerce app for Secured Tampa sneaker/Pokemon store.

## Setup Instructions

### 1. Open in Xcode

1. Open Xcode
2. File → New → Project
3. Choose "App" under iOS
4. Product Name: `SecuredApp`
5. Team: Select your Apple Developer team
6. Organization Identifier: `com.secured` (or your identifier)
7. Interface: SwiftUI
8. Language: Swift
9. Storage: None
10. Create the project in `/Applications/Secured App/`

### 2. Add Swift Packages

In Xcode: File → Add Package Dependencies

Add these packages:
- `https://github.com/supabase/supabase-swift` (version 2.0.0+)
- `https://github.com/stripe/stripe-ios` (version 23.0.0+)

### 3. Copy Source Files

Copy all files from `SecuredApp/` folders into your Xcode project:
- `App/` → Main app files
- `Models/` → Data models
- `Views/` → SwiftUI views
- `ViewModels/` → ObservableObject classes
- `Services/` → API services

### 4. Update Bundle Identifier

In Xcode project settings:
- Set Bundle Identifier to your app ID
- Set Display Name to "Secured"
- Minimum deployment target: iOS 17.0

### 5. Run the App

1. Select a simulator or device
2. Press Cmd+R to build and run

## Project Structure

```
SecuredApp/
├── App/
│   ├── SecuredAppApp.swift     # App entry point
│   └── ContentView.swift       # Tab navigation
├── Models/
│   ├── Product.swift           # Product model
│   ├── Category.swift          # Category model
│   ├── Customer.swift          # Customer model
│   ├── Order.swift             # Order model
│   └── Cart.swift              # Shopping cart
├── Views/
│   ├── Shop/
│   │   ├── ShopView.swift      # Main shop screen
│   │   ├── ProductGridView.swift
│   │   └── ProductDetailView.swift
│   ├── Cart/
│   │   ├── CartView.swift      # Shopping cart
│   │   └── CheckoutView.swift  # Checkout flow
│   └── Profile/
│       └── ProfileView.swift   # User profile
├── ViewModels/
│   ├── ProductViewModel.swift  # Product data management
│   ├── CartViewModel.swift     # Cart state
│   └── AuthViewModel.swift     # Authentication
└── Services/
    └── SupabaseService.swift   # Supabase API client
```

## Features

- [x] Product browsing with categories
- [x] Product detail view
- [x] Shopping cart
- [x] Checkout flow (shipping/pickup)
- [x] User authentication
- [x] Real-time inventory updates
- [ ] Stripe payment integration (coming soon)
- [ ] Push notifications
- [ ] Size alerts

## Supabase Configuration

The app connects to:
- URL: `https://wupfvvwypyvzkznekksw.supabase.co`
- Anon Key: Configured in `SupabaseService.swift`
