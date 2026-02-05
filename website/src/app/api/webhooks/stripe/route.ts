import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOrderNumber } from "@/lib/constants";
import type Stripe from "stripe";

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
    const { email, fulfillmentType } = paymentIntent.metadata;

    const supabase = createAdminClient();

    // Create order record
    const orderNumber = generateOrderNumber();

    await supabase.from("orders").insert({
      order_number: orderNumber,
      customer_email: email,
      channel: "web",
      subtotal: paymentIntent.amount / 100,
      tax: 0, // Calculated on client side, stored in metadata
      shipping_cost: 0,
      discount: 0,
      total: paymentIntent.amount / 100,
      status: "paid",
      fulfillment_type: fulfillmentType || "ship",
      stripe_payment_id: paymentIntent.id,
      stripe_payment_status: "succeeded",
      items: [],
    });
  }

  return NextResponse.json({ received: true });
}
