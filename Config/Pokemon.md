# Pokemon API Configuration

**Owner:** Partner (Not Kyle)
**Last Updated:** February 4, 2026
**Status:** NOT STARTED - Assigned to Partner

---

## Overview

This integration will handle Pokemon card/product entry into inventory.

## Suggested APIs to Research

### TCGPlayer API
- URL: https://docs.tcgplayer.com/docs
- Good for: Pokemon cards, pricing, catalog data
- Features: Card lookup, market prices, images

### Pokemon TCG API
- URL: https://pokemontcg.io/
- Free API for Pokemon card data
- Features: Card images, sets, rarities

### Barcode Lookup
- Pokemon products have standard UPCs
- May need UPCitemdb.com as backup

## Credentials

```
# TCGPlayer (TO BE ADDED BY PARTNER)
TCGPLAYER_API_KEY=
TCGPLAYER_ACCESS_TOKEN=

# Pokemon TCG API (TO BE ADDED BY PARTNER)
POKEMON_TCG_API_KEY=
```

## Implementation Tasks (For Partner)

- [ ] Research best API for Pokemon products
- [ ] Get API credentials
- [ ] Design Pokemon entry flow
- [ ] Handle card grading/condition
- [ ] Pokemon-specific fields (set, rarity, edition)

---

## Notes for Partner

Kyle is handling the sneaker/StockX integration. Once that's working, you can use it as a template for the Pokemon system. The architecture will be similar:

1. Admin-only access
2. Scan/search to find product
3. Auto-populate data from API
4. Set condition and price
5. Add to inventory

Check TASKS.md for current progress and what's been done.
