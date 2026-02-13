import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: discount, error } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !discount) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });
    }

    if (!discount.active) {
      return NextResponse.json({ error: "This promo code is no longer active" }, { status: 400 });
    }

    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }

    if (discount.max_uses !== null && discount.uses >= discount.max_uses) {
      return NextResponse.json({ error: "This promo code has reached its usage limit" }, { status: 400 });
    }

    const subtotal = orderTotal || 0;
    if (discount.min_order > 0 && subtotal < discount.min_order) {
      return NextResponse.json(
        { error: `Minimum order of $${discount.min_order} required` },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount: number;
    if (discount.type === "percentage") {
      discountAmount = Math.round(subtotal * (discount.value / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(discount.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
