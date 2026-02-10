import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { CloverClient } from "@/lib/clover";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get("X-Clover-Hmac-Sha256");

    // Verify webhook signature if header is present
    if (hmacHeader) {
      const supabase = createAdminClient();
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

    const supabase = createAdminClient();

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
    } else if (type === "inventory") {
      // Inventory webhook - sync triggered
    } else if (type === "payment") {
      // Payment webhook - logged
    } else {
      // Unhandled webhook type
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
    // Skipping non-completed order
    return;
  }

  // Check if order already exists
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("clover_order_id", orderId)
    .single();

  if (existingOrder) {
    // Already synced
    return;
  }

  // Build order items
  const lineItems = cloverOrder.lineItems?.elements ?? [];
  const items = lineItems.map((item) => ({
    name: item.name,
    price: item.price / 100, // Clover uses cents
    quantity: item.unitQty || 1,
    clover_item_id: item.item?.id ?? null,
  }));

  const total = cloverOrder.total / 100;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = Math.round((total - subtotal) * 100) / 100;

  // Generate order number
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  const orderNumber = `SEC-${dateStr}-${randomSuffix}`;

  // Insert order
  const { error: orderError } = await supabase.from("orders").insert({
    order_number: orderNumber,
    status: "delivered",
    sales_channel: "in_store",
    items,
    subtotal,
    tax,
    shipping: 0,
    total,
    clover_order_id: orderId,
    created_at: new Date(cloverOrder.createdTime).toISOString(),
    updated_at: now.toISOString(),
  });

  if (orderError) {
    console.error(`Failed to insert Clover order ${orderId}:`, orderError.message);
    return;
  }

  // Order synced successfully

  // Decrement product stock for each line item
  for (const item of lineItems) {
    if (!item.item?.id) continue;

    // Try to find matching product by Clover item ID or name
    const { data: product } = await supabase
      .from("products")
      .select("id, quantity")
      .or(`clover_item_id.eq.${item.item.id},name.ilike.${item.name}`)
      .single();

    if (product) {
      const qty = item.unitQty || 1;
      const newQuantity = Math.max(0, product.quantity - qty);

      await supabase
        .from("products")
        .update({ quantity: newQuantity, updated_at: now.toISOString() })
        .eq("id", product.id);

      // Log inventory adjustment
      await supabase.from("inventory_adjustments").insert({
        product_id: product.id,
        quantity_change: -qty,
        reason: "sold_instore",
        previous_quantity: product.quantity,
        new_quantity: newQuantity,
        notes: `Clover order ${orderId}`,
        adjusted_by: "clover_webhook",
        source: "clover_webhook",
      });

      // Stock decremented
    }
  }
}
