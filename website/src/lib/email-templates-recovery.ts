// Abandoned Cart Recovery & Back-in-Stock email templates
// Uses same branding as email-templates.ts

const BRAND = {
  orange: '#FB4F14',
  navy: '#002244',
  storeName: 'Secured Tampa',
  storeUrl: 'https://securedtampa.com',
  storeAddress: '5009 S Dale Mabry Hwy, Tampa, FL 33611',
  storePhone: '(813) 551-1771',
};

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:${BRAND.navy};padding:28px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:26px;letter-spacing:3px;font-weight:800;">SECURED</h1>
      <p style="margin:4px 0 0;color:${BRAND.orange};font-size:12px;letter-spacing:2px;text-transform:uppercase;">Tampa, FL</p>
    </div>
    ${content}
    <div style="height:4px;background:${BRAND.orange};"></div>
    <div style="padding:24px;text-align:center;background:#fafafa;border-top:1px solid #e5e5e5;">
      <p style="color:#888;font-size:12px;margin:0;">
        ${BRAND.storeName} &middot; ${BRAND.storeAddress}<br>
        Phone: ${BRAND.storePhone}<br>
        <a href="${BRAND.storeUrl}" style="color:${BRAND.orange};text-decoration:none;">${BRAND.storeUrl}</a>
      </p>
      <p style="color:#aaa;font-size:11px;margin:12px 0 0;">
        &copy; ${new Date().getFullYear()} ${BRAND.storeName}. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function button(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:${BRAND.orange};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">${text}</a>`;
}

interface CartItemForEmail {
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  size?: string | null;
}

// ─── Abandoned Cart: Email 1 (1hr - Gentle Reminder) ──────────

export function abandonedCartEmail1(items: CartItemForEmail[], cartTotal: number) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;width:60px;">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;" />` : '<div style="width:56px;height:56px;background:#eee;border-radius:6px;"></div>'}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;">
        <strong style="color:${BRAND.navy};">${item.name}</strong>
        ${item.size ? `<br><span style="color:#888;font-size:12px;">Size: ${item.size}</span>` : ''}
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;white-space:nowrap;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>`).join('');

  return {
    subject: `You left something behind | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <h2 style="color:${BRAND.navy};margin:0 0 8px;font-size:22px;">Still thinking it over?</h2>
        <p style="color:#555;font-size:14px;margin:0;">Your cart is waiting for you. These items won't last long.</p>
      </div>
      <div style="padding:0 24px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tbody>${itemRows}</tbody>
        </table>
        <div style="text-align:right;padding:16px 8px 0;font-size:18px;font-weight:bold;color:${BRAND.navy};">
          Total: $${cartTotal.toFixed(2)}
        </div>
      </div>
      <div style="padding:24px;text-align:center;">
        ${button('Complete Your Order', `${BRAND.storeUrl}/cart`)}
      </div>
    `),
  };
}

// ─── Abandoned Cart: Email 2 (24hr - Urgency) ─────────────────

export function abandonedCartEmail2(items: CartItemForEmail[], cartTotal: number) {
  const itemNames = items.map(i => i.name).join(', ');

  return {
    subject: `Your items are selling fast | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <h2 style="color:${BRAND.navy};margin:0 0 8px;font-size:22px;">Don't miss out</h2>
        <p style="color:#555;font-size:14px;margin:0;">Other shoppers are eyeing the same items in your cart. We can only hold them for so long.</p>
      </div>
      <div style="padding:0 24px;">
        <div style="background:#f8f8f8;border-radius:8px;padding:20px;border-left:4px solid ${BRAND.orange};">
          <p style="margin:0 0 8px;font-size:14px;color:${BRAND.navy};font-weight:bold;">Your Cart ($${cartTotal.toFixed(2)})</p>
          <p style="margin:0;color:#555;font-size:13px;">${itemNames}</p>
        </div>
      </div>
      <div style="padding:24px;text-align:center;">
        ${button('Return to Your Cart', `${BRAND.storeUrl}/cart`)}
        <p style="color:#888;font-size:12px;margin:16px 0 0;">Limited stock available. First come, first served.</p>
      </div>
    `),
  };
}

// ─── Abandoned Cart: Email 3 (72hr - Last Chance + 10% Off) ───

export function abandonedCartEmail3(items: CartItemForEmail[], cartTotal: number, discountCode: string) {
  const discountedTotal = cartTotal * 0.9;
  const itemNames = items.map(i => i.name).join(', ');

  return {
    subject: `Last chance: 10% off your cart | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <h2 style="color:${BRAND.navy};margin:0 0 8px;font-size:22px;">Here's 10% off to seal the deal</h2>
        <p style="color:#555;font-size:14px;margin:0;">This is your last reminder. Use the code below before it expires.</p>
      </div>
      <div style="padding:0 24px;text-align:center;">
        <div style="background:${BRAND.navy};border-radius:8px;padding:24px;margin:16px 0;">
          <p style="margin:0 0 4px;color:${BRAND.orange};font-size:11px;text-transform:uppercase;letter-spacing:2px;">Your Discount Code</p>
          <p style="margin:0;font-family:monospace;font-size:28px;color:#fff;font-weight:bold;letter-spacing:4px;">${discountCode}</p>
          <p style="margin:8px 0 0;color:#ccc;font-size:12px;">10% off your entire cart</p>
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:8px 0 16px;">
          <p style="margin:0;font-size:13px;color:#555;">${itemNames}</p>
          <p style="margin:8px 0 0;">
            <span style="text-decoration:line-through;color:#888;font-size:14px;">$${cartTotal.toFixed(2)}</span>
            <span style="color:${BRAND.orange};font-size:20px;font-weight:bold;margin-left:8px;">$${discountedTotal.toFixed(2)}</span>
          </p>
        </div>
        ${button('Claim Your 10% Off', `${BRAND.storeUrl}/cart`)}
        <p style="color:#888;font-size:12px;margin:16px 0 0;">This offer expires in 48 hours.</p>
      </div>
    `),
  };
}

// ─── Back in Stock Notification ────────────────────────────────

export function backInStockEmail(productName: string, productImage: string | null, productUrl: string) {
  return {
    subject: `Back in Stock: ${productName} | ${BRAND.storeName}`,
    html: layout(`
      <div style="padding:32px 24px;text-align:center;">
        <h2 style="color:${BRAND.navy};margin:0 0 8px;font-size:22px;">Back in Stock!</h2>
        <p style="color:#555;font-size:14px;margin:0;">Good news -- the item you were waiting for is available again.</p>
      </div>
      <div style="padding:0 24px;text-align:center;">
        ${productImage ? `<img src="${productImage}" alt="${productName}" style="width:200px;height:200px;object-fit:cover;border-radius:12px;margin:16px auto;" />` : ''}
        <h3 style="color:${BRAND.navy};font-size:18px;margin:16px 0 8px;">${productName}</h3>
        <p style="color:#888;font-size:13px;margin:0 0 24px;">Grab it before it sells out again.</p>
        ${button('Shop Now', productUrl)}
      </div>
      <div style="padding:24px;"></div>
    `),
  };
}
