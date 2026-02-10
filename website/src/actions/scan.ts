"use server";

import { createClient } from "@/lib/supabase/server";
import { saveBarcodeCatalogEntry } from "./barcode";
import { syncToClover } from "@/lib/clover-sync";
import type { ScanFormData } from "@/types/barcode";

export async function addScannedProductToInventory(data: ScanFormData): Promise<{
  productId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Normalize the product name for matching
  const normalizedName = data.productName.trim().toLowerCase();

  // Try to find an existing product with same name, size, and condition
  // This prevents duplicate product pages for the same shoe/size/condition
  let query = supabase
    .from("products")
    .select("id, quantity, cost, price, images")
    .ilike("name", normalizedName)
    .eq("condition", data.condition);

  if (data.size) {
    query = query.eq("size", data.size);
  } else {
    query = query.is("size", null);
  }

  const { data: existingProducts } = await query.limit(1);

  if (existingProducts && existingProducts.length > 0) {
    const existing = existingProducts[0];

    // Merge: increment quantity, average cost, keep lower price
    const newQuantity = existing.quantity + 1;
    const existingCost = existing.cost ?? 0;
    const newCost = data.cost || 0;
    // Average the cost across all units
    const avgCost = existing.quantity > 0
      ? ((existingCost * existing.quantity) + newCost) / newQuantity
      : newCost;

    // For images: if used condition and new images provided, append them
    // For new condition, keep existing StockX images
    let mergedImages = existing.images || [];
    if (data.condition !== "new" && data.images.length > 0) {
      // Append new used images (customer needs to see each unit's condition)
      const newImages = data.images.filter((img: string) => !mergedImages.includes(img));
      mergedImages = [...mergedImages, ...newImages];
    } else if (data.condition === "new" && mergedImages.length === 0 && data.images.length > 0) {
      mergedImages = data.images;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        quantity: newQuantity,
        cost: Math.round(avgCost * 100) / 100,
        images: mergedImages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      return { productId: null, error: updateError.message };
    }

    // Still save barcode catalog entry for future lookups
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

    // Push updated stock to Clover (fire-and-forget)
    syncToClover(existing.id).catch(() => {});

    return { productId: existing.id, error: null };
  }

  // Build tags for Pokemon products
  const tags: string[] = [];
  if (data.productType === "pokemon" || data.productType === "pokemon_sealed") {
    tags.push("pokemon");
    if (data.productType === "pokemon_sealed") {
      tags.push("sealed");
      if (data.sealedType) tags.push(data.sealedType);
    }
    if (data.grading) {
      if (data.grading.conditionType === "graded") {
        tags.push("graded");
        if (data.grading.gradingCompany) tags.push(data.grading.gradingCompany);
      } else {
        tags.push("raw");
        if (data.grading.rawCondition) tags.push(data.grading.rawCondition);
      }
    }
  }

  // Build metadata JSON for grading info
  const metadata: Record<string, unknown> = {};
  if (data.grading) {
    metadata.grading = data.grading;
  }
  if (data.sealedType) {
    metadata.sealedType = data.sealedType;
  }

  const insertQuantity = data.quantity ?? 1;

  // No existing match — create new product
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
      quantity: insertQuantity,
      low_stock_threshold: 1,
      is_active: true,
      is_featured: false,
      is_drop: false,
      tags,
      ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    })
    .select("id")
    .single();

  if (productError) {
    return { productId: null, error: productError.message };
  }

  // Save barcode to catalog for future instant lookups
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

  // Push new product to Clover (fire-and-forget)
  syncToClover(product.id).catch(() => {});

  return { productId: product.id, error: null };
}
