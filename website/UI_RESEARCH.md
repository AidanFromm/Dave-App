# SecuredTampa — UI Design System

> **Version:** 1.0 · **Date:** Feb 13, 2026
> **Brand:** SecuredTampa — Sneakers + Pokémon Cards · Tampa, FL
> **Owner:** Dave · Denver Broncos color identity

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout & Grid](#layout--grid)
5. [Component Library](#component-library)
6. [Page Templates](#page-templates)
7. [Admin Dashboard](#admin-dashboard)
8. [iPad Kiosk Mode](#ipad-kiosk-mode)
9. [Staff View](#staff-view)
10. [Motion & Interaction](#motion--interaction)
11. [Tailwind Configuration](#tailwind-configuration)

---

## 1. Design Philosophy

### Inspiration Sources

| Site | What to steal |
|------|--------------|
| **Flight Club** | Dark background, massive product photography, minimal chrome, grid-heavy catalog |
| **GOAT** | Clean product cards with price/condition badges, excellent mobile UX, instant search |
| **Stadium Goods** | Hero editorial sections, brand storytelling mixed with commerce |
| **Round Two** | Vintage/streetwear energy, Instagram-native aesthetic, community feel |
| **TCGplayer** | Market pricing, condition grading UI, seller/listing model, price history charts |
| **CardMarket** | Dense data tables for power users, set filters, condition matrix |
| **Shopify Admin** | Clean sidebar nav, card-based dashboard, consistent form patterns |
| **Square Dashboard** | Real-time sales widgets, clean analytics, receipt/order timeline |

### Core Principles

1. **Dark-first** — Sneaker culture lives in dark mode. Black backgrounds make product photos pop.
2. **Mobile-first** — Dave's on his phone. Customers are on their phones. Design at 375px, scale up.
3. **Photography is king** — Huge, clean product images. No clutter around them.
4. **Streetwear, not corporate** — Bold type, tight spacing, subtle grit. Think Nike SNKRS, not Amazon.
5. **Dual-product aware** — Sneakers and cards are different shopping experiences. Cards need data density; sneakers need visual impact.

---

## 2. Color System

### Primary Palette (Denver Broncos)

```
Broncos Orange:  #FB4F14  — Primary accent, CTAs, highlights, active states
Broncos Navy:    #002244  — Secondary accent, headers, depth layers
```

### Extended Dark Theme

```
Background 950:  #0A0A0B  — Page background (near-black, not pure black)
Background 900:  #111113  — Card/surface background
Background 850:  #1A1A1D  — Elevated surface (modals, dropdowns)
Background 800:  #232328  — Borders, dividers, input backgrounds
Background 700:  #2E2E35  — Hover states on surfaces

Text 50:         #FAFAFA  — Primary text
Text 200:        #A1A1AA  — Secondary/muted text
Text 400:        #71717A  — Tertiary/placeholder text

Success:         #22C55E  — In stock, completed, profit
Warning:         #F59E0B  — Low stock, pending
Error:           #EF4444  — Out of stock, errors, loss
Info:            #3B82F6  — Links, informational
```

### Orange Variants (for gradients, hover, active)

```
Orange 50:       #FFF7ED
Orange 100:      #FFEDD5
Orange 200:      #FED7AA
Orange 300:      #FDBA74
Orange 400:      #FB923C
Orange 500:      #FB4F14  — Base
Orange 600:      #E04510
Orange 700:      #C53D0E
Orange 800:      #9A3412
Orange 900:      #7C2D12
```

### Navy Variants

```
Navy 50:         #EFF6FF
Navy 100:        #DBEAFE
Navy 200:        #BFDBFE
Navy 300:        #93C5FD
Navy 400:        #60A5FA
Navy 500:        #3B82F6
Navy 600:        #002244  — Base
Navy 700:        #001B36
Navy 800:        #001528
Navy 900:        #000E1A
```

### Tailwind Color Tokens

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          orange: {
            DEFAULT: '#FB4F14',
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#FB4F14',
            600: '#E04510',
            700: '#C53D0E',
            800: '#9A3412',
            900: '#7C2D12',
          },
          navy: {
            DEFAULT: '#002244',
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#002244',
            700: '#001B36',
            800: '#001528',
            900: '#000E1A',
          },
        },
        surface: {
          950: '#0A0A0B',
          900: '#111113',
          850: '#1A1A1D',
          800: '#232328',
          700: '#2E2E35',
        },
      },
    },
  },
}
```

---

## 3. Typography

### Font Stack

**Primary: `"Inter"` (body, UI, data)**
- Clean, highly readable at small sizes, excellent for both mobile and data-dense views
- Available on Google Fonts, variable weight
- `font-family: 'Inter', system-ui, -apple-system, sans-serif`

**Display: `"Oswald"` or `"Bebas Neue"` (headlines, hero text, price tags)**
- Condensed, bold, uppercase — pure sneaker culture energy
- Used for product names, section headers, hero CTAs
- `font-family: 'Oswald', 'Bebas Neue', sans-serif`

**Mono: `"JetBrains Mono"` (prices, SKUs, order numbers)**
- Clean monospace for tabular data
- `font-family: 'JetBrains Mono', 'Fira Code', monospace`

### Type Scale (Tailwind classes)

```
Hero:        text-4xl md:text-6xl font-display font-bold uppercase tracking-tight
Page Title:  text-2xl md:text-3xl font-display font-bold uppercase tracking-tight
Section:     text-xl md:text-2xl font-display font-semibold uppercase
Card Title:  text-base font-semibold
Body:        text-sm md:text-base font-normal
Caption:     text-xs text-text-200
Price:       text-lg md:text-xl font-mono font-bold
Price Small: text-sm font-mono font-semibold
SKU/Code:    text-xs font-mono text-text-400
```

### Tailwind Font Config

```js
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  display: ['Oswald', 'Bebas Neue', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
},
```

---

## 4. Layout & Grid

### Breakpoints

```
sm:   640px   — Large phones landscape
md:   768px   — Tablets
lg:   1024px  — iPad landscape, small laptops
xl:   1280px  — Desktop
2xl:  1536px  — Large desktop
```

### Product Grid

```
Mobile (default):  grid-cols-2 gap-3
Tablet (md):       grid-cols-3 gap-4
Desktop (lg):      grid-cols-4 gap-5
Wide (xl):         grid-cols-5 gap-6
```

### Card Grid (Cards/Pokémon)

```
Mobile (default):  grid-cols-2 gap-2       — Cards are smaller, tighter grid
Tablet (md):       grid-cols-3 gap-3
Desktop (lg):      grid-cols-4 md:grid-cols-5 gap-4
Wide (xl):         grid-cols-6 gap-4       — Cards can go denser
```

### Container

```html
<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
```

### Spacing Scale

```
Section gap:    py-12 md:py-16
Card padding:   p-3 md:p-4
Input padding:  px-3 py-2
Button padding: px-4 py-2.5 md:px-6 md:py-3
```

---

## 5. Component Library

### 5.1 Product Card — Sneakers

```html
<div class="group relative bg-surface-900 rounded-xl overflow-hidden
            border border-surface-800 hover:border-brand-orange/30
            transition-all duration-200">
  <!-- Image -->
  <div class="aspect-square bg-surface-850 p-4 relative">
    <img class="w-full h-full object-contain group-hover:scale-105
                transition-transform duration-300" />
    <!-- Badges -->
    <span class="absolute top-2 left-2 bg-brand-orange text-white
                 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
      New
    </span>
    <!-- Quick action -->
    <button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                   transition-opacity bg-surface-900/80 p-2 rounded-full">
      ♡
    </button>
  </div>
  <!-- Info -->
  <div class="p-3">
    <p class="text-xs text-text-400 uppercase tracking-wider">Jordan</p>
    <h3 class="text-sm font-semibold text-text-50 line-clamp-2 mt-0.5">
      Air Jordan 1 Retro High OG "Chicago"
    </h3>
    <div class="mt-2 flex items-baseline gap-2">
      <span class="text-base font-mono font-bold text-brand-orange">$385</span>
      <span class="text-xs font-mono text-text-400 line-through">$450</span>
    </div>
    <div class="mt-1.5 flex gap-1">
      <!-- Size pills -->
      <span class="text-[10px] px-1.5 py-0.5 bg-surface-800 rounded text-text-200">8</span>
      <span class="text-[10px] px-1.5 py-0.5 bg-surface-800 rounded text-text-200">9.5</span>
      <span class="text-[10px] px-1.5 py-0.5 bg-surface-800 rounded text-text-400">+3</span>
    </div>
  </div>
</div>
```

### 5.2 Product Card — Pokémon Card

```html
<div class="group relative bg-surface-900 rounded-lg overflow-hidden
            border border-surface-800 hover:border-brand-orange/30
            transition-all duration-200">
  <!-- Card Image (portrait aspect) -->
  <div class="aspect-[2.5/3.5] bg-surface-850 p-2 relative">
    <img class="w-full h-full object-contain rounded
                group-hover:scale-105 transition-transform duration-300" />
    <!-- Condition badge -->
    <span class="absolute bottom-2 right-2 bg-green-500/90 text-white
                 text-[10px] font-bold px-1.5 py-0.5 rounded">
      NM
    </span>
  </div>
  <!-- Info -->
  <div class="p-2.5">
    <p class="text-[10px] text-text-400 uppercase tracking-wider">
      Scarlet & Violet · #123
    </p>
    <h3 class="text-xs font-semibold text-text-50 line-clamp-2 mt-0.5">
      Charizard ex SAR
    </h3>
    <div class="mt-1.5 flex items-baseline justify-between">
      <span class="text-sm font-mono font-bold text-brand-orange">$89.99</span>
      <span class="text-[10px] text-text-400">TCG: $85</span>
    </div>
  </div>
</div>
```

### 5.3 Navigation — Mobile Bottom Bar

```html
<!-- Mobile: fixed bottom nav (à la GOAT/SNKRS) -->
<nav class="fixed bottom-0 inset-x-0 bg-surface-900/95 backdrop-blur-lg
            border-t border-surface-800 z-50 md:hidden
            safe-area-inset-bottom">
  <div class="flex justify-around py-2">
    <a class="flex flex-col items-center gap-0.5 text-text-400
              active:text-brand-orange">
      <HomeIcon class="w-5 h-5" />
      <span class="text-[10px]">Home</span>
    </a>
    <a class="flex flex-col items-center gap-0.5">
      <SearchIcon class="w-5 h-5" />
      <span class="text-[10px]">Search</span>
    </a>
    <a class="flex flex-col items-center gap-0.5">
      <GridIcon class="w-5 h-5" />
      <span class="text-[10px]">Shop</span>
    </a>
    <a class="flex flex-col items-center gap-0.5 relative">
      <CartIcon class="w-5 h-5" />
      <span class="text-[10px]">Cart</span>
      <!-- Badge -->
      <span class="absolute -top-1 -right-1 bg-brand-orange text-white
                   text-[8px] font-bold w-4 h-4 rounded-full flex
                   items-center justify-center">3</span>
    </a>
    <a class="flex flex-col items-center gap-0.5">
      <UserIcon class="w-5 h-5" />
      <span class="text-[10px]">Account</span>
    </a>
  </div>
</nav>
```

### 5.4 Navigation — Desktop Top Bar

```html
<header class="sticky top-0 z-50 bg-surface-950/95 backdrop-blur-lg
               border-b border-surface-800">
  <div class="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
    <!-- Logo -->
    <a class="font-display text-2xl font-bold uppercase text-text-50
              tracking-tight">
      Secured<span class="text-brand-orange">Tampa</span>
    </a>
    <!-- Center nav -->
    <nav class="hidden md:flex items-center gap-8">
      <a class="text-sm font-semibold uppercase tracking-wider text-text-50
                hover:text-brand-orange transition-colors">Sneakers</a>
      <a class="text-sm font-semibold uppercase tracking-wider text-text-200
                hover:text-brand-orange transition-colors">Cards</a>
      <a class="text-sm font-semibold uppercase tracking-wider text-text-200
                hover:text-brand-orange transition-colors">New Arrivals</a>
    </nav>
    <!-- Right actions -->
    <div class="flex items-center gap-4">
      <button class="p-2 text-text-200 hover:text-text-50">
        <SearchIcon class="w-5 h-5" />
      </button>
      <button class="p-2 text-text-200 hover:text-text-50 relative">
        <CartIcon class="w-5 h-5" />
      </button>
    </div>
  </div>
</header>
```

### 5.5 Search — Full Screen Overlay (Mobile)

Inspired by GOAT's instant search:

```html
<div class="fixed inset-0 z-50 bg-surface-950">
  <!-- Search input -->
  <div class="flex items-center gap-3 px-4 py-3 border-b border-surface-800">
    <SearchIcon class="w-5 h-5 text-text-400 shrink-0" />
    <input class="flex-1 bg-transparent text-text-50 text-base
                  placeholder:text-text-400 outline-none"
           placeholder="Search sneakers, cards, brands..." autofocus />
    <button class="text-sm text-brand-orange font-semibold">Cancel</button>
  </div>
  <!-- Trending / Recent -->
  <div class="px-4 py-4">
    <p class="text-xs font-semibold uppercase tracking-wider text-text-400 mb-3">
      Trending
    </p>
    <div class="flex flex-wrap gap-2">
      <span class="px-3 py-1.5 bg-surface-800 rounded-full text-sm text-text-200">
        Jordan 4
      </span>
      <span class="px-3 py-1.5 bg-surface-800 rounded-full text-sm text-text-200">
        Charizard
      </span>
    </div>
  </div>
  <!-- Results (instant, as you type) -->
  <div class="px-4 divide-y divide-surface-800">
    <!-- Result row -->
    <a class="flex items-center gap-3 py-3">
      <img class="w-12 h-12 rounded-lg bg-surface-850 object-contain" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-text-50 truncate">
          Air Jordan 4 "Bred Reimagined"
        </p>
        <p class="text-xs text-text-400">Sneakers · 6 available</p>
      </div>
      <span class="text-sm font-mono font-bold text-brand-orange">$310</span>
    </a>
  </div>
</div>
```

### 5.6 Filter Bar

```html
<div class="flex gap-2 overflow-x-auto no-scrollbar px-4 py-3
            border-b border-surface-800">
  <!-- Active filter -->
  <button class="shrink-0 flex items-center gap-1.5 px-3 py-1.5
                 bg-brand-orange text-white text-sm font-semibold rounded-full">
    Size: 10
    <XIcon class="w-3.5 h-3.5" />
  </button>
  <!-- Inactive filters -->
  <button class="shrink-0 px-3 py-1.5 bg-surface-800 text-text-200
                 text-sm rounded-full border border-surface-700">
    Brand ▾
  </button>
  <button class="shrink-0 px-3 py-1.5 bg-surface-800 text-text-200
                 text-sm rounded-full border border-surface-700">
    Price ▾
  </button>
  <button class="shrink-0 px-3 py-1.5 bg-surface-800 text-text-200
                 text-sm rounded-full border border-surface-700">
    Condition ▾
  </button>
</div>
```

### 5.7 Buttons

```html
<!-- Primary CTA -->
<button class="w-full bg-brand-orange hover:bg-brand-orange-600
               active:bg-brand-orange-700 text-white font-semibold
               py-3 px-6 rounded-xl transition-colors
               text-sm uppercase tracking-wider">
  Add to Cart — $385
</button>

<!-- Secondary -->
<button class="w-full bg-surface-800 hover:bg-surface-700
               text-text-50 font-semibold py-3 px-6 rounded-xl
               transition-colors text-sm uppercase tracking-wider
               border border-surface-700">
  Make an Offer
</button>

<!-- Ghost -->
<button class="text-brand-orange hover:text-brand-orange-400
               text-sm font-semibold underline-offset-4 hover:underline
               transition-colors">
  View All →
</button>

<!-- Icon button -->
<button class="p-2.5 bg-surface-800 hover:bg-surface-700
               rounded-xl border border-surface-700 transition-colors">
  <HeartIcon class="w-5 h-5 text-text-200" />
</button>
```

### 5.8 Order Card (Shared: Admin + Customer)

```html
<div class="bg-surface-900 rounded-xl border border-surface-800 p-4">
  <div class="flex items-start justify-between mb-3">
    <div>
      <p class="text-xs font-mono text-text-400">#ST-2024-0847</p>
      <p class="text-sm font-semibold text-text-50 mt-0.5">John D.</p>
    </div>
    <span class="px-2.5 py-1 bg-yellow-500/10 text-yellow-500
                 text-xs font-semibold rounded-full">
      Pending
    </span>
  </div>
  <!-- Items -->
  <div class="flex gap-2 mb-3">
    <img class="w-14 h-14 rounded-lg bg-surface-850 object-contain" />
    <img class="w-14 h-14 rounded-lg bg-surface-850 object-contain" />
    <div class="w-14 h-14 rounded-lg bg-surface-800 flex items-center
                justify-center text-xs text-text-400">+2</div>
  </div>
  <div class="flex items-center justify-between">
    <span class="text-sm font-mono font-bold text-text-50">$724.00</span>
    <span class="text-xs text-text-400">2 min ago</span>
  </div>
</div>
```

### 5.9 Badge / Status System

```
New Arrival:   bg-brand-orange text-white
In Stock:      bg-green-500/10 text-green-500
Low Stock:     bg-yellow-500/10 text-yellow-500
Out of Stock:  bg-red-500/10 text-red-500
Pending:       bg-yellow-500/10 text-yellow-500
Shipped:       bg-blue-500/10 text-blue-500
Delivered:     bg-green-500/10 text-green-500
Cancelled:     bg-red-500/10 text-red-500
NM (Near Mint):  bg-green-500/90 text-white
LP (Light Play): bg-yellow-500/90 text-white
MP (Moderate):   bg-orange-500/90 text-white
HP (Heavy Play): bg-red-500/90 text-white
```

---

## 6. Page Templates

### 6.1 Home Page

```
┌────────────────────────────────────────┐
│ HEADER (sticky, blur backdrop)         │
├────────────────────────────────────────┤
│                                        │
│ HERO — Full-width image/video          │
│ "SECURED TAMPA"                        │
│ Tagline + dual CTA: Shop Kicks | Cards │
│                                        │
├────────────────────────────────────────┤
│ NEW DROPS — Horizontal scroll strip    │
│ [card] [card] [card] [card] →          │
├────────────────────────────────────────┤
│ FEATURED SNEAKERS — 2-col grid mobile  │
│ [  ] [  ]                              │
│ [  ] [  ]                              │
│ View All →                             │
├────────────────────────────────────────┤
│ POKÉMON CARDS — 2-col grid             │
│ [  ] [  ]                              │
│ [  ] [  ]                              │
│ View All →                             │
├────────────────────────────────────────┤
│ ABOUT / TRUST — Location, reviews      │
├────────────────────────────────────────┤
│ FOOTER                                 │
└────────────────────────────────────────┘
│ MOBILE BOTTOM NAV (fixed)              │
```

### 6.2 Product Detail Page — Sneaker

```
┌────────────────────────────────────────┐
│ ← Back          Share  ♡              │
├────────────────────────────────────────┤
│                                        │
│  [Main Image — swipeable gallery]      │
│  • • • •                               │
│                                        │
├────────────────────────────────────────┤
│ Jordan                                 │
│ AIR JORDAN 1 RETRO HIGH OG "CHICAGO"   │
│ SKU: 555088-170                        │
│                                        │
│ $385           Market: $410            │
│                                        │
│ SIZE ─────────────────────────          │
│ [7] [7.5] [8] [8.5] [9] [9.5]         │
│ [10] [10.5] [11] [11.5] [12]          │
│                                        │
│ CONDITION ────────────────────          │
│ ● New   ○ Used                         │
│                                        │
│ ┌──────────────────────────┐           │
│ │  ADD TO CART — $385      │           │
│ └──────────────────────────┘           │
│ ┌──────────────────────────┐           │
│ │  MAKE AN OFFER           │           │
│ └──────────────────────────┘           │
│                                        │
│ DETAILS ──────────────────────          │
│ Colorway: White/Varsity Red-Black      │
│ Release: 2023                          │
│ Retail: $180                           │
│                                        │
│ PRICE HISTORY ────────────────          │
│ [sparkline chart]                      │
│                                        │
│ YOU MAY ALSO LIKE ────────────          │
│ [card] [card] [card] →                 │
└────────────────────────────────────────┘
```

### 6.3 Product Detail — Pokémon Card

Same layout but with:
- Portrait card image (no multi-angle)
- Condition selector: NM / LP / MP / HP
- Set info, card number, rarity
- TCGplayer market price comparison
- Population / PSA data if graded

### 6.4 Cart & Checkout

Slide-up drawer on mobile (not a separate page):

```html
<div class="fixed inset-0 z-50">
  <!-- Overlay -->
  <div class="absolute inset-0 bg-black/60" />
  <!-- Drawer -->
  <div class="absolute bottom-0 inset-x-0 bg-surface-900
              rounded-t-2xl max-h-[85vh] overflow-y-auto">
    <!-- Handle -->
    <div class="flex justify-center py-3">
      <div class="w-10 h-1 bg-surface-700 rounded-full" />
    </div>
    <!-- Content -->
    <div class="px-4 pb-safe">
      <h2 class="font-display text-xl uppercase font-bold mb-4">
        Your Cart (3)
      </h2>
      <!-- Items -->
      <!-- ... -->
      <!-- Summary -->
      <div class="border-t border-surface-800 pt-4 mt-4">
        <div class="flex justify-between text-sm mb-1">
          <span class="text-text-200">Subtotal</span>
          <span class="font-mono font-bold">$724.00</span>
        </div>
        <div class="flex justify-between text-sm mb-4">
          <span class="text-text-200">Shipping</span>
          <span class="font-mono text-green-500">FREE</span>
        </div>
        <button class="w-full bg-brand-orange text-white font-semibold
                       py-3.5 rounded-xl text-sm uppercase tracking-wider">
          Checkout — $724.00
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## 7. Admin Dashboard

### Layout

```
Desktop: Sidebar (240px) + Main content
Mobile:  Bottom tabs or hamburger → slide-out sidebar
```

### Sidebar Navigation

```
┌──────────────────────┐
│ SECURED TAMPA [admin]│
│ ─────────────────── │
│ 📊 Dashboard         │
│ 📦 Orders        (12)│
│ 👟 Sneakers          │
│ 🃏 Cards             │
│ 👥 Customers         │
│ 📈 Analytics         │
│ ─────────────────── │
│ ⚙️ Settings          │
│ 🏪 View Store →      │
└──────────────────────┘
```

### Dashboard Home

```
┌─────────────────────────────────────────────────┐
│  Good evening, Dave                    Feb 13   │
├────────────┬────────────┬────────────┬──────────┤
│ Today's    │ Orders     │ Items      │ Avg      │
│ Revenue    │ Today      │ Sold       │ Order    │
│ $2,847     │ 8          │ 12         │ $356     │
│ ↑ 12%      │ ↑ 3        │            │          │
├────────────┴────────────┴────────────┴──────────┤
│                                                  │
│ Revenue Chart (7d / 30d / 90d toggle)            │
│ ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇█                            │
│                                                  │
├──────────────────────┬──────────────────────────│
│ Recent Orders        │ Low Stock Alerts          │
│ ┌──────────────────┐ │ • AJ1 Chicago sz10 (1)   │
│ │ Order #847       │ │ • Charizard NM (2)       │
│ │ Pending · $385   │ │ • Dunk Low sz9 (1)       │
│ └──────────────────┘ │                          │
│ ┌──────────────────┐ │ Quick Actions            │
│ │ Order #846       │ │ [+ Add Sneaker]          │
│ │ Shipped · $289   │ │ [+ Add Card]             │
│ └──────────────────┘ │ [📷 Quick Scan]           │
└──────────────────────┴──────────────────────────┘
```

### Stat Card

```html
<div class="bg-surface-900 rounded-xl border border-surface-800 p-4">
  <p class="text-xs text-text-400 uppercase tracking-wider">Today's Revenue</p>
  <p class="text-2xl font-mono font-bold text-text-50 mt-1">$2,847</p>
  <div class="flex items-center gap-1 mt-1">
    <ArrowUpIcon class="w-3.5 h-3.5 text-green-500" />
    <span class="text-xs font-semibold text-green-500">12%</span>
    <span class="text-xs text-text-400">vs yesterday</span>
  </div>
</div>
```

### Inventory Table (Desktop)

```html
<table class="w-full">
  <thead>
    <tr class="border-b border-surface-800">
      <th class="text-left text-xs font-semibold uppercase tracking-wider
                 text-text-400 py-3 px-4">Product</th>
      <th class="text-left text-xs font-semibold uppercase tracking-wider
                 text-text-400 py-3 px-4">SKU</th>
      <th class="text-right ...">Stock</th>
      <th class="text-right ...">Price</th>
      <th class="text-right ...">Status</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-surface-800">
    <tr class="hover:bg-surface-850 transition-colors">
      <td class="py-3 px-4">
        <div class="flex items-center gap-3">
          <img class="w-10 h-10 rounded-lg bg-surface-850 object-contain" />
          <div>
            <p class="text-sm font-semibold text-text-50">AJ1 Chicago</p>
            <p class="text-xs text-text-400">Jordan</p>
          </div>
        </div>
      </td>
      <td class="py-3 px-4 text-xs font-mono text-text-400">555088-170</td>
      <td class="py-3 px-4 text-right text-sm font-mono">3</td>
      <td class="py-3 px-4 text-right text-sm font-mono font-semibold">$385</td>
      <td class="py-3 px-4 text-right">
        <span class="bg-green-500/10 text-green-500 text-xs font-semibold
                     px-2 py-0.5 rounded-full">In Stock</span>
      </td>
    </tr>
  </tbody>
</table>
```

### Inventory List (Mobile — cards not tables)

```html
<div class="divide-y divide-surface-800">
  <div class="flex items-center gap-3 py-3 px-4">
    <img class="w-12 h-12 rounded-lg bg-surface-850 object-contain shrink-0" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-text-50 truncate">AJ1 Chicago</p>
      <p class="text-xs text-text-400">3 in stock · 555088-170</p>
    </div>
    <span class="text-sm font-mono font-bold text-text-50">$385</span>
  </div>
</div>
```

---

## 8. iPad Kiosk Mode

### Design Goals
- **Large touch targets** (min 48px)
- **No keyboard needed** — filter by tapping categories, sizes
- **Auto-rotate** — works landscape and portrait
- **No navigation chrome** — fullscreen, no URL bar
- **Simple:** Browse → Tap → Call staff to purchase

### Layout

```
┌──────────────────────────────────────────────────────┐
│  SECURED TAMPA               🔍 Search    [Sneakers|Cards] │
├──────────────────────────────────────────────────────┤
│                                                       │
│ CATEGORY STRIP (large pills, horizontally scrollable) │
│ [All] [Jordan] [Nike] [Yeezy] [New Balance] [Dunks]  │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  [  Product  ] [  Product  ] [  Product  ]           │
│  [   Card    ] [   Card    ] [   Card    ]           │
│                                                       │
│  [  Product  ] [  Product  ] [  Product  ]           │
│  [   Card    ] [   Card    ] [   Card    ]           │
│                                                       │
│  3-col grid, large cards, big images                  │
│                                                       │
├──────────────────────────────────────────────────────┤
│  Tap a product for details · Ask staff to purchase    │
└──────────────────────────────────────────────────────┘
```

### Kiosk-Specific Styles

```css
/* Large touch targets */
.kiosk-pill { @apply px-6 py-3 text-lg rounded-full; }
.kiosk-card { @apply rounded-2xl; }
.kiosk-card img { @apply p-6; }
.kiosk-card h3 { @apply text-lg; }
.kiosk-price { @apply text-2xl; }

/* No hover effects — touch only */
/* Auto-dim screen after 2min inactivity → screensaver with logo */
```

---

## 9. Staff View

### Purpose
Picking & packing orders. Needs to be fast, scannable, one-handed phone use.

### Layout

```
┌─────────────────────────┐
│ PICK LIST         Today │
│ 8 orders · 12 items     │
├─────────────────────────┤
│                         │
│ ┌─────────────────────┐ │
│ │ 🟡 Order #847       │ │
│ │ John D. · 2 items   │ │
│ │                     │ │
│ │ ☐ AJ1 Chicago sz10  │ │
│ │   Bin: A-12         │ │
│ │ ☐ Charizard NM      │ │
│ │   Bin: C-04         │ │
│ │                     │ │
│ │ [Mark Picked ✓]     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🟡 Order #846       │ │
│ │ Sarah M. · 1 item   │ │
│ │                     │ │
│ │ ☐ Dunk Low sz9      │ │
│ │   Bin: A-07         │ │
│ │                     │ │
│ │ [Mark Picked ✓]     │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│ [Pick] [Pack] [Ship]   │
└─────────────────────────┘
```

### Staff-Specific Patterns

- **Large checkboxes** — 24px, easy to tap with one hand
- **Bin locations** — Prominent, monospace, color-coded by zone
- **Swipe actions** — Swipe right to mark picked, swipe left to flag issue
- **Barcode scan** — Camera button to scan UPC/SKU
- **Status colors:** Yellow = needs pick, Blue = picked/packing, Green = shipped

```html
<!-- Pick item row -->
<div class="flex items-center gap-3 py-3 px-4">
  <input type="checkbox"
         class="w-6 h-6 rounded border-2 border-surface-700
                checked:bg-brand-orange checked:border-brand-orange
                accent-brand-orange" />
  <img class="w-12 h-12 rounded-lg bg-surface-850 object-contain shrink-0" />
  <div class="flex-1">
    <p class="text-sm font-semibold text-text-50">AJ1 Chicago</p>
    <p class="text-xs text-text-400">Size 10 · New</p>
  </div>
  <span class="text-sm font-mono font-bold text-brand-orange
               bg-brand-orange/10 px-2 py-1 rounded">
    A-12
  </span>
</div>
```

---

## 10. Motion & Interaction

### Transitions

```css
/* Standard transition */
transition-all duration-200 ease-out

/* Card hover (desktop only) */
hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-orange/5

/* Page transitions */
animate-in fade-in slide-in-from-bottom-4 duration-300

/* Skeleton loading */
animate-pulse bg-surface-800 rounded
```

### Micro-interactions

1. **Add to cart** — Button ripple + cart icon bounces + badge count animates
2. **Heart/favorite** — Scale pop + fill animation
3. **Pull to refresh** — Orange spinner matching brand
4. **Swipe between images** — Momentum-based, snapping
5. **Filter apply** — Grid re-sort with layout animation (Framer Motion `layoutId`)
6. **Price update** — Number ticker animation

### Loading States

```html
<!-- Skeleton product card -->
<div class="bg-surface-900 rounded-xl overflow-hidden border border-surface-800">
  <div class="aspect-square bg-surface-850 animate-pulse" />
  <div class="p-3 space-y-2">
    <div class="h-3 bg-surface-800 rounded animate-pulse w-16" />
    <div class="h-4 bg-surface-800 rounded animate-pulse w-full" />
    <div class="h-5 bg-surface-800 rounded animate-pulse w-20" />
  </div>
</div>
```

---

## 11. Tailwind Configuration

### Complete `tailwind.config.js`

```js
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Always dark, but allows override
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: {
            DEFAULT: '#FB4F14',
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#FB4F14',
            600: '#E04510',
            700: '#C53D0E',
            800: '#9A3412',
            900: '#7C2D12',
          },
          navy: {
            DEFAULT: '#002244',
            light: '#003366',
            dark: '#001528',
          },
        },
        surface: {
          950: '#0A0A0B',
          900: '#111113',
          850: '#1A1A1D',
          800: '#232328',
          700: '#2E2E35',
          600: '#3F3F46',
        },
        text: {
          50: '#FAFAFA',
          200: '#A1A1AA',
          400: '#71717A',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Oswald', 'Bebas Neue', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', 'Fira Code', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar-hide'),
  ],
}
```

### CSS Custom Properties (for runtime theming)

```css
:root {
  --color-brand-orange: 251 79 20;
  --color-brand-navy: 0 34 68;
  --color-surface-950: 10 10 11;
  --color-surface-900: 17 17 19;
  --color-surface-850: 26 26 29;
  --color-surface-800: 35 35 40;
  --color-text-primary: 250 250 250;
  --color-text-secondary: 161 161 170;
  --color-text-muted: 113 113 122;
}

/* Usage with Tailwind: bg-[rgb(var(--color-brand-orange))] */
```

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
```

---

## Quick Reference: Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Background | `#0A0A0B` not `#000000` | Pure black feels harsh; near-black is premium |
| Card borders | `border-surface-800` | Subtle definition without loudness |
| Orange usage | CTAs, prices, active states only | Orange is powerful — use sparingly for impact |
| Navy usage | Headers, depth layers, gradients | Subtle brand presence without competing with orange |
| Product images | `object-contain` on neutral bg | Let the shoe/card be the star, no cropping |
| Mobile nav | Bottom bar (5 items) | Thumb-reachable, industry standard (GOAT, SNKRS) |
| Tables on mobile | Convert to card lists | Tables don't work on 375px screens |
| Font for prices | Monospace (JetBrains Mono) | Tabular alignment, premium feel |
| Condition badges | Color-coded pills | Instant visual parsing for card collectors |
| Cart | Slide-up drawer | Keeps user in context, no page reload |

---

## Implementation Priority

1. **Phase 1:** Color tokens + typography + base layout (header, nav, footer)
2. **Phase 2:** Product cards (sneaker + card variants) + product grid
3. **Phase 3:** Product detail pages + image gallery
4. **Phase 4:** Cart drawer + checkout flow
5. **Phase 5:** Admin dashboard (stats, orders, inventory)
6. **Phase 6:** Staff pick/pack view
7. **Phase 7:** iPad kiosk mode
8. **Phase 8:** Animations, micro-interactions, polish

---

*This document is the single source of truth for SecuredTampa's UI. All components should reference these tokens and patterns.*
