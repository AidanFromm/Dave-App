"use server";

import { createClient } from "@/lib/supabase/server";
import type { ProductVariant, VariantCondition } from "@/types/product";

export async function getVariantsForProduct(productId: string): Promise<ProductVariant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("size");

  if (error) return [];

  return ((data ?? []) as ProductVariant[]).sort((a, b) => {
    const numA = parseFloat(a.size ?? "0");
    const numB = parseFloat(b.size ?? "0");
    return numA - numB;
  });
}

export async function getVariant(variantId: string): Promise<ProductVariant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("id", variantId)
    .single();

  if (error) return null;
  return data as ProductVariant;
}

export async function createVariant(variant: {
  product_id: string;
  size?: string | null;
  condition: VariantCondition;
  sku?: string | null;
  barcode?: string | null;
  price: number;
  cost?: number | null;
  quantity: number;
}): Promise<{ data: ProductVariant | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .insert(variant)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  
  // Mark parent product as having variants
  await supabase
    .from("products")
    .update({ has_variants: true })
    .eq("id", variant.product_id);

  return { data: data as ProductVariant, error: null };
}

export async function updateVariant(
  variantId: string,
  updates: Partial<Pick<ProductVariant, "size" | "condition" | "sku" | "barcode" | "price" | "cost" | "quantity">>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_variants")
    .update(updates)
    .eq("id", variantId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteVariant(variantId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  
  // Get product_id before deleting
  const { data: variant } = await supabase
    .from("product_variants")
    .select("product_id")
    .eq("id", variantId)
    .single();

  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  if (error) return { error: error.message };

  // Check if product still has variants
  if (variant) {
    const { count } = await supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("product_id", variant.product_id);

    if (count === 0) {
      await supabase
        .from("products")
        .update({ has_variants: false })
        .eq("id", variant.product_id);
    }
  }

  return { error: null };
}

export async function bulkCreateVariants(
  productId: string,
  variants: Array<{
    size: string;
    condition: VariantCondition;
    price: number;
    cost?: number | null;
    quantity: number;
    barcode?: string | null;
  }>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  
  const rows = variants.map((v) => ({
    product_id: productId,
    size: v.size,
    condition: v.condition,
    price: v.price,
    cost: v.cost ?? null,
    quantity: v.quantity,
    barcode: v.barcode ?? null,
  }));

  const { error } = await supabase
    .from("product_variants")
    .insert(rows);

  if (error) return { error: error.message };

  await supabase
    .from("products")
    .update({ has_variants: true })
    .eq("id", productId);

  return { error: null };
}

export async function deductVariantInventory(
  variantId: string,
  quantity: number
): Promise<boolean> {
  const supabase = await createClient();
  const { data: variant } = await supabase
    .from("product_variants")
    .select("quantity")
    .eq("id", variantId)
    .single();

  if (!variant || variant.quantity < quantity) return false;
  
  const { error } = await supabase
    .from("product_variants")
    .update({ quantity: variant.quantity - quantity })
    .eq("id", variantId);

  return !error;
}
