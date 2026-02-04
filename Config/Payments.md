# Payments Configuration

**Owner:** TBD
**Last Updated:** February 4, 2026
**Status:** NOT STARTED

---

## Stripe (Online Payments)

### Dashboard
https://dashboard.stripe.com

### Credentials (TO BE ADDED)

```
# Stripe API Keys
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Features to Implement
- [ ] Customer checkout (iOS app)
- [ ] Customer checkout (website)
- [ ] Stripe Terminal for in-store POS
- [ ] Webhook for order confirmation
- [ ] Florida sales tax calculation

---

## Clover POS (In-Store)

### Dashboard
https://www.clover.com/dashboard

### Credentials (TO BE CONFIGURED)

```
# Clover API
CLOVER_MERCHANT_ID=
CLOVER_API_KEY=
```

### Features to Implement
- [ ] Sync Clover sales to Supabase
- [ ] Deduct inventory on Clover sale
- [ ] Connect Clover to Stripe reporting

---

## Notes

- Stripe handles online payments
- Clover hardware is already in-store
- Need to sync both to prevent overselling
- Florida sales tax only (single state)
