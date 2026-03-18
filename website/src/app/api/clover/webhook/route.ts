import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { CloverClient } from "@/lib/clover";
import { generateOrderNumber } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get("X-Clover-Hmac-Sha256");

    const supabase = createAdminClient();

    // Verify webhook signature if header is present
    if (hmacHeader) {
      const { data: settings } = await supabase
        .from("clover_settings")
        .select("webhook_secret")
        .eq("is_active", true)
        .single();

      if (settings?.webhook_secret) {
        const expectedHmac = crypto
          .createHmac("sha256", settings.webhook_secret)
          .update(body)
          .digest("base64");

        if (hmacHeader !== expectedHmac) {
          console.error("Clover webhook signature mismatch");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    } else {
      console.warn("Clover webhook received without HMAC signature header");
    }

    const payload = JSON.parse(body);
    const { type, merchantId, objectId } = payload as {
      type: string;
      merchantId: string;
      objectId: string;
    };

    // Fetch Clover settings to get the access token
    const { data: cloverSettings } = await supabase
      .from("clover_settings")
      .select("*")
      .eq("merchant_id", merchantId)
      .eq("is_active", true)
      .single();

    if (!cloverSettings || !cloverSettings.access_token) {
      console.error(`No active Clover settings found for merchant ${merchantId}`);
      return NextResponse.json({ error: "Merchant not configured" }, { status: 400 });
    }

    const clover = new CloverClient(merchantId, cloverSettings.access_token);

    // Handle different webhook types
    if (type === "order" || type === "CREATE" || type === "UPDATE") {
      await handleOrderWebhook(supabase, clover, objectId);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Clover webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleOrderWebhook(
  supabase: ReturnType<typeof createAdminClient>,
  clover: CloverClient,
  orderId: string
) {
  // Fetch full order from Clover
  const cloverOrder = await clover.getOrder(orderId);
  if (!cloverOrder) {
    console.error(`Failed to fetch Clover order ${orderId}`);
    return;
  }

  // Only process completed/paid orders
  if (cloverOrder.state !== "locked" && cloverOrder.state !== "paid") {
    return;
  }

  // Idempotency: check by stripe_payment_id (using clover- prefix)
  const cloverPaymentId = `clover-${orderId}`;
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_payment_id", cloverPaymentId)
    .single();

  if (existingOrder) {
    return; // Already synced
  }

  // Build order items
  const lineItems = cloverOrder.lineItems?.elements ?? [];
  const items = lineItems.map((item: any) => ({
    product_id: item.item?.id ?? null,
    name: item.name,
    price: item.price / 100,
    quantity: item.unitQty || 1,
    size: null,
  }));

  const total = cloverOrder.total / 100;
  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  const tax = Math.max(0, Math.round((total - subtotal) * 100) / 100);
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber();

  // Insert order — using columns that actually exist in the DB
  const { error: orderError } = await supabase.from("orders").insert({
    order_number: orderNumber,
    customer_email: "in-store@securedtampa.com",
    status: "delivered",
    channel: "in_store",
    items,
    subtotal,
    tax,
    shipping_cost: 0,
    discount: 0,
    total,
    fulfillment_type: "pickup",
    delivery_method: "pickup",
    pickup_status: "picked_up",
    stripe_payment_id: cloverPaymentId,
    stripe_payment_status: "succeeded",
    created_at: new Date(cloverOrder.createdTime).toISOString(),
    updated_at: now,
  });

  if (orderError) {
    console.error(`CRITICAL: Failed to insert Clover order ${orderId}:`, orderError.message);
    return;
  }

  // Decrement product stock for each line item
  for (const item of lineItems) {
    if (!item.item?.id) continue;

    try {
      // Find matching product by name (clover_item_id column doesn't exist yet)
      const { data: product } = await supabase
        .from("products")
        .select("id, quantity")
        .ilike("name", item.name)
        .single();

      if (product) {
        const qty = item.unitQty || 1;
        const previousQuantity = product.quantity;
        const newQuantity = Math.max(0, previousQuantity - qty);

        // Atomic decrement with optimistic lock
        const { data: updated } = await supabase
          .from("products")
          .update({ quantity: newQuantity, updated_at: now })
          .eq("id", product.id)
          .eq("quantity", previousQuantity)
          .select("id")
          .single();

        if (!updated) {
          // Race — retry with fresh data
          const { data: fresh } = await supabase
            .from("products")
            .select("id, quantity")
            .eq("id", product.id)
            .single();
          if (fresh) {
            const retryNew = Math.max(0, fresh.quantity - qty);
            await supabase
              .from("products")
              .update({ quantity: retryNew, updated_at: now })
              .eq("id", product.id);
          }
        }

        await supabase.from("inventory_adjustments").insert({
          product_id: product.id,
          quantity_change: -qty,
          reason: "sold_instore",
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          notes: `Clover order ${orderId} — ${orderNumber}`,
          adjusted_by: "clover_webhook",
          source: "clover_webhook",
        });
      }
    } catch (err) {
      console.error(`Clover stock decrement failed for ${item.name}:`, err);
    }
  }
}
