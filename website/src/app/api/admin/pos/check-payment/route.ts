import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/constants";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      // Check if order already created for this session
      const supabase = createAdminClient();
      const { data: existing } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("stripe_payment_id", sessionId)
        .single();

      if (existing) {
        return NextResponse.json({
          status: "paid",
          orderNumber: existing.order_number,
          orderId: existing.id,
          alreadyProcessed: true,
        });
      }

      // Create order
      const meta = session.metadata || {};
      const productId = meta.productId;
      const sellPrice = parseFloat(meta.sellPrice || "0");
      const tax = parseFloat(meta.tax || "0");
      const total = parseFloat(meta.total || "0");
      const orderNumber = generateOrderNumber();
      const now = new Date().toISOString();

      // Fetch product for details
      const { data: product } = await supabase
        .from("products")
        .select("id, name, brand, size, quantity")
        .eq("id", productId)
        .single();

      if (product) {
        const { data: order } = await supabase
          .from("orders")
          .insert({
            order_number: orderNumber,
            customer_email: session.customer_details?.email || "in-store@securedtampa.com",
            channel: "in_store",
            subtotal: sellPrice,
            tax,
            shipping_cost: 0,
            discount: 0,
            total,
            status: "paid",
            fulfillment_type: "pickup",
            delivery_method: "pickup",
            pickup_status: "picked_up",
            payment_method: "stripe",
            stripe_payment_id: sessionId,
            stripe_payment_status: "succeeded",
            items: [
              {
                product_id: product.id,
                name: product.name,
                price: sellPrice,
                quantity: 1,
                size: product.size || null,
              },
            ],
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        // Decrement inventory
        await supabase
          .from("products")
          .update({ quantity: Math.max(0, product.quantity - 1), updated_at: now })
          .eq("id", productId);

        // Log
        await supabase.from("inventory_logs").insert({
          product_id: productId,
          adjustment: -1,
          reason: `In-store Stripe sale: ${orderNumber}`,
          created_at: now,
        });

        return NextResponse.json({
          status: "paid",
          orderNumber,
          orderId: order?.id,
        });
      }

      return NextResponse.json({ status: "paid", orderNumber, error: "Product not found for order creation" });
    }

    if (session.status === "expired") {
      return NextResponse.json({ status: "expired" });
    }

    return NextResponse.json({ status: "pending" });
  } catch (err) {
    console.error("Check payment error:", err);
    return NextResponse.json({ error: "Failed to check payment" }, { status: 500 });
  }
}
