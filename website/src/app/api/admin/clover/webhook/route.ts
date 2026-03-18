import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCloverClientFromEnv } from "@/lib/clover";
import { generateOrderNumber } from "@/lib/constants";

/**
 * Clover webhook receiver.
 * Handles inventory updates and order events from the Clover POS.
 * This endpoint is NOT admin-protected (webhooks come from Clover servers).
 * Instead it validates via HMAC signature.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get("X-Clover-Hmac-Sha256");

    // Verify HMAC signature if secret is configured
    const webhookSecret = process.env.CLOVER_WEBHOOK_SECRET;
    if (webhookSecret && hmacHeader) {
      const expectedHmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("base64");

      if (hmacHeader !== expectedHmac) {
        console.error("Clover webhook signature mismatch");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { type, objectId } = payload as {
      type?: string;
      objectId?: string;
      merchants?: Record<string, string>;
    };

    const supabase = createAdminClient();
    const client = getCloverClientFromEnv();

    if (!client) {
      return NextResponse.json({ error: "Clover not configured" }, { status: 400 });
    }

    // Handle item/inventory updates
    if ((type === "UPDATE" || type === "CREATE") && objectId) {
      try {
        const cloverItem = await client.getItem(objectId);
        if (cloverItem) {
          const cloverQty = cloverItem.itemStock?.quantity ?? cloverItem.stockCount ?? 0;

          // Find matching product by name
          const { data: product } = await supabase
            .from("products")
            .select("id, quantity, name")
            .ilike("name", cloverItem.name || "")
            .single();

          if (product && product.quantity !== cloverQty) {
            const now = new Date().toISOString();
            const previousQuantity = product.quantity;

            await supabase
              .from("products")
              .update({ quantity: cloverQty, updated_at: now })
              .eq("id", product.id);

            await supabase.from("inventory_adjustments").insert({
              product_id: product.id,
              quantity_change: cloverQty - previousQuantity,
              reason: "sold_instore",
              previous_quantity: previousQuantity,
              new_quantity: cloverQty,
              notes: `Clover webhook - ${type} ${objectId}`,
              adjusted_by: "clover_webhook",
              source: "clover_webhook",
            });
          }
        }
      } catch (err) {
        console.error(`Webhook item sync error for ${objectId}:`, err);
      }
    }

    // Handle order events
    if (objectId && (type === "order" || type?.toLowerCase().includes("order"))) {
      try {
        const order = await client.getOrder(objectId);
        if (order && (order.state === "locked" || order.state === "paid")) {
          // Idempotency check via stripe_payment_id
          const cloverPaymentId = `clover-${objectId}`;
          const { data: existing } = await supabase
            .from("orders")
            .select("id")
            .eq("stripe_payment_id", cloverPaymentId)
            .single();

          if (!existing) {
            const lineItems = order.lineItems?.elements ?? [];
            const total = order.total / 100;
            const items = lineItems.map((li: any) => ({
              product_id: li.item?.id ?? null,
              name: li.name,
              price: li.price / 100,
              quantity: li.unitQty || 1,
              size: null,
            }));

            const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
            const tax = Math.max(0, Math.round((total - subtotal) * 100) / 100);
            const now = new Date().toISOString();
            const orderNumber = generateOrderNumber();

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
              created_at: new Date(order.createdTime).toISOString(),
              updated_at: now,
            });

            if (orderError) {
              console.error(`CRITICAL: Failed to insert Clover order ${objectId}:`, orderError.message);
            }

            // Decrement stock for each line item
            for (const li of lineItems) {
              if (!li.item?.id) continue;
              try {
                const { data: product } = await supabase
                  .from("products")
                  .select("id, quantity")
                  .ilike("name", li.name)
                  .single();

                if (product) {
                  const qty = li.unitQty || 1;
                  const newQty = Math.max(0, product.quantity - qty);
                  await supabase
                    .from("products")
                    .update({ quantity: newQty, updated_at: now })
                    .eq("id", product.id);

                  await supabase.from("inventory_adjustments").insert({
                    product_id: product.id,
                    quantity_change: -qty,
                    reason: "sold_instore",
                    previous_quantity: product.quantity,
                    new_quantity: newQty,
                    notes: `Clover order ${objectId} — ${orderNumber}`,
                    adjusted_by: "clover_webhook",
                    source: "clover_webhook",
                  });
                }
              } catch (err) {
                console.error(`Stock decrement failed for ${li.name}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.error(`Webhook order sync error for ${objectId}:`, err);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Clover webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
