# Sneakers API Configuration

**Owner:** Kyle
**Last Updated:** February 4, 2026

---

## StockX API

### Overview
Used for barcode/UPC lookup when scanning NEW sneakers into inventory.
- Auto-populates: Product name, brand, colorway, size, retail price, images
- Requires OAuth 2.0 authentication (user must log into StockX account)

### Credentials

```
# API Key (include in all API requests as header)
x-api-key: qAYBY1lFUv2PVXRldvSf4ya1pkjGhQZ9rxBj4LW7

# OAuth 2.0 Client Credentials (for token exchange)
Client ID: 6iancV9MkHjtn9dIE8VoflhwK0H3jCFc
Client Secret: oTNzarbhweQGzF2aQJn_TPWFbT5y5wvRHuQFxjH-hJ5oweeFocZJ:
```

### OAuth Endpoints

```
Authorization URL: https://accounts.stockx.com/oauth/authorize
Token URL: https://accounts.stockx.com/oauth/token
Audience: gateway.stockx.com
```

### Token Info
- Access Token expires: 12 hours
- Refresh Token expires: 30 days
- Store tokens in iOS Keychain

### Client StockX Account
- The client has a dedicated StockX account for this integration
- Admin users will log in with this account once
- Tokens will be stored and auto-refreshed

### API Endpoints We'll Use

| Endpoint | Purpose |
|----------|---------|
| `GET /catalog/search` | Search products by name/SKU |
| `GET /catalog/products/{id}` | Get product details |
| `GET /catalog/products/{id}/variants` | Get sizes with UPC/GTIN |

### Implementation Status
- [x] OAuth login flow (`StockXAuthManager.swift`)
- [x] Token storage in Keychain (`KeychainHelper.swift`)
- [x] Token refresh logic (`StockXAuthManager.refreshTokenIfNeeded()`)
- [x] Product search (`StockXService.searchProducts()`)
- [x] Get product details (`StockXService.getProduct()`)
- [x] Get variants with UPC (`StockXService.getProductVariants()`)
- [x] Barcode-to-variant matching (`StockXService.lookupByBarcode()`)
- [ ] Test OAuth flow end-to-end (need to register URL scheme)
- [ ] Image fetching (display in product entry form)

---

## Alternative APIs (Backup)

If StockX API has issues, these are backups:

### Sneaks-API (Open Source)
- GitHub: https://github.com/druv5319/Sneaks-API
- Free, but requires self-hosting
- Aggregates StockX, Goat, FlightClub data

### Retailed.io
- Paid service
- Direct UPC lookup available
- URL: https://www.retailed.io/datasources/api/sneaker-ean-upc
