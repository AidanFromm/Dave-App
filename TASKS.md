# Secured App - Task Tracker

## How To Use This File
- Mark tasks with `[ ]` (not started), `[~]` (in progress), `[x]` (done)
- Add your name when you start a task: `[~] Task name - @Kyle`
- Always `git pull` before starting work, `git push` after finishing

---

## ACTIVE WORK LOG

### Kyle is currently working on: ADMIN INVENTORY SYSTEM
**Started:** February 4, 2026

**What I'm building:**
- Admin-only inventory scanner in the iOS app (hidden tab for admins)
- Barcode scanning using iPhone camera + Bluetooth scanner support
- StockX API integration for automatic product lookup (I have the API key)
- Scan workflow: Scan barcode → Auto-fill product data → Choose New/Used → Set price → Add to inventory
- For NEW items: Auto-pull images from StockX
- For USED items: Upload custom photos
- All inventory changes logged for audit trail

**Files I'm creating/modifying:**
- Views/Admin/ (new folder for admin views)
- Services/StockXService.swift (new - API integration)
- Services/BarcodeScannerService.swift (new - camera/scanner handling)
- ViewModels/InventoryViewModel.swift (new)
- Models/ (may need updates for admin fields)

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
- [~] Design admin inventory scanner UI - @Kyle
- [ ] Implement barcode scanning (camera + bluetooth)
- [ ] StockX API integration for product lookup
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

### February 4, 2026
- [x] Set up Xcode project - @Kyle
- [x] Added Supabase Swift SDK - @Kyle
- [x] Added Stripe iOS SDK - @Kyle
- [x] Fixed all build errors (15+ issues) - @Kyle
- [x] App successfully runs in simulator - @Kyle
- [x] Set up Git collaboration system - @Kyle
- [x] Created TASKS.md and COLLABORATION.md - @Kyle

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
- 2026-02-04: Kyle starting admin inventory system. Partner will handle Pokemon items.
- 2026-02-04: Using StockX API for sneaker barcode lookups (Kyle has API key)
- 2026-02-04: App is now building and running successfully after fixing Swift 6 issues
