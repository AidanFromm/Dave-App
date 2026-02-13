import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SEC-";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`gc-purchase:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { amount, recipientEmail, recipientName, message, senderEmail } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 5 || numAmount > 500) {
      return NextResponse.json({ error: "Amount must be between $5 and $500" }, { status: 400 });
    }

    if (!senderEmail || !senderEmail.includes("@")) {
      return NextResponse.json({ error: "Valid sender email is required" }, { status: 400 });
    }

    const stripe = getStripe();

    // Create a Stripe checkout session for the gift card
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Secured Tampa Gift Card - $${numAmount.toFixed(2)}`,
              description: recipientName
                ? `Gift card for ${recipientName}`
                : "Digital gift card",
            },
            unit_amount: Math.round(numAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://securedtampa.com"}/shop/gift-cards?success=true&amount=${numAmount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://securedtampa.com"}/shop/gift-cards`,
      metadata: {
        type: "gift_card",
        amount: numAmount.toString(),
        recipientEmail: recipientEmail || "",
        recipientName: recipientName || "",
        message: (message || "").substring(0, 400),
        senderEmail,
        giftCardCode: generateGiftCardCode(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Gift card purchase error:", err);
    return NextResponse.json({ error: "Failed to create gift card purchase" }, { status: 500 });
  }
}
