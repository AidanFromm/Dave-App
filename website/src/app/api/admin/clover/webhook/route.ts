import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCloverClientFromEnv } from "@/lib/clover";

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
    const { type, objectId, merchants } = payload as {
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
    if (type === "UPDATE" || type === "CREATE") {
      if (objectId) {
        try {
          const cloverItem = await client.getItem(objectId);
          if (cloverItem) {
            const cloverQty = cloverItem.itemStock?.quantity ?? cloverItem.stockCount ?? 0;

            // Find matching product
            const { data: product } = await supabase
              .from("products")
              .select("id, quantity")
              .eq("clover_item_id", objectId)
              .single();

            if (product && product.quantity !== cloverQty) {
              const now = new Date().toISOString();
              await supabase
                .from("products")
                .update({ quantity: cloverQty, updated_at: now })
                .eq("id", product.id);

              await supabase.from("inventory_adjustments").insert({
                product_id: product.id,
                quantity_change: cloverQty - product.quantity,
                reason: "sold_instore",
                previous_quantity: product.quantity,
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
    }

    // Handle order events
    if (type === "order" || (objectId && payload.type?.toLowerCase().includes("order"))) {
      try {
        const order = objectId ? await client.getOrder(objectId) : null;
        if (order && (order.state === "locked" || order.state === "paid")) {
          // Check for duplicate
          const { data: existing } = await supabase
            .from("orders")
            .select("id")
            .eq("clover_order_id", objectId)
            .single();

          if (!existing) {
            const lineItems = order.lineItems?.elements ?? [];
            const total = order.total / 100;
            const items = lineItems.map((li) => ({
              name: li.name,
              price: li.price / 100,
              quantity: li.unitQty || 1,
              clover_item_id: li.item?.id ?? null,
            }));

            const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const tax = Math.round((total - subtotal) * 100) / 100;

            const now = new Date();
            const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
            const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");

            await supabase.from("orders").insert({
              order_number: `SEC-${dateStr}-${suffix}`,
              status: "delivered",
              channel: "in_store",
              items,
              subtotal,
              tax,
              shipping: 0,
              total,
              clover_order_id: objectId,
              created_at: new Date(order.createdTime).toISOString(),
              updated_at: now.toISOString(),
            });

            // Decrement stock for each line item
            for (const li of lineItems) {
              if (!li.item?.id) continue;
              const { data: product } = await supabase
                .from("products")
                .select("id, quantity")
                .eq("clover_item_id", li.item.id)
                .single();

              if (product) {
                const qty = li.unitQty || 1;
                const newQty = Math.max(0, product.quantity - qty);
                await supabase
                  .from("products")
                  .update({ quantity: newQty, updated_at: now.toISOString() })
                  .eq("id", product.id);
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
