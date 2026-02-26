import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getStripe } from "@/lib/stripe";
import { TAX_RATE } from "@/lib/constants";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { productId, productName, sellPrice, tax, total, imageUrl } = body as {
      productId: string;
      productName: string;
      sellPrice: number;
      tax: number;
      total: number;
      imageUrl?: string;
    };

    if (!productId || !sellPrice || sellPrice <= 0) {
      return NextResponse.json({ error: "Invalid product or price" }, { status: 400 });
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://securedtampa.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
            unit_amount: Math.round(sellPrice * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Sales Tax (7.5%)" },
            unit_amount: Math.round(tax * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        productId,
        sellPrice: sellPrice.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        channel: "in_store",
        source: "pos_qr",
      },
      success_url: `${siteUrl}/admin/scan?pos_success=true`,
      cancel_url: `${siteUrl}/admin/scan?pos_cancelled=true`,
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (err) {
    console.error("POS Stripe session error:", err);
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
