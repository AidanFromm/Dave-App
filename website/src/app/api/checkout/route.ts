import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAX_RATE, calculateShipping } from "@/lib/constants";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeString, sanitizeEmail } from "@/lib/sanitize";

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
    // Rate limit: 5 checkout attempts per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(`checkout:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
        { status: 429 }
      );
    }

    // Check env var first
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "Payment system not configured", code: "NO_STRIPE_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, items, fulfillmentType, shippingAddress, discountCode, giftCardCode, phone } = body as {
      total?: number;
      email?: string;
      items?: CartItem[];
      fulfillmentType?: string;
      shippingAddress?: object;
      discountCode?: string;
      giftCardCode?: string;
      phone?: string;
    };

    // Sanitize inputs
    const sanitizedEmail = email ? sanitizeEmail(email) : null;
    if (email && !sanitizedEmail) {
      return NextResponse.json(
        { error: "Invalid email address", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

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
      .select("id, name, quantity, price, is_active, is_drop, drop_price, drop_quantity, drop_sold_count")
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
      const product = productMap.get(pid) as Record<string, unknown> | undefined;
      if (!product || !product.is_active) {
        outOfStock.push(item.name);
        continue;
      }

      // Drop quantity enforcement
      if (product.is_drop && product.drop_quantity != null) {
        const dropRemaining = (product.drop_quantity as number) - ((product.drop_sold_count as number) || 0);
        if (item.quantity > dropRemaining) {
          insufficientStock.push({
            name: `${item.name} (Drop)`,
            available: Math.max(0, dropRemaining),
            requested: item.quantity,
          });
          continue;
        }
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
      } else if ((product.quantity as number) < item.quantity) {
        insufficientStock.push({
          name: item.name as string,
          available: product.quantity as number,
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
      const product = productMap.get(item.product_id || item.id) as Record<string, unknown> | undefined;
      // Use drop_price for drop products
      const price = product
        ? (product.is_drop && product.drop_price != null ? Number(product.drop_price) : Number(product.price))
        : item.price;
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

    // Validate and apply gift card
    let giftCardAmount = 0;
    let validatedGiftCardId: string | null = null;
    let validatedGiftCardCode: string | null = null;
    if (giftCardCode) {
      const { data: giftCard } = await supabase
        .from("gift_cards")
        .select("id, code, remaining_balance, is_active, expires_at")
        .eq("code", giftCardCode.toUpperCase().trim())
        .single();

      if (
        giftCard &&
        giftCard.is_active &&
        giftCard.remaining_balance > 0 &&
        (!giftCard.expires_at || new Date(giftCard.expires_at) >= new Date())
      ) {
        validatedGiftCardId = giftCard.id;
        validatedGiftCardCode = giftCard.code;
        // Apply up to the remaining balance or the pre-giftcard total, whichever is smaller
        const preGiftCardTotal = subtotal + tax + shippingCost - discountAmount;
        giftCardAmount = Math.min(Number(giftCard.remaining_balance), preGiftCardTotal);
      }
    }

    const total = subtotal + tax + shippingCost - discountAmount - giftCardAmount;

    // If gift card covers the entire order, we still need a minimal charge or handle differently
    // For now, if total is 0 or less, we'll need to handle it specially
    if (total < 0) {
      return NextResponse.json(
        { error: "Invalid order total", code: "INVALID_TOTAL" },
        { status: 400 }
      );
    }

    // If gift card covers entire order (total = 0), create order without Stripe
    if (total === 0) {
      const supabase = createAdminClient();
      const now = new Date().toISOString();
      
      // Generate order number
      const orderNumber = `ST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const isPickup = ft === "pickup";
      const pickupCode = isPickup ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
      
      // Format items for order
      const formattedItems = items.map((item) => {
        const product = productMap.get(item.product_id || item.id);
        const variantPrice = item.variant_id && variantMap.has(item.variant_id)
          ? Number(variantMap.get(item.variant_id)!.price)
          : null;
        return {
          product_id: item.product_id || item.id,
          variant_id: item.variant_id || null,
          name: item.name,
          price: variantPrice ?? (product ? Number(product.price) : item.price),
          quantity: item.quantity,
          size: item.size || null,
        };
      });
      
      // Create order
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_email: sanitizedEmail || "unknown@checkout.com",
        channel: "web",
        subtotal,
        tax,
        shipping_cost: shippingCost,
        discount: discountAmount,
        gift_card_amount: giftCardAmount,
        gift_card_code: validatedGiftCardCode || null,
        total: 0,
        status: "paid",
        fulfillment_type: ft,
        stripe_payment_id: `gc-${Date.now()}`, // Gift card payment ID
        stripe_payment_status: "succeeded",
        items: formattedItems,
        shipping_address: shippingAddress || null,
        delivery_method: isPickup ? "pickup" : "shipping",
        pickup_status: isPickup ? "pending" : null,
        customer_phone: phone || null,
        created_at: now,
        updated_at: now,
      }).select().single();
      
      if (orderError) {
        console.error("Failed to create gift card order:", orderError);
        return NextResponse.json(
          { error: "Failed to create order", code: "ORDER_ERROR" },
          { status: 500 }
        );
      }
      
      // Deduct gift card balance
      if (validatedGiftCardId) {
        const { data: gc } = await supabase
          .from("gift_cards")
          .select("balance")
          .eq("id", validatedGiftCardId)
          .single();
        
        if (gc) {
          const newBalance = Math.max(0, gc.balance - giftCardAmount);
          await supabase
            .from("gift_cards")
            .update({ balance: newBalance, updated_at: now })
            .eq("id", validatedGiftCardId);
          
          // Record transaction
          await supabase.from("gift_card_transactions").insert({
            gift_card_id: validatedGiftCardId,
            order_id: order.id,
            amount: -giftCardAmount,
            type: "redemption",
            created_at: now,
          });
        }
      }
      
      // Update inventory for each item
      for (const item of items) {
        const productId = item.product_id || item.id;
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("id, quantity")
            .eq("id", item.variant_id)
            .single();
          if (variant) {
            await supabase
              .from("product_variants")
              .update({ quantity: Math.max(0, variant.quantity - item.quantity) })
              .eq("id", item.variant_id);
          }
        }
        const { data: product } = await supabase
          .from("products")
          .select("id, quantity")
          .eq("id", productId)
          .single();
        if (product) {
          await supabase
            .from("products")
            .update({ quantity: Math.max(0, product.quantity - item.quantity) })
            .eq("id", productId);
        }
      }
      
      // Return success - client will redirect to confirmation
      return NextResponse.json({
        success: true,
        orderNumber,
        orderId: order.id,
        giftCardFullyCovered: true,
      });
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

    // Create PaymentIntent with item data in metadata + fraud protection
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: "usd",
      receipt_email: sanitizedEmail || undefined,
      payment_method_options: {
        card: {
          request_three_d_secure: "automatic",
        },
      },
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
        giftCardId: validatedGiftCardId || "",
        giftCardCode: validatedGiftCardCode || "",
        giftCardAmount: giftCardAmount.toFixed(2),
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
