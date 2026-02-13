import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, amount, description, customerEmail, items } = body;

    const stripe = getStripe();

    // If orderId is provided, create payment link from order items
    if (orderId) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const orderItems = order.items as Array<{
        name: string;
        price: number;
        quantity: number;
      }>;

      const lineItems = await Promise.all(
        orderItems.map(async (item) => {
          const price = await stripe.prices.create({
            unit_amount: Math.round(item.price * 100),
            currency: "usd",
            product_data: {
              name: item.name,
            },
          });
          return { price: price.id, quantity: item.quantity };
        })
      );

      // Add shipping if applicable
      if (order.shipping_cost > 0) {
        const shippingPrice = await stripe.prices.create({
          unit_amount: Math.round(order.shipping_cost * 100),
          currency: "usd",
          product_data: { name: "Shipping" },
        });
        lineItems.push({ price: shippingPrice.id, quantity: 1 });
      }

      // Add tax if applicable
      if (order.tax > 0) {
        const taxPrice = await stripe.prices.create({
          unit_amount: Math.round(order.tax * 100),
          currency: "usd",
          product_data: { name: "Tax" },
        });
        lineItems.push({ price: taxPrice.id, quantity: 1 });
      }

      const paymentLink = await stripe.paymentLinks.create({
        line_items: lineItems,
        metadata: {
          order_id: orderId,
          source: "admin_order",
        },
        after_completion: {
          type: "redirect",
          redirect: {
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://securedtampa.com"}/checkout/confirmation?order_id=${orderId}`,
          },
        },
      });

      // Save payment link to order
      await supabase
        .from("orders")
        .update({ payment_link: paymentLink.url })
        .eq("id", orderId);

      return NextResponse.json({ url: paymentLink.url });
    }

    // Standalone payment link (quick link)
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount is required and must be positive" },
        { status: 400 }
      );
    }

    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: "usd",
      product_data: {
        name: description || "Secured Tampa - Custom Order",
      },
    });

    const linkOptions: Record<string, unknown> = {
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        source: "admin_quick_link",
        customer_email: customerEmail || "",
        description: description || "",
      },
      after_completion: {
        type: "redirect",
        redirect: {
          url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://securedtampa.com"}/checkout/confirmation`,
        },
      },
    };

    const paymentLink = await stripe.paymentLinks.create(
      linkOptions as unknown as Parameters<typeof stripe.paymentLinks.create>[0]
    );

    return NextResponse.json({ url: paymentLink.url });
  } catch (err: unknown) {
    console.error("Payment link error:", err);
    const message = err instanceof Error ? err.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
