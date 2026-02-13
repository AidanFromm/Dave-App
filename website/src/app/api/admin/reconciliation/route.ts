import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // Fetch all active products with their current quantity
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, sku, quantity, brand, images")
    .eq("is_active", true)
    .order("name");

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  // Fetch recent reconciliations (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: reconciliations, error: recErr } = await supabase
    .from("inventory_reconciliations")
    .select("*")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (recErr) {
    return NextResponse.json({ error: recErr.message }, { status: 500 });
  }

  return NextResponse.json({ products: products ?? [], reconciliations: reconciliations ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { product_id, expected_qty, actual_qty, notes } = body;

  if (!product_id || expected_qty == null || actual_qty == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const discrepancy = actual_qty - expected_qty;

  const { data, error } = await supabase
    .from("inventory_reconciliations")
    .insert({
      product_id,
      expected_qty,
      actual_qty,
      discrepancy,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reconciliation: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { id, resolved, resolved_by, notes, adjust_inventory, product_id, actual_qty } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing reconciliation id" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (resolved !== undefined) updates.resolved = resolved;
  if (resolved_by) updates.resolved_by = resolved_by;
  if (notes !== undefined) updates.notes = notes;

  const { error } = await supabase
    .from("inventory_reconciliations")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Optionally adjust product inventory to match actual count
  if (adjust_inventory && product_id && actual_qty != null) {
    const { error: adjErr } = await supabase
      .from("products")
      .update({ quantity: actual_qty })
      .eq("id", product_id);

    if (adjErr) {
      return NextResponse.json({ error: adjErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
