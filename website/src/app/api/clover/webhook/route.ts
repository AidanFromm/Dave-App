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

    // Handle verification handshake
    if (payload.verificationCode) {
      console.log(`Clover webhook verification: ${payload.verificationCode}`);
      return NextResponse.json({ verificationCode: payload.verificationCode }, { status: 200 });
    }
    const merchantIds = Object.keys(payload.merchants);
    if (merchantIds.length === 0) {
      console.warn("Clover webhook received with no merchant data.");
      return NextResponse.json({ received: true }, { status: 200 });
    }
    const merchantId = merchantIds[0]; // Assuming one merchant per webhook for now
    const events = payload.merchants[merchantId];

    if (!events || events.length === 0) {
      console.warn(`No events for merchant ${merchantId} in Clover webhook.`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const firstEvent = events[0]; // Process the first event for simplicity, can extend to loop if needed
    const { objectId, type } = firstEvent;

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

    // Parse objectId prefix: O: = Order, I: = Item, P: = Payment
    const objPrefix = objectId?.split(":")[0];
    const objId = objectId?.includes(":") ? objectId.split(":").slice(1).join(":") : objectId;

    // Handle different webhook types based on objectId prefix
    if (objPrefix === "O") {
      await handleOrderWebhook(supabase, clover, objId);
    } else if (objPrefix === "I") {
      await handleInventoryWebhook(supabase, clover, objId, type);
    } else if (objPrefix === "P") {
      // Payment webhook — order webhook handles the stock sync
      console.log(`Clover payment webhook: ${type} ${objId}`);
    } else {
      // Legacy flat format fallback
      if (type === "order" || type === "CREATE" || type === "UPDATE") {
        await handleOrderWebhook(supabase, clover, objectId);
      }
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
      // Find matching product by clover_item_id first, fallback to name
      let product: { id: string; quantity: number } | null = null;
      const { data: byClover } = await supabase
        .from("products")
        .select("id, quantity")
        .eq("clover_item_id", item.item.id)
        .single();
      if (byClover) {
        product = byClover;
      } else {
        const { data: byName } = await supabase
          .from("products")
          .select("id, quantity")
          .ilike("name", item.name)
          .single();
        product = byName;
      }

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

async function handleInventoryWebhook(
  supabase: ReturnType<typeof createAdminClient>,
  clover: CloverClient,
  itemId: string,
  type: string
) {
  if (type === "DELETE") {
    // Item deleted from Clover — mark inactive in Supabase
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("clover_item_id", itemId)
      .single();
    if (product) {
      await supabase
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", product.id);
      console.log(`Clover item ${itemId} deleted — deactivated product ${product.id}`);
    }
    return;
  }

  // CREATE or UPDATE — fetch item from Clover and sync to Supabase
  try {
    const cloverItem = await clover.getItem(itemId);
    if (!cloverItem) {
      console.error(`Failed to fetch Clover item ${itemId}`);
      return;
    }

    // Find matching product
    const { data: product } = await supabase
      .from("products")
      .select("id, quantity")
      .eq("clover_item_id", itemId)
      .single();

    if (!product) {
      console.log(`Clover item ${itemId} (${cloverItem.name}) has no matching Supabase product — skipping`);
      return;
    }

    const cloverStock = cloverItem.itemStock?.quantity ?? cloverItem.stockCount ?? 0;
    const now = new Date().toISOString();

    if (cloverStock !== product.quantity) {
      const previousQuantity = product.quantity;
      await supabase
        .from("products")
        .update({ quantity: cloverStock, updated_at: now })
        .eq("id", product.id);

      await supabase.from("inventory_adjustments").insert({
        product_id: product.id,
        quantity_change: cloverStock - previousQuantity,
        reason: "clover_sync",
        previous_quantity: previousQuantity,
        new_quantity: cloverStock,
        notes: `Clover inventory webhook — item ${itemId}`,
        adjusted_by: "clover_webhook",
        source: "clover_webhook",
      });

      console.log(`Synced Clover item ${itemId}: ${previousQuantity} → ${cloverStock}`);
    }
  } catch (err) {
    console.error(`Clover inventory webhook failed for item ${itemId}:`, err);
  }
}
