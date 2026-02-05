"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/product";

export async function updateProductQuantity(
  productId: string,
  newQuantity: number,
  reason?: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deductInventory(
  productId: string,
  quantity: number
): Promise<boolean> {
  const supabase = await createClient();

  // Fetch current product
  const { data: product } = await supabase
    .from("products")
    .select("quantity")
    .eq("id", productId)
    .single();

  if (!product || product.quantity < quantity) return false;

  const { error } = await supabase
    .from("products")
    .update({ quantity: product.quantity - quantity })
    .eq("id", productId);

  return !error;
}

export async function createProduct(product: Partial<Product>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}
