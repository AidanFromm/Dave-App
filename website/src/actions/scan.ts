"use server";

import { createClient } from "@/lib/supabase/server";
import { saveBarcodeCatalogEntry } from "./barcode";
import type { ScanFormData } from "@/types/barcode";

export async function addScannedProductToInventory(data: ScanFormData): Promise<{
  productId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // 1. Create product in products table
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: data.productName,
      brand: data.brand || null,
      colorway: data.colorway || null,
      sku: data.styleId || null,
      barcode: data.barcode || null,
      size: data.size || null,
      condition: data.condition,
      has_box: data.hasBox,
      cost: data.cost,
      price: data.price,
      images: data.images,
      quantity: 1,
      low_stock_threshold: 1,
      is_active: true,
      is_featured: false,
      is_drop: false,
      tags: [],
    })
    .select("id")
    .single();

  if (productError) {
    return { productId: null, error: productError.message };
  }

  // 2. Save barcode to catalog for future instant lookups
  if (data.barcode) {
    await saveBarcodeCatalogEntry({
      barcode: data.barcode,
      barcode_type: "UPC",
      stockx_product_id: data.stockxProductId ?? null,
      stockx_variant_id: data.stockxVariantId ?? null,
      product_name: data.productName,
      brand: data.brand,
      colorway: data.colorway,
      style_id: data.styleId,
      size: data.size,
      image_url: data.images[0] ?? null,
      image_urls: data.images,
      product_type: data.productType,
    });
  }

  return { productId: product.id, error: null };
}
