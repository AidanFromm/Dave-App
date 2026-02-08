import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/constants";
import type Stripe from "stripe";

interface OrderItem {
  id: string;
  qty: number;
  price: number;
  size: string | null;
  name: string;
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
    const { email, fulfillmentType, items: itemsJson, shippingAddress } = paymentIntent.metadata;

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
      customer_email: email || null,
      sales_channel: "web",
      subtotal: paymentIntent.amount / 100,
      tax: 0,
      shipping_cost: 0,
      discount: 0,
      total: paymentIntent.amount / 100,
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
    } else {
      console.log(`Order ${orderNumber} created from Stripe payment ${paymentIntent.id}`);
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

      // Log inventory adjustment
      await supabase.from("inventory_adjustments").insert({
        product_id: item.id,
        quantity_change: -item.qty,
        reason: "sold_online",
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes: `Stripe order ${orderNumber} (${paymentIntent.id})`,
        adjusted_by: "stripe_webhook",
        source: "stripe_webhook",
      });

      console.log(`Stock decremented for ${product.name}: ${previousQuantity} -> ${newQuantity}`);
    }
  }

  return NextResponse.json({ received: true });
}
