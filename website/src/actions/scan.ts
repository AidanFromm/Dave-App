"use server";

import { createClient } from "@/lib/supabase/server";
import { saveBarcodeCatalogEntry } from "./barcode";
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

    return { productId: existing.id, error: null };
  }

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

  return { productId: product.id, error: null };
}
