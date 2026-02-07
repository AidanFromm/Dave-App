import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    // Check env var first
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Payment system not configured", code: "NO_STRIPE_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { total, email, items, fulfillmentType, shippingAddress } = body;

    console.log("Checkout request:", { total, email, fulfillmentType, itemCount: items?.length });

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Invalid order total", code: "INVALID_TOTAL" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: "usd",
      receipt_email: email || undefined,
      metadata: {
        fulfillmentType,
        itemCount: items?.length?.toString() ?? "0",
        email: email ?? "",
      },
    });

    console.log("PaymentIntent created:", paymentIntent.id);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    const err = error as Error & { type?: string; code?: string };
    console.error("Checkout error:", {
      message: err.message,
      type: err.type,
      code: err.code,
      stack: err.stack,
    });
    return NextResponse.json(
      { 
        error: "Failed to create payment", 
        detail: err.message,
        code: err.code || "UNKNOWN"
      },
      { status: 500 }
    );
  }
}
