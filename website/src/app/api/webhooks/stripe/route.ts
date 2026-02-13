import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/constants";
import { handleWebsiteSale } from "@/lib/clover-sync";
import type Stripe from "stripe";

interface OrderItem {
  id: string;
  qty: number;
  price: number;
  size: string | null;
  name: string;
}

async function sendOrderConfirmationEmail(params: {
  email: string;
  orderNumber: string;
  items: { name: string; price: number; quantity: number; size?: string | null }[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  fulfillmentType: string;
  shippingAddress?: Record<string, string> | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured — skipping confirmation email");
    return;
  }

  const { email, orderNumber, items, subtotal, tax, shippingCost, total, fulfillmentType, shippingAddress } = params;

  const itemRows = items
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
    fulfillmentType === "ship" && shippingAddress
      ? `<p style="margin:0;color:#ccc;">
          ${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}<br>
          ${shippingAddress.street || ""}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ""}<br>
          ${shippingAddress.city || ""}, ${shippingAddress.state || ""} ${shippingAddress.zipCode || ""}
        </p>
        <p style="margin:8px 0 0;color:#999;font-size:13px;">Estimated delivery: 3–5 business days</p>`
      : `<p style="margin:0;color:#ccc;">Store Pickup — Tampa, FL</p>
         <p style="margin:8px 0 0;color:#999;font-size:13px;">We'll notify you when your order is ready</p>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#111;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <div style="background:linear-gradient(135deg,#FB4F14,#e04400);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:2px;">SECURED</h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Tampa, FL</p>
    </div>
    <div style="padding:32px 24px;text-align:center;">
      <div style="display:inline-block;background:#22c55e;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;">✓</div>
      <h2 style="color:#fff;margin:16px 0 4px;font-size:22px;">Order Confirmed!</h2>
      <p style="color:#999;margin:0;font-size:14px;">Order #${orderNumber}</p>
    </div>
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
    <div style="padding:20px 24px;margin:0 24px;border-top:2px solid #333;">
      <table style="width:100%;font-size:14px;">
        <tr><td style="padding:4px 0;color:#999;">Subtotal</td><td style="text-align:right;color:#ccc;">$${subtotal.toFixed(2)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Tax</td><td style="text-align:right;color:#ccc;">$${tax.toFixed(2)}</td></tr>
        <tr><td style="padding:4px 0;color:#999;">Shipping</td><td style="text-align:right;color:#ccc;">${shippingCost === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}</td></tr>
        <tr><td style="padding:12px 0 4px;color:#fff;font-size:18px;font-weight:bold;">Total</td><td style="text-align:right;color:#fff;font-size:18px;font-weight:bold;">$${total.toFixed(2)}</td></tr>
      </table>
    </div>
    <div style="padding:20px 24px;margin:0 24px;border-top:1px solid #2a2a2a;">
      <h3 style="margin:0 0 8px;color:#FB4F14;font-size:14px;text-transform:uppercase;letter-spacing:1px;">
        ${fulfillmentType === "ship" ? "📦 Shipping To" : "📍 Pickup"}
      </h3>
      ${deliveryInfo}
    </div>
    <div style="padding:24px;text-align:center;border-top:1px solid #2a2a2a;margin-top:16px;">
      <p style="color:#666;font-size:12px;margin:0;">
        Thank you for shopping with Secured Tampa!<br>
        Questions? Reply to this email or visit <a href="https://securedtampa.com" style="color:#FB4F14;">securedtampa.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Secured Tampa <orders@securedtampa.com>",
        to: [email],
        subject: `Order Confirmed — #${orderNumber} | Secured Tampa`,
        html,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Resend API error:", res.status, errBody);
    } else {
      console.log(`Confirmation email sent to ${email} for order ${orderNumber}`);
    }
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const {
      email,
      fulfillmentType,
      items: itemsJson,
      shippingAddress,
      subtotal: subtotalStr,
      tax: taxStr,
      shippingCost: shippingCostStr,
    } = paymentIntent.metadata;

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Parse items from metadata
    let orderItems: OrderItem[] = [];
    try {
      if (itemsJson) {
        orderItems = JSON.parse(itemsJson) as OrderItem[];
      }
    } catch (e) {
      console.error("Failed to parse items from payment metadata:", e);
    }

    // Parse shipping address
    let shipping = null;
    try {
      if (shippingAddress) {
        shipping = JSON.parse(shippingAddress);
      }
    } catch (e) {
      console.error("Failed to parse shipping address:", e);
    }

    // Use real tax/shipping from metadata (passed from checkout route)
    const subtotal = subtotalStr ? parseFloat(subtotalStr) : paymentIntent.amount / 100;
    const tax = taxStr ? parseFloat(taxStr) : 0;
    const shippingCost = shippingCostStr ? parseFloat(shippingCostStr) : 0;
    const total = paymentIntent.amount / 100;

    // Create order record
    const orderNumber = generateOrderNumber();

    // Format items for order record
    const formattedItems = orderItems.map((item) => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      size: item.size,
    }));

    const { error: orderError } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_email: email || "unknown@checkout.com",
      sales_channel: "web",
      subtotal,
      tax,
      shipping_cost: shippingCost,
      discount: 0,
      total,
      status: "paid",
      fulfillment_type: fulfillmentType || "ship",
      stripe_payment_id: paymentIntent.id,
      stripe_payment_status: "succeeded",
      items: formattedItems,
      shipping_address: shipping,
      created_at: now,
      updated_at: now,
    });

    if (orderError) {
      console.error("Failed to create order:", orderError.message);
    }

    // Decrement inventory for each item
    for (const item of orderItems) {
      if (!item.id) continue;

      // Get current product quantity
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, quantity, name")
        .eq("id", item.id)
        .single();

      if (productError || !product) {
        console.error(`Product ${item.id} not found for inventory update`);
        continue;
      }

      const previousQuantity = product.quantity;
      const newQuantity = Math.max(0, previousQuantity - item.qty);

      // Update product quantity
      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          quantity: newQuantity, 
          updated_at: now 
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(`Failed to update stock for product ${item.id}:`, updateError.message);
        continue;
      }

      // Log inventory adjustment — use NULL for adjusted_by (system action)
      // and 'web_order' for source (matches CHECK constraint)
      await supabase.from("inventory_adjustments").insert({
        product_id: item.id,
        quantity_change: -item.qty,
        reason: "sold_online",
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes: `Stripe order ${orderNumber} (${paymentIntent.id})`,
        adjusted_by: null,
        source: "web_order",
      });

      // Sync stock to Clover (fire-and-forget)
      handleWebsiteSale(item.id, item.qty).catch((err) => {
        console.error(`Clover sync failed for product ${item.id}:`, err);
      });
    }

    // Send order confirmation email via Resend
    if (email) {
      await sendOrderConfirmationEmail({
        email,
        orderNumber,
        items: formattedItems.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
        })),
        subtotal,
        tax,
        shippingCost,
        total,
        fulfillmentType: fulfillmentType || "ship",
        shippingAddress: shipping,
      });
    }
  }

  return NextResponse.json({ received: true });
}
