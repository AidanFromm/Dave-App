import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "usevantix@gmail.com",
    pass: "fqptryzjcybyhgaq",
  },
});

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size?: string;
}

interface ConfirmationRequest {
  email: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  fulfillmentType: "ship" | "pickup";
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

function buildEmailHtml(order: ConfirmationRequest): string {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;">
          <strong style="color:#fff;">${item.name}</strong>
          ${item.size ? `<br><span style="color:#999;font-size:13px;">Size: ${item.size}</span>` : ""}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;text-align:center;color:#ccc;">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #2a2a2a;text-align:right;color:#fff;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const deliveryInfo =
    order.fulfillmentType === "ship" && order.shippingAddress
      ? `<p style="margin:0;color:#ccc;">
          ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
          ${order.shippingAddress.street}${order.shippingAddress.apartment ? `, ${order.shippingAddress.apartment}` : ""}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
        </p>
        <p style="margin:8px 0 0;color:#999;font-size:13px;">Estimated delivery: 3–5 business days</p>`
      : `<p style="margin:0;color:#ccc;">Store Pickup — Tampa, FL</p>
         <p style="margin:8px 0 0;color:#999;font-size:13px;">We'll notify you when your order is ready</p>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#111;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#FB4F14,#e04400);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px;">SECURED</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Tampa, FL</p>
    </div>

    <!-- Confirmation -->
    <div style="padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:#22c55e;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
      <h2 style="color:#fff;margin:16px 0 4px;font-size:22px;">Order Confirmed!</h2>
      <p style="color:#999;margin:0;font-size:14px;">Order #${order.orderNumber}</p>
    </div>

    <!-- Items -->
    <div style="padding:0 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="border-bottom:2px solid #333;">
            <th style="padding:8px;text-align:left;color:#999;font-weight:600;">Item</th>
            <th style="padding:8px;text-align:center;color:#999;font-weight:600;">Qty</th>
            <th style="padding:8px;text-align:right;color:#999;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:20px 24px;margin:0 24px;border-top:2px solid #333;">
      <table style="width:100%;font-size:14px;">
        <tr><td style="padding:4px 0;color:#999;">Subtotal</td><td style="text-align:right;color:#ccc;">$${order.subtotal.toFixed(2)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Tax</td><td style="text-align:right;color:#ccc;">$${order.tax.toFixed(2)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Shipping</td><td style="text-align:right;color:#ccc;">${order.shippingCost === 0 ? "FREE" : `$${order.shippingCost.toFixed(2)}`}</td></tr>
        <tr><td style="padding:12px 0 4px;color:#fff;font-size:18px;font-weight:bold;">Total</td><td style="text-align:right;color:#fff;font-size:18px;font-weight:bold;">$${order.total.toFixed(2)}</td></tr>
      </table>
    </div>

    <!-- Delivery -->
    <div style="padding:20px 24px;margin:0 24px;border-top:1px solid #2a2a2a;">
      <h3 style="margin:0 0 8px;color:#FB4F14;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
        ${order.fulfillmentType === "ship" ? "📦 Shipping To" : "📍 Pickup"}
      </h3>
      ${deliveryInfo}
    </div>

    <!-- Footer -->
    <div style="padding:24px;text-align:center;border-top:1px solid #2a2a2a;margin-top:16px;">
      <p style="color:#666;font-size:12px;margin:0;">
        Thank you for shopping with Secured Tampa!<br>
        Questions? Reply to this email or visit <a href="https://securedtampa.com" style="color:#FB4F14;">securedtampa.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(request: Request) {
  try {
    const body: ConfirmationRequest = await request.json();

    if (!body.email || !body.orderNumber) {
      return NextResponse.json({ error: "Missing email or order number" }, { status: 400 });
    }

    const html = buildEmailHtml(body);

    await transporter.sendMail({
      from: '"Secured Tampa" <usevantix@gmail.com>',
      to: body.email,
      subject: `Order Confirmed — #${body.orderNumber} | Secured Tampa`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
