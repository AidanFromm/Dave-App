import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber, TAX_RATE } from "@/lib/constants";

interface CartItem {
  productId: string;
  name: string;
  brand: string | null;
  size: string | null;
  price: number;
  quantity: number;
  image_url: string | null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { items, subtotal, tax, total, paymentMethod, amountReceived } = body as {
      items: CartItem[];
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: "cash" | "stripe";
      amountReceived?: number;
    };

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Validate all products exist and have stock
    for (const item of items) {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, quantity")
        .eq("id", item.productId)
        .single();

      if (error || !product) {
        return NextResponse.json({ error: `Product not found: ${item.name}` }, { status: 404 });
      }
      if (product.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name} (have ${product.quantity}, need ${item.quantity})` },
          { status: 409 }
        );
      }
    }

    const orderNumber = generateOrderNumber();

    // Create order with all items
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: "in-store@securedtampa.com",
        channel: "in_store",
        subtotal,
        tax,
        shipping_cost: 0,
        discount: 0,
        total,
        status: "paid",
        fulfillment_type: "pickup",
        delivery_method: "pickup",
        pickup_status: "picked_up",
        payment_method: paymentMethod === "cash" ? "cash" : "stripe",
        stripe_payment_id: paymentMethod === "cash" ? `cash-${Date.now()}` : `pos-stripe-${Date.now()}`,
        stripe_payment_status: "succeeded",
        items: items.map((item) => ({
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size || null,
        })),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (orderErr) {
      console.error("Order creation failed:", orderErr);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Decrement inventory for each item
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", item.productId)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({
            quantity: Math.max(0, product.quantity - item.quantity),
            updated_at: now,
          })
          .eq("id", item.productId);

        await supabase.from("inventory_logs").insert({
          product_id: item.productId,
          adjustment: -item.quantity,
          reason: `In-store sale: ${orderNumber}`,
          created_at: now,
        });
      }
    }

    const change =
      paymentMethod === "cash" && amountReceived
        ? Math.max(0, Math.round((amountReceived - total) * 100) / 100)
        : 0;

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      change,
    });
  } catch (err) {
    console.error("POS cart sell error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
