# Shippo (GoShippo) API — Shipping Label Integration Research

> Researched: Feb 13, 2026 | For: Dave App (sneaker store shipping)

---

## Table of Contents
1. [Overview](#1-overview)
2. [API Authentication](#2-api-authentication)
3. [Core Flow: Shipments → Rates → Labels](#3-core-flow-shipments--rates--labels)
4. [Supported Carriers](#4-supported-carriers)
5. [Rate Shopping](#5-rate-shopping)
6. [Label Formats](#6-label-formats)
7. [Tracking & Webhooks](#7-tracking--webhooks)
8. [Test Mode vs Live Mode](#8-test-mode-vs-live-mode)
9. [Pricing](#9-pricing)
10. [Shippo vs Direct FedEx API](#10-shippo-vs-direct-fedex-api)
11. [Next.js Integration Pattern](#11-nextjs-integration-pattern)
12. [Sample API Routes](#12-sample-nextjs-api-routes)

---

## 1. Overview

**Shippo** is a multi-carrier shipping API that abstracts away the complexity of individual carrier integrations (FedEx, UPS, USPS, DHL, etc.) behind a single REST API.

- **Base URL:** `https://api.goshippo.com/`
- **Protocol:** HTTPS only (TLS 1.2+)
- **Format:** JSON request/response
- **SDK:** Official Node.js SDK — `npm install shippo`
- **API Version:** `2018-02-08` (set via `SHIPPO-API-VERSION` header)

**Core workflow:**
1. Create **Address** objects (from + to)
2. Create a **Shipment** (addresses + parcel dimensions/weight)
3. Get back **Rates** from all connected carriers
4. Purchase a **Transaction** (label) using the chosen rate
5. **Track** the package via tracking number

---

## 2. API Authentication

Shippo uses **token-based authentication** via HTTP header:

```
Authorization: ShippoToken shippo_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

- **Live token:** `shippo_live_*` — creates real labels, charges real money
- **Test token:** `shippo_test_*` — returns mock data, no charges
- Get tokens at: https://goshippo.com/user/apikeys/

```typescript
// Node.js SDK
import { Shippo } from 'shippo';

const shippo = new Shippo({
  apiKeyHeader: 'shippo_live_your_token_here',
});
```

---

## 3. Core Flow: Shipments → Rates → Labels

### Step 1: Create a Shipment (gets rates automatically)

```typescript
const shipment = await shippo.shipments.create({
  addressFrom: {
    name: "Dave's Sneaker Shop",
    street1: "123 Main St",
    city: "Tampa",
    state: "FL",
    zip: "33601",
    country: "US",
    phone: "555-555-5555",
  },
  addressTo: {
    name: "John Doe",
    street1: "456 Oak Ave",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "US",
    phone: "555-123-4567",
  },
  parcels: [{
    length: "14",    // inches
    width: "12",
    height: "6",
    distanceUnit: "in",
    weight: "3",     // lbs (typical sneaker box)
    massUnit: "lb",
  }],
  async: false,  // Wait for rates (synchronous)
});

// shipment.rates[] now contains rates from all carriers
```

### Step 2: Choose a Rate & Purchase Label (Transaction)

```typescript
// Pick cheapest rate
const cheapest = shipment.rates
  .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))[0];

const transaction = await shippo.transactions.create({
  rate: cheapest.objectId,
  labelFileType: "PDF",
  async: false,
});

// transaction.labelUrl — URL to download the PDF label
// transaction.trackingNumber — tracking number
// transaction.trackingUrlProvider — carrier tracking URL
```

### Key Objects

| Object | Description |
|--------|-------------|
| **Address** | Sender/recipient location |
| **Parcel** | Package dimensions & weight |
| **Shipment** | Combines addresses + parcels; triggers rate fetching |
| **Rate** | A shipping option from a carrier (price, transit time, service level) |
| **Transaction** | A purchased label (contains label URL, tracking number) |
| **Refund** | Request refund for unused labels |

> **Important:** All objects except Carrier Accounts are **immutable** (disposable). You can't update them — create new ones instead.

---

## 4. Supported Carriers

Shippo supports **85+ carriers**. Key ones for a US sneaker store:

| Carrier | Use Case | Notes |
|---------|----------|-------|
| **USPS** | Cheapest for lightweight (<1lb), Priority Mail for sneakers | Shippo provides discounted USPS rates out of the box (no USPS account needed) |
| **FedEx** | Fast ground/express, reliable | Can use Shippo's account OR bring your own (BYOA) |
| **UPS** | Ground shipping, good for heavier packages | BYOA supported |
| **DHL Express** | International shipping | Best for overseas customers |
| **DHL eCommerce** | Budget international | Slower but cheaper |

### Bring Your Own Account (BYOA)
- You can connect your existing FedEx account (account #201536679) to Shippo
- **Pay-as-you-go:** 5¢/label surcharge for BYOA
- **Premier plan:** BYOA is free
- This lets you use your negotiated FedEx rates through Shippo's API

---

## 5. Rate Shopping

When you create a Shipment, Shippo automatically queries **all connected carriers** and returns rates:

```typescript
const rates = shipment.rates;

// Each rate contains:
// - amount: "7.49"
// - currency: "USD"
// - provider: "USPS"
// - servicelevel: { name: "Priority Mail", token: "usps_priority" }
// - estimatedDays: 3
// - durationTerms: "Delivery in 1 to 3 business days"
// - objectId: "rate_xxxxx" (use this to purchase)
```

**Rate shopping strategy for Dave App:**
```typescript
// Sort by price, filter by max delivery days
const eligibleRates = rates
  .filter(r => r.estimatedDays <= 7)  // Max 7 day delivery
  .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));

const cheapest = eligibleRates[0];
const fastest = rates.sort((a, b) => a.estimatedDays - b.estimatedDays)[0];
```

---

## 6. Label Formats

Supported via `labelFileType` parameter on Transaction:

| Format | Value | Use Case |
|--------|-------|----------|
| **PDF** | `"PDF"` | Standard printers, most common |
| **PDF 4x6** | `"PDF_4x6"` | Thermal printers (4x6 labels) |
| **PNG** | `"PNG"` | Web display, email |
| **ZPL** | `"ZPL"` | Zebra thermal printers (raw commands) |

```typescript
const transaction = await shippo.transactions.create({
  rate: rateId,
  labelFileType: "PDF_4x6",  // For thermal printer
  async: false,
});

// transaction.labelUrl — download URL (valid for limited time)
```

**For Dave App:** Use `"PDF"` for starting out. Switch to `"PDF_4x6"` or `"ZPL"` if/when you get a thermal label printer (Zebra, DYMO, Rollo).

---

## 7. Tracking & Webhooks

### Polling (GET)
```typescript
const tracking = await shippo.tracks.get('usps', 'TRACKING_NUMBER_HERE');
// tracking.trackingStatus.status — "PRE_TRANSIT" | "TRANSIT" | "DELIVERED" | "RETURNED" | "FAILURE" | "UNKNOWN"
// tracking.trackingHistory[] — array of all status events
```

### Register for Webhook Updates (POST)
```typescript
// Register tracking + get current status
const tracking = await shippo.tracks.create({
  carrier: 'usps',
  trackingNumber: 'TRACKING_NUMBER_HERE',
});
```

### Webhook Events

Configure webhooks at: https://goshippo.com/user/apikeys/ (or via API)

| Event | Description |
|-------|-------------|
| `transaction_created` | Label purchased |
| `transaction_updated` | Label status changed |
| `track_updated` | **Tracking status changed** (most important) |
| `batch_created` | Batch label job created |
| `batch_purchased` | Batch labels purchased |

### Tracking Statuses
| Status | Meaning |
|--------|---------|
| `PRE_TRANSIT` | Label created, not yet scanned |
| `TRANSIT` | Package in transit |
| `DELIVERED` | Delivered |
| `RETURNED` | Returned to sender |
| `FAILURE` | Delivery failed |
| `UNKNOWN` | Carrier status unrecognized |

### Test Tracking Numbers
In test mode, use carrier `"shippo"` with these tracking numbers:
- `SHIPPO_PRE_TRANSIT`
- `SHIPPO_TRANSIT`
- `SHIPPO_DELIVERED`
- `SHIPPO_RETURNED`
- `SHIPPO_FAILURE`
- `SHIPPO_UNKNOWN`

---

## 8. Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Token prefix | `shippo_test_*` | `shippo_live_*` |
| Real labels | ❌ Mock labels | ✅ Real labels |
| Charges | ❌ No charges | ✅ Real charges |
| Tracking | Mock tracking numbers only | Real carrier tracking |
| Carriers | Returns sample rates | Returns real carrier rates |
| Rate amounts | Representative but not exact | Actual carrier pricing |

**Recommendation:** Build and test everything with test token first. Switch to live token only when ready to ship real orders.

---

## 9. Pricing

### Shippo Plans (API)

| Plan | Cost | Labels | BYOA Fee |
|------|------|--------|----------|
| **Free** | $0/mo | 30 free labels/mo | 5¢/label |
| **Pay As You Go** | $0/mo | 30 free, then **7¢/label** | 5¢/label |
| **Premier** | Custom | Unlimited (volume discounts) | Free |

### Additional Service Fees
| Service | Cost |
|---------|------|
| Tracking (standalone) | 2¢/track |
| Rating (standalone) | 1¢/rate generation |
| US address validation | 2¢/validation |
| Non-US address validation | 8¢/validation |
| Insurance (domestic) | 1.25% of declared value + shipping cost |
| Insurance (international) | 1.5% of declared value + shipping cost |

### What This Means for Dave App
- **Starting out (< 30 orders/mo):** Completely free
- **Growing (30-500 orders/mo):** ~$0.07/label = $2.10-$35/mo
- **Using your own FedEx account:** +$0.05/label on top
- Shippo's USPS rates are often **discounted** vs retail USPS (Commercial Plus pricing)

---

## 10. Shippo vs Direct FedEx API

| Factor | Shippo | Direct FedEx API |
|--------|--------|------------------|
| **Setup time** | ~4-6 hours | Days to weeks |
| **Authentication** | Simple API key | OAuth2 + complex credential flow |
| **Carriers** | 85+ carriers, one integration | FedEx only |
| **Rate shopping** | Built-in across carriers | FedEx rates only |
| **Documentation** | Clean, modern REST | Large, complex XML/REST hybrid |
| **SDK** | Modern Node.js SDK | Official SDK exists but verbose |
| **Label purchase** | 1 API call | Multiple calls (rate → confirm → label) |
| **Tracking** | Unified across carriers | FedEx only |
| **USPS access** | Built-in discounted rates | Need separate USPS integration |
| **Cost** | 7¢/label | Free (direct) |
| **Maintenance** | Shippo handles carrier API changes | You maintain FedEx integration |

### Verdict for Dave App
**Use Shippo.** For a small sneaker store:
- 7¢/label is negligible vs the engineering time saved
- Multi-carrier rate shopping means cheaper shipping for customers
- Built-in USPS gives you the cheapest option for many shipments
- You already have FedEx credentials — connect them to Shippo as BYOA
- One integration covers USPS + FedEx + UPS + international (DHL)
- Tracking webhooks work across all carriers

**Only consider direct FedEx if:** You exclusively ship FedEx, have high volume (>10k/mo), and want to save the per-label fee.

---

## 11. Next.js Integration Pattern

### Environment Variables (`.env.local`)
```env
SHIPPO_API_KEY=shippo_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHIPPO_WEBHOOK_SECRET=your_webhook_secret

# Store address (ship-from)
STORE_NAME="Dave's Sneaker Shop"
STORE_STREET="123 Main St"
STORE_CITY="Tampa"
STORE_STATE="FL"
STORE_ZIP="33601"
STORE_COUNTRY="US"
STORE_PHONE="555-555-5555"
```

### Install SDK
```bash
npm install shippo
```

### Shared Shippo Client (`lib/shippo.ts`)
```typescript
import { Shippo } from 'shippo';

export const shippo = new Shippo({
  apiKeyHeader: process.env.SHIPPO_API_KEY!,
});

export const storeAddress = {
  name: process.env.STORE_NAME!,
  street1: process.env.STORE_STREET!,
  city: process.env.STORE_CITY!,
  state: process.env.STORE_STATE!,
  zip: process.env.STORE_ZIP!,
  country: process.env.STORE_COUNTRY!,
  phone: process.env.STORE_PHONE!,
};
```

---

## 12. Sample Next.js API Routes

### `app/api/shipping/rates/route.ts` — Get Rates for an Order

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { shippo, storeAddress } from '@/lib/shippo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, parcel } = body;

    // address: { name, street1, city, state, zip, country, phone }
    // parcel: { length, width, height, weight } (inches/lbs)

    const shipment = await shippo.shipments.create({
      addressFrom: storeAddress,
      addressTo: {
        name: address.name,
        street1: address.street1,
        street2: address.street2 || '',
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || 'US',
        phone: address.phone || '',
      },
      parcels: [{
        length: String(parcel.length || '14'),
        width: String(parcel.width || '12'),
        height: String(parcel.height || '6'),
        distanceUnit: 'in',
        weight: String(parcel.weight || '3'),
        massUnit: 'lb',
      }],
      async: false,
    });

    // Format rates for frontend
    const rates = shipment.rates
      .map(rate => ({
        id: rate.objectId,
        carrier: rate.provider,
        service: rate.servicelevel?.name || 'Standard',
        price: parseFloat(rate.amount),
        currency: rate.currency,
        estimatedDays: rate.estimatedDays,
        duration: rate.durationTerms,
      }))
      .sort((a, b) => a.price - b.price);

    return NextResponse.json({
      shipmentId: shipment.objectId,
      rates,
      cheapest: rates[0] || null,
      fastest: [...rates].sort((a, b) =>
        (a.estimatedDays || 99) - (b.estimatedDays || 99)
      )[0] || null,
    });
  } catch (error: any) {
    console.error('Shipping rates error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping rates', details: error.message },
      { status: 500 }
    );
  }
}
```

### `app/api/shipping/label/route.ts` — Purchase Cheapest Label

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { shippo } from '@/lib/shippo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rateId, labelFormat = 'PDF' } = body;

    // rateId: the objectId of the chosen rate from /api/shipping/rates
    // labelFormat: "PDF" | "PDF_4x6" | "PNG" | "ZPL"

    if (!rateId) {
      return NextResponse.json(
        { error: 'rateId is required' },
        { status: 400 }
      );
    }

    const transaction = await shippo.transactions.create({
      rate: rateId,
      labelFileType: labelFormat as any,
      async: false,
    });

    if (transaction.status !== 'SUCCESS') {
      return NextResponse.json(
        {
          error: 'Label purchase failed',
          messages: transaction.messages,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      transactionId: transaction.objectId,
      trackingNumber: transaction.trackingNumber,
      trackingUrl: transaction.trackingUrlProvider,
      labelUrl: transaction.labelUrl,
      status: transaction.status,
      rate: {
        amount: transaction.rate,
      },
    });
  } catch (error: any) {
    console.error('Label purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to purchase label', details: error.message },
      { status: 500 }
    );
  }
}
```

### `app/api/shipping/track/[trackingNumber]/route.ts` — Track a Package

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { shippo } from '@/lib/shippo';

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingNumber: string } }
) {
  try {
    const { trackingNumber } = params;
    const carrier = req.nextUrl.searchParams.get('carrier') || 'usps';

    const tracking = await shippo.tracks.get(carrier, trackingNumber);

    return NextResponse.json({
      trackingNumber: tracking.trackingNumber,
      carrier: tracking.carrier,
      status: tracking.trackingStatus?.status,
      statusDetails: tracking.trackingStatus?.statusDetails,
      statusDate: tracking.trackingStatus?.statusDate,
      estimatedDelivery: tracking.eta,
      history: tracking.trackingHistory?.map(event => ({
        status: event.status,
        details: event.statusDetails,
        date: event.statusDate,
        location: event.location,
      })),
    });
  } catch (error: any) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to get tracking info', details: error.message },
      { status: 500 }
    );
  }
}
```

### `app/api/shipping/webhook/route.ts` — Handle Tracking Webhooks

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body;

    // event.event — "track_updated" | "transaction_created" | etc.
    // event.data — the tracking or transaction object

    switch (event.event) {
      case 'track_updated': {
        const tracking = event.data;
        const status = tracking.tracking_status?.status;
        const trackingNumber = tracking.tracking_number;

        console.log(`Tracking update: ${trackingNumber} → ${status}`);

        // TODO: Update order status in your database
        // TODO: Send notification to customer
        // await updateOrderTracking(trackingNumber, status);
        // await notifyCustomer(trackingNumber, status);
        break;
      }

      case 'transaction_created':
      case 'transaction_updated': {
        const transaction = event.data;
        console.log(`Transaction ${event.event}: ${transaction.object_id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

---

## Quick Start Checklist

1. [ ] Sign up at https://goshippo.com (free)
2. [ ] Get test API token from https://goshippo.com/user/apikeys/
3. [ ] `npm install shippo`
4. [ ] Add `SHIPPO_API_KEY` to `.env.local`
5. [ ] Implement the 3 API routes above
6. [ ] Test with test token + mock addresses
7. [ ] Connect your FedEx account (BYOA) in Shippo dashboard
8. [ ] Set up webhook URL for tracking updates
9. [ ] Switch to live token when ready to ship

---

## Useful Links

- **Docs:** https://docs.goshippo.com/
- **API Reference:** https://docs.goshippo.com/shippoapi/public-api/
- **Node.js SDK:** https://www.npmjs.com/package/shippo
- **Dashboard:** https://goshippo.com/user/apikeys/
- **Pricing:** https://goshippo.com/pricing/api
- **GitHub:** https://github.com/goshippo/shippo-node-client
