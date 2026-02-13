import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAX_RATE, calculateShipping } from "@/lib/constants";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
  product_id?: string;
  variant_id?: string | null;
  condition?: string | null;
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
    const { email, items, fulfillmentType, shippingAddress, discountCode, phone } = body as {
      total?: number;
      email?: string;
      items?: CartItem[];
      fulfillmentType?: string;
      shippingAddress?: object;
      discountCode?: string;
      phone?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart", code: "EMPTY_CART" },
        { status: 400 }
      );
    }

    // === SERVER-SIDE STOCK VALIDATION ===
    const supabase = createAdminClient();
    const productIds = items.map((item) => item.product_id || item.id);
    const { data: products, error: stockError } = await supabase
      .from("products")
      .select("id, name, quantity, price, is_active")
      .in("id", productIds);

    if (stockError) {
      console.error("Stock check failed:", stockError.message);
      return NextResponse.json(
        { error: "Failed to validate stock", code: "STOCK_CHECK_FAILED" },
        { status: 500 }
      );
    }

    // Also fetch variant stock for items with variant_id
    const variantIds = items
      .filter((item) => item.variant_id)
      .map((item) => item.variant_id!);
    let variantMap = new Map<string, { id: string; quantity: number; price: number }>();
    if (variantIds.length > 0) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, quantity, price")
        .in("id", variantIds);
      variantMap = new Map((variants ?? []).map((v) => [v.id, v]));
    }

    const productMap = new Map(products?.map((p) => [p.id, p]) || []);
    const outOfStock: string[] = [];
    const insufficientStock: { name: string; available: number; requested: number }[] = [];

    for (const item of items) {
      const pid = item.product_id || item.id;
      const product = productMap.get(pid);
      if (!product || !product.is_active) {
        outOfStock.push(item.name);
        continue;
      }

      // Check variant stock if variant_id exists
      if (item.variant_id && variantMap.has(item.variant_id)) {
        const variant = variantMap.get(item.variant_id)!;
        if (variant.quantity < item.quantity) {
          insufficientStock.push({
            name: `${item.name} (Size ${item.size || "?"})`,
            available: variant.quantity,
            requested: item.quantity,
          });
        }
      } else if (product.quantity < item.quantity) {
        insufficientStock.push({
          name: item.name,
          available: product.quantity,
          requested: item.quantity,
        });
      }
    }

    if (outOfStock.length > 0) {
      return NextResponse.json(
        {
          error: `The following items are no longer available: ${outOfStock.join(", ")}`,
          code: "OUT_OF_STOCK",
          outOfStock,
        },
        { status: 409 }
      );
    }

    if (insufficientStock.length > 0) {
      return NextResponse.json(
        {
          error: `Insufficient stock for: ${insufficientStock.map((i) => `${i.name} (${i.available} left)`).join(", ")}`,
          code: "INSUFFICIENT_STOCK",
          insufficientStock,
        },
        { status: 409 }
      );
    }

    // === COMPUTE TOTALS SERVER-SIDE ===
    const subtotal = items.reduce((sum, item) => {
      // Use variant price if available, else product price
      if (item.variant_id && variantMap.has(item.variant_id)) {
        return sum + Number(variantMap.get(item.variant_id)!.price) * item.quantity;
      }
      const product = productMap.get(item.product_id || item.id);
      const price = product ? Number(product.price) : item.price;
      return sum + price * item.quantity;
    }, 0);

    const ft = (fulfillmentType || "ship") as "ship" | "pickup";
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const shippingCost = calculateShipping(subtotal, ft);

    // Validate and apply discount code server-side
    let discountAmount = 0;
    let validatedDiscountCode: string | null = null;
    if (discountCode) {
      const { data: discount } = await supabase
        .from("discounts")
        .select("*")
        .eq("code", discountCode.toUpperCase().trim())
        .single();

      if (
        discount &&
        discount.active &&
        (!discount.expires_at || new Date(discount.expires_at) >= new Date()) &&
        (discount.max_uses === null || discount.uses < discount.max_uses) &&
        subtotal >= (discount.min_order || 0)
      ) {
        validatedDiscountCode = discount.code;
        if (discount.type === "percentage") {
          discountAmount = Math.round(subtotal * (discount.value / 100) * 100) / 100;
        } else {
          discountAmount = Math.min(Number(discount.value), subtotal);
        }
      }
    }

    const total = subtotal + tax + shippingCost - discountAmount;

    if (total <= 0) {
      return NextResponse.json(
        { error: "Invalid order total", code: "INVALID_TOTAL" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Serialize items for metadata (Stripe metadata values must be strings, max 500 chars)
    const itemsData = items.map((item) => {
      const product = productMap.get(item.product_id || item.id);
      const variantPrice = item.variant_id && variantMap.has(item.variant_id)
        ? Number(variantMap.get(item.variant_id)!.price)
        : null;
      return {
        id: item.product_id || item.id,
        variant_id: item.variant_id || null,
        qty: item.quantity,
        price: variantPrice ?? (product ? Number(product.price) : item.price),
        size: item.size || null,
        name: item.name.substring(0, 50),
      };
    });

    // Create PaymentIntent with item data in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: "usd",
      receipt_email: email || undefined,
      metadata: {
        fulfillmentType: ft,
        email: email ?? "",
        itemCount: items.length.toString(),
        items: JSON.stringify(itemsData),
        shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : "",
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        discountCode: validatedDiscountCode || "",
        discountAmount: discountAmount.toFixed(2),
        phone: phone ?? "",
        deliveryMethod: ft === "pickup" ? "pickup" : "shipping",
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
