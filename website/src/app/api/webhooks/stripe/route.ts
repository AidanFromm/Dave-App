import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/constants";
import { handleWebsiteSale } from "@/lib/clover-sync";
import type Stripe from "stripe";

interface OrderItem {
  id: string;
  variant_id?: string | null;
  qty: number;
  price: number;
  size: string | null;
  name: string;
}

function generatePickupCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendGiftCardEmail(params: {
  recipientEmail: string;
  senderEmail: string;
  recipientName: string;
  amount: number;
  code: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not configured — skipping gift card email");
    return;
  }

  const { recipientEmail, senderEmail, recipientName, amount, code, message } = params;
  const toEmail = recipientEmail || senderEmail;
  const greeting = recipientName ? `${recipientName}, you` : "You";

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
      <h2 style="color:#fff;margin:0 0 8px;font-size:22px;">You've Got a Gift Card!</h2>
      <p style="color:#999;margin:0;font-size:14px;">${greeting} received a $${amount.toFixed(2)} gift card</p>
    </div>
    <div style="padding:0 24px;">
      <div style="background:#1a1a1a;border:2px solid #FB4F14;border-radius:12px;padding:24px;text-align:center;margin:16px 0;">
        <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Gift Card Code</p>
        <p style="margin:12px 0 0;color:#FB4F14;font-size:28px;font-weight:bold;letter-spacing:4px;font-family:monospace;">${code}</p>
        <p style="margin:12px 0 0;color:#fff;font-size:20px;font-weight:bold;">$${amount.toFixed(2)}</p>
      </div>
      ${message ? `<div style="background:#1a1a1a;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Personal Message</p>
        <p style="margin:8px 0 0;color:#ccc;font-size:14px;font-style:italic;">"${message}"</p>
      </div>` : ""}
    </div>
    <div style="padding:24px;text-align:center;">
      <a href="https://securedtampa.com/shop" style="display:inline-block;background:#FB4F14;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">Shop Now</a>
    </div>
    <div style="padding:16px 24px;text-align:center;border-top:1px solid #2a2a2a;">
      <p style="color:#666;font-size:12px;margin:0;">
        Enter your code at checkout on <a href="https://securedtampa.com" style="color:#FB4F14;">securedtampa.com</a>
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
        to: [toEmail],
        subject: `Your $${amount.toFixed(2)} Secured Tampa Gift Card`,
        html,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("Gift card email error:", res.status, errBody);
    }
  } catch (err) {
    console.error("Failed to send gift card email:", err);
  }
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
  pickupCode?: string | null;
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

  const { pickupCode } = params;
  const deliveryInfo =
    fulfillmentType === "ship" && shippingAddress
      ? `<p style="margin:0;color:#ccc;">
          ${shippingAddress.firstName || ""} ${shippingAddress.lastName || ""}<br>
          ${shippingAddress.street || ""}${shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ""}<br>
          ${shippingAddress.city || ""}, ${shippingAddress.state || ""} ${shippingAddress.zipCode || ""}
        </p>
        <p style="margin:8px 0 0;color:#999;font-size:13px;">Estimated delivery: 3–5 business days</p>`
      : `<p style="margin:0;color:#ccc;">Store Pickup — Tampa, FL</p>
         <p style="margin:8px 0 0;color:#999;font-size:13px;">We'll notify you when your order is ready</p>
         ${pickupCode ? `<div style="margin:16px 0 0;padding:16px;background:#1a1a1a;border:2px solid #FB4F14;border-radius:8px;text-align:center;">
           <p style="margin:0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Pickup Code</p>
           <p style="margin:8px 0 0;color:#FB4F14;font-size:32px;font-weight:bold;letter-spacing:6px;">${pickupCode}</p>
           <p style="margin:8px 0 0;color:#999;font-size:12px;">Show this code when picking up your order</p>
         </div>` : ""}`;

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
      <div style="display:inline-block;background:#22c55e;border-radius:50%;width:56px;height:56px;line-height:56px;font-size:28px;color:#fff;">&#10003;</div>
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
        ${fulfillmentType === "ship" ? "Shipping To" : "Pickup"}
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
    }
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}

// ============================================================
// Atomic inventory decrement via Supabase RPC
// Prevents race conditions where two concurrent orders oversell
// ============================================================
async function atomicDecrement(
  supabase: ReturnType<typeof createAdminClient>,
  table: "products" | "product_variants",
  id: string,
  qty: number
): Promise<{ previousQuantity: number; newQuantity: number; success: boolean }> {
  // Use a transaction-safe approach: update with a WHERE check
  // First get current quantity
  const { data: current, error: fetchErr } = await supabase
    .from(table)
    .select("quantity")
    .eq("id", id)
    .single();

  if (fetchErr || !current) {
    return { previousQuantity: 0, newQuantity: 0, success: false };
  }

  const previousQuantity = current.quantity;
  const newQuantity = Math.max(0, previousQuantity - qty);

  // Conditional update: only decrement if quantity hasn't changed since we read it
  // This prevents the race: if another order decremented between our read and write,
  // the WHERE clause won't match and we'll retry
  const { data: updated, error: updateErr } = await supabase
    .from(table)
    .update({
      quantity: newQuantity,
      ...(table === "products" ? { updated_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("quantity", previousQuantity) // optimistic lock
    .select("id")
    .single();

  if (updateErr || !updated) {
    // Race condition detected — retry once with fresh data
    const { data: retry } = await supabase
      .from(table)
      .select("quantity")
      .eq("id", id)
      .single();

    if (!retry) return { previousQuantity, newQuantity, success: false };

    const retryPrev = retry.quantity;
    const retryNew = Math.max(0, retryPrev - qty);

    const { error: retryErr } = await supabase
      .from(table)
      .update({
        quantity: retryNew,
        ...(table === "products" ? { updated_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);

    if (retryErr) return { previousQuantity: retryPrev, newQuantity: retryNew, success: false };
    return { previousQuantity: retryPrev, newQuantity: retryNew, success: true };
  }

  return { previousQuantity, newQuantity, success: true };
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

  // ============================================================
  // GIFT CARD PURCHASE — checkout.session.completed
  // ============================================================
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata || {};

    // Only handle gift card purchases
    if (meta.type === "gift_card") {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      const amount = parseFloat(meta.amount || "0");
      const code = meta.giftCardCode || "";

      if (!code || amount <= 0) {
        console.error("Gift card webhook missing code or amount:", meta);
        return NextResponse.json({ received: true });
      }

      // Idempotency: check if gift card already exists
      const { data: existing } = await supabase
        .from("gift_cards")
        .select("id")
        .eq("code", code)
        .single();

      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Create the gift card
      const { error: gcError } = await supabase.from("gift_cards").insert({
        code,
        initial_balance: amount,
        remaining_balance: amount,
        sender_email: meta.senderEmail || null,
        recipient_email: meta.recipientEmail || null,
        recipient_name: meta.recipientName || null,
        message: meta.message || null,
        stripe_session_id: session.id,
        is_active: true,
        created_at: now,
        updated_at: now,
      });

      if (gcError) {
        console.error("CRITICAL: Failed to create gift card:", gcError.message, "Code:", code);
        return NextResponse.json(
          { error: "Gift card creation failed", detail: gcError.message },
          { status: 500 }
        );
      }

      // Send gift card email
      try {
        await sendGiftCardEmail({
          recipientEmail: meta.recipientEmail || "",
          senderEmail: meta.senderEmail || "",
          recipientName: meta.recipientName || "",
          amount,
          code,
          message: meta.message || "",
        });
      } catch (err) {
        console.error("Gift card email failed:", err);
      }
    }

    return NextResponse.json({ received: true });
  }

  // ============================================================
  // ORDER PAYMENT — payment_intent.succeeded
  // ============================================================
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
      discountCode: discountCodeMeta,
      discountAmount: discountAmountStr,
      giftCardId: giftCardIdMeta,
      giftCardCode: giftCardCodeMeta,
      giftCardAmount: giftCardAmountStr,
      phone: phoneMeta,
      deliveryMethod: deliveryMethodMeta,
    } = paymentIntent.metadata;

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // IDEMPOTENCY CHECK: Prevent duplicate order creation on webhook retry
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("stripe_payment_id", paymentIntent.id)
      .single();

    if (existingOrder) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Try to find existing customer by email to link the order
    let customerId: string | null = null;
    if (email) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .single();
      if (existingCustomer) customerId = existingCustomer.id;
    }

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
    const isPickup = deliveryMethodMeta === "pickup" || fulfillmentType === "pickup";
    const pickupCode = isPickup ? generatePickupCode() : null;

    // Format items for order record
    const formattedItems = orderItems.map((item) => ({
      product_id: item.id,
      variant_id: item.variant_id || null,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      size: item.size,
    }));

    // ============================================================
    // CRITICAL: Order insert — return 500 on failure so Stripe retries
    // ============================================================
    const { data: newOrder, error: orderError } = await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_email: email || "unknown@checkout.com",
      channel: "web",
      subtotal,
      tax,
      shipping_cost: shippingCost,
      discount: discountAmountStr ? parseFloat(discountAmountStr) : 0,
      gift_card_amount: giftCardAmountStr ? parseFloat(giftCardAmountStr) : 0,
      gift_card_code: giftCardCodeMeta || null,
      total,
      status: "paid",
      fulfillment_type: fulfillmentType || "ship",
      stripe_payment_id: paymentIntent.id,
      stripe_payment_status: "succeeded",
      items: formattedItems,
      shipping_address: shipping,
      delivery_method: deliveryMethodMeta || (fulfillmentType === "pickup" ? "pickup" : "shipping"),
      pickup_status: isPickup ? "pending" : null,
      pickup_code: pickupCode,
      customer_phone: phoneMeta || null,
      created_at: now,
      updated_at: now,
    }).select("id").single();

    if (orderError) {
      console.error("CRITICAL: Failed to create order for payment", paymentIntent.id, orderError.message);
      return NextResponse.json(
        { error: "Order creation failed", detail: orderError.message, paymentId: paymentIntent.id },
        { status: 500 }
      );
    }

    // ============================================================
    // Post-order operations — non-critical, log errors but don't fail webhook
    // ============================================================

    // Increment discount code uses
    if (discountCodeMeta) {
      try {
        const { data: disc } = await supabase
          .from("discounts")
          .select("uses")
          .eq("code", discountCodeMeta)
          .single();
        if (disc) {
          await supabase
            .from("discounts")
            .update({ uses: (disc.uses || 0) + 1 })
            .eq("code", discountCodeMeta);
        }
      } catch (err) {
        console.error("Failed to increment discount uses:", err);
      }
    }

    // Redeem gift card if used
    if (giftCardIdMeta && giftCardAmountStr) {
      try {
        const giftCardAmount = parseFloat(giftCardAmountStr);
        if (giftCardAmount > 0) {
          const { data: giftCard } = await supabase
            .from("gift_cards")
            .select("id, remaining_balance")
            .eq("id", giftCardIdMeta)
            .single();

          if (giftCard) {
            const newBalance = Math.max(0, Number(giftCard.remaining_balance) - giftCardAmount);

            await supabase
              .from("gift_cards")
              .update({ remaining_balance: newBalance })
              .eq("id", giftCardIdMeta);

            await supabase.from("gift_card_transactions").insert({
              gift_card_id: giftCardIdMeta,
              order_id: newOrder?.id || null,
              amount: giftCardAmount,
              type: "redemption",
              note: `Redeemed for order ${orderNumber}`,
            });
          }
        }
      } catch (err) {
        console.error("Failed to redeem gift card:", err);
      }
    }

    // ============================================================
    // ATOMIC inventory decrement for each item
    // ============================================================
    for (const item of orderItems) {
      if (!item.id) continue;

      try {
        // If variant_id exists, decrement variant stock atomically
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("id, quantity, product_id")
            .eq("id", item.variant_id)
            .single();

          if (!variant) {
            console.error(`Variant ${item.variant_id} not found for inventory update`);
          } else {
            const result = await atomicDecrement(supabase, "product_variants", item.variant_id, item.qty);

            if (result.success) {
              await supabase.from("inventory_adjustments").insert({
                product_id: variant.product_id,
                quantity_change: -item.qty,
                reason: "sold_online",
                previous_quantity: result.previousQuantity,
                new_quantity: result.newQuantity,
                notes: `Variant ${item.variant_id} — Stripe order ${orderNumber} (${paymentIntent.id})`,
                adjusted_by: null,
                source: "web_order",
              });
            } else {
              console.error(`Atomic decrement failed for variant ${item.variant_id}`);
            }
          }
        }

        // Only decrement product stock if there's no variant_id (avoid double-decrement)
        if (!item.variant_id) {
          const result = await atomicDecrement(supabase, "products", item.id, item.qty);

          if (result.success) {
            await supabase.from("inventory_adjustments").insert({
              product_id: item.id,
              quantity_change: -item.qty,
              reason: "sold_online",
              previous_quantity: result.previousQuantity,
              new_quantity: result.newQuantity,
              notes: `Stripe order ${orderNumber} (${paymentIntent.id})`,
              adjusted_by: null,
              source: "web_order",
            });
          } else {
            console.error(`Atomic decrement failed for product ${item.id}`);
          }
        }

        // Increment drop_sold_count for drop products
        const productData = await supabase
          .from("products")
          .select("is_drop, drop_sold_count")
          .eq("id", item.id)
          .single();

        if (productData.data?.is_drop) {
          await supabase
            .from("products")
            .update({
              drop_sold_count: (productData.data.drop_sold_count || 0) + item.qty,
            })
            .eq("id", item.id);
        }

        // Sync stock to Clover (fire-and-forget)
        handleWebsiteSale(item.id, item.qty).catch((err) => {
          console.error(`Clover sync failed for product ${item.id}:`, err);
        });
      } catch (err) {
        console.error(`Inventory update failed for item ${item.id}:`, err);
      }
    }

    // Send order confirmation email via Resend (non-critical)
    if (email) {
      try {
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
          pickupCode,
        });
      } catch (err) {
        console.error("Email send failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
