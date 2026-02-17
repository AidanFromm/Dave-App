import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import type { AdjustmentReason, AdjustmentSource } from "@/types/admin";

interface AdjustBody {
  productId: string;
  quantityChange: number;
  reason: AdjustmentReason;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();

    const body = (await request.json()) as AdjustBody;
    const { productId, quantityChange, reason, notes } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    if (typeof quantityChange !== "number" || quantityChange === 0) {
      return NextResponse.json(
        { error: "quantityChange must be a non-zero number" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      );
    }

    // Get current product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, quantity, name")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + quantityChange;

    // Update product quantity
    const { error: updateError } = await supabase
      .from("products")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (updateError) {
      console.error("Stock update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update stock" },
        { status: 500 }
      );
    }

    // Log adjustment
    const { error: logError } = await supabase
      .from("inventory_adjustments")
      .insert({
        product_id: productId,
        quantity_change: quantityChange,
        reason,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes: notes ?? null,
        adjusted_by: auth.user.id,
        source: "admin" as AdjustmentSource,
      });

    if (logError) {
      console.error("Adjustment log error:", logError.message);
      // Don't fail the request since the stock was already updated
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        previousQuantity,
        newQuantity,
        quantityChange,
      },
    });
  } catch (error) {
    console.error("Inventory adjust API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
