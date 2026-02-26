import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber, TAX_RATE } from "@/lib/constants";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { productId, sellPrice, tax, total, paymentMethod, amountReceived } = body as {
      productId: string;
      sellPrice: number;
      tax: number;
      total: number;
      paymentMethod: "cash";
      amountReceived?: number;
    };

    if (!productId || !sellPrice || sellPrice <= 0) {
      return NextResponse.json({ error: "Invalid product or price" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch product
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, name, brand, size, price, cost, quantity, image_urls, is_active")
      .eq("id", productId)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.quantity < 1) {
      return NextResponse.json({ error: "Product out of stock" }, { status: 409 });
    }

    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    // Create order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: "in-store@securedtampa.com",
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
        payment_method: "cash",
        stripe_payment_id: `cash-${Date.now()}`,
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

    if (orderErr) {
      console.error("Order creation failed:", orderErr);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // Decrement inventory
    await supabase
      .from("products")
      .update({ quantity: Math.max(0, product.quantity - 1), updated_at: now })
      .eq("id", productId);

    // Log inventory adjustment
    await supabase.from("inventory_logs").insert({
      product_id: productId,
      adjustment: -1,
      reason: `In-store sale: ${orderNumber}`,
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: order.id,
      change: paymentMethod === "cash" && amountReceived ? Math.max(0, amountReceived - total) : 0,
    });
  } catch (err) {
    console.error("POS sell error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
