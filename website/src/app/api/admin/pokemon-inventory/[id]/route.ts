import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.price_paid !== undefined) updates.price_paid = body.price_paid;
    if (body.selling_price !== undefined) updates.selling_price = body.selling_price;
    if (body.quantity !== undefined) updates.quantity = body.quantity;
    if (body.condition !== undefined) updates.condition = body.condition;

    const { data, error } = await supabase
      .from("pokemon_card_details")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update pokemon detail:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Also update the product price if selling_price changed
    if (body.selling_price !== undefined && data.product_id) {
      await supabase
        .from("products")
        .update({ price: body.selling_price, cost: body.price_paid ?? data.price_paid })
        .eq("id", data.product_id);
    }

    return NextResponse.json({ detail: data });
  } catch (error) {
    console.error("Pokemon inventory update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
