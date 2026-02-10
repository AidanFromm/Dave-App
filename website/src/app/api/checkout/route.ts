import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
}

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
    const { total, email, items, fulfillmentType, shippingAddress } = body as {
      total: number;
      email?: string;
      items?: CartItem[];
      fulfillmentType?: string;
      shippingAddress?: object;
    };

    if (!total || total <= 0) {
      return NextResponse.json(
        { error: "Invalid order total", code: "INVALID_TOTAL" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart", code: "EMPTY_CART" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Serialize items for metadata (Stripe metadata values must be strings, max 500 chars)
    // Store essential info: product ID, quantity, price, size
    const itemsData = items.map((item) => ({
      id: item.id,
      qty: item.quantity,
      price: item.price,
      size: item.size || null,
      name: item.name.substring(0, 50), // Truncate name to save space
    }));

    // Create PaymentIntent with item data in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: "usd",
      receipt_email: email || undefined,
      metadata: {
        fulfillmentType: fulfillmentType || "ship",
        email: email ?? "",
        itemCount: items.length.toString(),
        // Store items as JSON string (Stripe allows up to 500 chars per value)
        items: JSON.stringify(itemsData),
        // Store shipping address if provided
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : "",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    const err = error as Error & { type?: string; code?: string };
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
