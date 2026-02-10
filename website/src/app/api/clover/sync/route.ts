import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CloverClient } from "@/lib/clover";

interface SyncResult {
  total: number;
  matched: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function POST() {
  try {
    const supabase = createAdminClient();

    // Fetch active Clover settings
    const { data: settings, error: settingsError } = await supabase
      .from("clover_settings")
      .select("*")
      .eq("is_active", true)
      .single();

    if (settingsError || !settings || !settings.merchant_id || !settings.access_token) {
      return NextResponse.json(
        { error: "Clover not connected. Please connect Clover first." },
        { status: 400 }
      );
    }

    const clover = new CloverClient(settings.merchant_id, settings.access_token);

    // Fetch all items from Clover
    const cloverItems = await clover.getItems();

    if (cloverItems.length === 0) {
      return NextResponse.json(
        { error: "No items found in Clover inventory" },
        { status: 404 }
      );
    }

    // Fetch all products from Supabase
    const { data: products } = await supabase.from("products").select("*");

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "No products found in database" },
        { status: 404 }
      );
    }

    const result: SyncResult = {
      total: cloverItems.length,
      matched: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    const now = new Date().toISOString();

    for (const cloverItem of cloverItems) {
      // Try to match product by SKU or barcode
      const matchedProduct = products.find((p) => {
        if (cloverItem.sku && p.sku && cloverItem.sku === p.sku) return true;
        if (cloverItem.code && p.barcode && cloverItem.code === p.barcode) return true;
        return false;
      });

      if (!matchedProduct) {
        result.skipped += 1;
        continue;
      }

      result.matched += 1;

      const cloverQuantity = cloverItem.stockCount ?? 0;
      const currentQuantity = matchedProduct.quantity ?? 0;

      // Only update if quantities differ
      if (cloverQuantity === currentQuantity) {
        result.skipped += 1;
        continue;
      }

      const quantityChange = cloverQuantity - currentQuantity;

      // Update product quantity
      const { error: updateError } = await supabase
        .from("products")
        .update({ quantity: cloverQuantity, updated_at: now })
        .eq("id", matchedProduct.id);

      if (updateError) {
        result.errors.push(`Failed to update ${matchedProduct.name}: ${updateError.message}`);
        continue;
      }

      // Log inventory adjustment
      const { error: logError } = await supabase
        .from("inventory_adjustments")
        .insert({
          product_id: matchedProduct.id,
          quantity_change: quantityChange,
          reason: "adjustment",
          previous_quantity: currentQuantity,
          new_quantity: cloverQuantity,
          notes: `Clover sync - Item: ${cloverItem.name}`,
          adjusted_by: "clover_sync",
          source: "clover_webhook",
        });

      if (logError) {
        console.error(`Failed to log adjustment for ${matchedProduct.name}:`, logError.message);
      }

      result.updated += 1;
    }

    // Update last_sync_at
    await supabase
      .from("clover_settings")
      .update({ last_sync_at: now, updated_at: now })
      .eq("id", settings.id);

    return NextResponse.json({
      success: true,
      summary: {
        total: result.total,
        matched: result.matched,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error("Clover sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync with Clover" },
      { status: 500 }
    );
  }
}
