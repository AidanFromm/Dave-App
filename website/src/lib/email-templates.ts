// Branded email templates for Secured Tampa
// Uses Resend API — from: orders@securedtampa.com

const BRAND = {
  orange: '#FB4F14',
  navy: '#002244',
  storeName: 'Secured Tampa',
  storeUrl: 'https://securedtampa.com',
  storeAddress: '123 Main Street, Tampa, FL 33601', // Placeholder — Dave will update
  storePhone: '(813) 555-0000', // Placeholder
};

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:${BRAND.navy};padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:26px;letter-spacing:3px;font-weight:800;">SECURED</h1>
      <p style="margin:4px 0 0;color:${BRAND.orange};font-size:12px;letter-spacing:2px;text-transform:uppercase;">Tampa, FL</p>
    </div>
    ${content}
    <!-- Footer -->
    <div style="padding:24px;text-align:center;background:#fafafa;border-top:1px solid #e5e5e5;">
      <p style="color:#888;font-size:12px;margin:0;">
        ${BRAND.storeName} &middot; ${BRAND.storeAddress}<br>
        <a href="${BRAND.storeUrl}" style="color:${BRAND.orange};text-decoration:none;">${BRAND.storeUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND.orange};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">${text}</a>`;
}

// ─── Order Confirmation ────────────────────────────────────────

export interface OrderConfirmationData {
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity: number; size?: string }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  fulfillmentType: 'ship' | 'pickup';
  shippingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export function orderConfirmationEmail(data: OrderConfirmationData) {
  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;">
        <strong>${item.name}</strong>
        ${item.size ? `<br><span style="color:#888;font-size:13px;">Size: ${item.size}</span>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>`).join('');

  const deliverySection = data.fulfillmentType === 'ship' && data.shippingAddress
    ? `<h3 style="margin:0 0 8px;color:${BRAND.navy};font-size:14px;">📦 Shipping To</h3>
       <p style="margin:0;color:#555;">${data.shippingAddress.firstName} ${data.shippingAddress.lastName}<br>
       ${data.shippingAddress.street}${data.shippingAddress.apartment ? `, ${data.shippingAddress.apartment}` : ''}<br>
       ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}</p>
       <p style="margin:8px 0 0;color:#888;font-size:13px;">Estimated delivery: 3–5 business days</p>`
    : `<h3 style="margin:0 0 8px;color:${BRAND.navy};font-size:14px;">📍 Store Pickup</h3>
       <p style="margin:0;color:#555;">${BRAND.storeName}<br>${BRAND.storeAddress}</p>
       <p style="margin:8px 0 0;color:#888;font-size:13px;">We'll notify you when your order is ready for pickup.</p>`;

  return {
    subject: `Order Confirmed — #${data.orderNumber} | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <div style="display:inline-block;background:#22c55e;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;color:#fff;">✓</div>
        <h2 style="color:${BRAND.navy};margin:16px 0 4px;font-size:22px;">Order Confirmed!</h2>
        <p style="color:#888;margin:0;font-size:14px;">Order #${data.orderNumber}</p>
      </div>
      <div style="padding:0 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="border-bottom:2px solid ${BRAND.navy};">
            <th style="padding:8px;text-align:left;color:#888;">Item</th>
            <th style="padding:8px;text-align:center;color:#888;">Qty</th>
            <th style="padding:8px;text-align:right;color:#888;">Price</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div style="padding:20px 24px;margin:0 24px;border-top:2px solid #eee;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="padding:4px 0;color:#888;">Subtotal</td><td style="text-align:right;">$${data.subtotal.toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Tax</td><td style="text-align:right;">$${data.tax.toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#888;">Shipping</td><td style="text-align:right;">${data.shippingCost === 0 ? 'FREE' : `$${data.shippingCost.toFixed(2)}`}</td></tr>
          <tr><td style="padding:12px 0 4px;font-size:18px;font-weight:bold;color:${BRAND.navy};">Total</td><td style="text-align:right;font-size:18px;font-weight:bold;color:${BRAND.navy};">$${data.total.toFixed(2)}</td></tr>
        </table>
      </div>
      <div style="padding:20px 24px;margin:0 24px;border-top:1px solid #eee;">${deliverySection}</div>
    `),
  };
}

// ─── Order Shipped ─────────────────────────────────────────────

export interface OrderShippedData {
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier: string; // 'usps' | 'ups' | 'fedex' | 'other'
  items: Array<{ name: string; quantity: number; size?: string }>;
}

const CARRIER_URLS: Record<string, string> = {
  usps: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
  ups: 'https://www.ups.com/track?tracknum=',
  fedex: 'https://www.fedex.com/fedextrack/?trknbr=',
};

function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const base = CARRIER_URLS[carrier.toLowerCase()];
  return base ? `${base}${trackingNumber}` : '#';
}

export function orderShippedEmail(data: OrderShippedData) {
  const trackingUrl = getTrackingUrl(data.carrier, data.trackingNumber);
  const carrierName = data.carrier.toUpperCase();
  const itemList = data.items.map(i =>
    `<li style="padding:4px 0;color:#555;">${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}</li>`
  ).join('');

  return {
    subject: `Your Order Has Shipped — #${data.orderNumber} | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <div style="font-size:48px;">📦</div>
        <h2 style="color:${BRAND.navy};margin:16px 0 4px;font-size:22px;">Your Order Is On The Way!</h2>
        <p style="color:#888;margin:0;font-size:14px;">Order #${data.orderNumber}</p>
      </div>
      <div style="padding:0 24px 24px;text-align:center;">
        <p style="color:#555;font-size:14px;">Hey ${data.customerName}, great news! Your order has been shipped via <strong>${carrierName}</strong>.</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tracking Number</p>
          <p style="margin:0;font-family:monospace;font-size:16px;color:${BRAND.navy};font-weight:bold;">${data.trackingNumber}</p>
        </div>
        ${trackingUrl !== '#' ? button('Track Your Package', trackingUrl) : ''}
      </div>
      <div style="padding:0 24px 24px;">
        <h3 style="color:${BRAND.navy};font-size:14px;margin:0 0 8px;">Items Shipped</h3>
        <ul style="margin:0;padding-left:20px;font-size:14px;">${itemList}</ul>
      </div>
    `),
  };
}

// ─── Ready for Pickup ──────────────────────────────────────────

export interface OrderPickupData {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; size?: string }>;
}

export function orderPickupEmail(data: OrderPickupData) {
  const itemList = data.items.map(i =>
    `<li style="padding:4px 0;color:#555;">${i.name}${i.size ? ` (${i.size})` : ''} × ${i.quantity}</li>`
  ).join('');

  return {
    subject: `Your Order Is Ready for Pickup — #${data.orderNumber} | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <div style="font-size:48px;">🏪</div>
        <h2 style="color:${BRAND.navy};margin:16px 0 4px;font-size:22px;">Ready for Pickup!</h2>
        <p style="color:#888;margin:0;font-size:14px;">Order #${data.orderNumber}</p>
      </div>
      <div style="padding:0 24px 24px;text-align:center;">
        <p style="color:#555;font-size:14px;">Hey ${data.customerName}, your order is ready! Come pick it up at:</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 4px;font-weight:bold;color:${BRAND.navy};font-size:16px;">${BRAND.storeName}</p>
          <p style="margin:0;color:#555;font-size:14px;">${BRAND.storeAddress}</p>
          <p style="margin:8px 0 0;color:#888;font-size:13px;">Phone: ${BRAND.storePhone}</p>
        </div>
        <p style="color:#888;font-size:13px;">Please bring a valid photo ID when picking up your order.</p>
      </div>
      <div style="padding:0 24px 24px;">
        <h3 style="color:${BRAND.navy};font-size:14px;margin:0 0 8px;">Items to Pick Up</h3>
        <ul style="margin:0;padding-left:20px;font-size:14px;">${itemList}</ul>
      </div>
    `),
  };
}

// ─── Payment Reminder ──────────────────────────────────────────

export interface PaymentReminderData {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentUrl?: string;
}

export function paymentReminderEmail(data: PaymentReminderData) {
  const payUrl = data.paymentUrl ?? `${BRAND.storeUrl}/account/orders`;

  return {
    subject: `Payment Reminder — Order #${data.orderNumber} | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <div style="font-size:48px;">💳</div>
        <h2 style="color:${BRAND.navy};margin:16px 0 4px;font-size:22px;">Payment Reminder</h2>
        <p style="color:#888;margin:0;font-size:14px;">Order #${data.orderNumber}</p>
      </div>
      <div style="padding:0 24px 32px;text-align:center;">
        <p style="color:#555;font-size:14px;">Hey ${data.customerName}, we noticed your payment of <strong>$${data.total.toFixed(2)}</strong> for order #${data.orderNumber} is still pending.</p>
        <p style="color:#555;font-size:14px;">Please complete your payment to avoid order cancellation.</p>
        <div style="margin-top:24px;">
          ${button('Complete Payment', payUrl)}
        </div>
      </div>
    `),
  };
}

// ─── Welcome Email ─────────────────────────────────────────────

export interface WelcomeEmailData {
  customerName: string;
}

export function welcomeEmail(data: WelcomeEmailData) {
  return {
    subject: `Welcome to ${BRAND.storeName}! 🔥`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <div style="font-size:48px;">🔥</div>
        <h2 style="color:${BRAND.navy};margin:16px 0 4px;font-size:22px;">Welcome to Secured!</h2>
      </div>
      <div style="padding:0 24px 32px;text-align:center;">
        <p style="color:#555;font-size:14px;">Hey ${data.customerName}, thanks for joining the Secured family!</p>
        <p style="color:#555;font-size:14px;">We carry the freshest sneakers, streetwear, and collectibles in Tampa. Check out what's new:</p>
        <div style="margin-top:24px;">
          ${button('Shop Now', BRAND.storeUrl)}
        </div>
      </div>
    `),
  };
}
