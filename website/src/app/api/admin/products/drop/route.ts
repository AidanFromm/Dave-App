import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List all drop products
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("products")
      .select("*")
      .eq("is_drop", true)
      .order("drop_starts_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error("Admin drop products fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch drops" }, { status: 500 });
  }
}

// POST - Create a drop (flag product as drop)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, dropPrice, dropQuantity, dropStartsAt, dropEndsAt } = await request.json();

    if (!productId || !dropStartsAt) {
      return NextResponse.json({ error: "Product and start date required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Check product exists and isn't already a drop
    const { data: product } = await admin
      .from("products")
      .select("id, is_drop")
      .eq("id", productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.is_drop) {
      return NextResponse.json({ error: "Product is already an active drop" }, { status: 409 });
    }

    const { error } = await admin
      .from("products")
      .update({
        is_drop: true,
        drop_price: dropPrice ?? null,
        drop_quantity: dropQuantity ?? null,
        drop_starts_at: dropStartsAt,
        drop_ends_at: dropEndsAt ?? null,
        drop_sold_count: 0,
      })
      .eq("id", productId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Create drop error:", err);
    return NextResponse.json({ error: "Failed to create drop" }, { status: 500 });
  }
}

// PATCH - Update drop details
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId, dropPrice, dropQuantity, dropStartsAt, dropEndsAt } = await request.json();
    if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (dropPrice !== undefined) updates.drop_price = dropPrice;
    if (dropQuantity !== undefined) updates.drop_quantity = dropQuantity;
    if (dropStartsAt !== undefined) updates.drop_starts_at = dropStartsAt;
    if (dropEndsAt !== undefined) updates.drop_ends_at = dropEndsAt;

    const { error } = await admin
      .from("products")
      .update(updates)
      .eq("id", productId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Update drop error:", err);
    return NextResponse.json({ error: "Failed to update drop" }, { status: 500 });
  }
}

// DELETE - End drop (return product to regular inventory)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const admin = createAdminClient();

    const { error } = await admin
      .from("products")
      .update({
        is_drop: false,
        drop_price: null,
        drop_quantity: null,
        drop_starts_at: null,
        drop_ends_at: null,
        drop_sold_count: 0,
      })
      .eq("id", productId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("End drop error:", err);
    return NextResponse.json({ error: "Failed to end drop" }, { status: 500 });
  }
}
