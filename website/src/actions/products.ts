"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product, Category, ProductCondition } from "@/types/product";

export async function getProducts(categoryId?: string): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Product;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function searchProducts(query: string): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(50);

  if (error) throw error;
  return (data ?? []) as Product[];
}

export interface SizeVariant {
  id: string;
  size: string | null;
  price: number;
  condition: ProductCondition;
  quantity: number;
}

/**
 * Get all size variants of the same product (same name, different sizes).
 * This allows showing "Available Sizes" on a product detail page.
 */
export async function getProductSizeVariants(product: Product): Promise<SizeVariant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, size, price, condition, quantity")
    .eq("is_active", true)
    .ilike("name", product.name.trim())
    .gt("quantity", 0)
    .order("size");

  if (error) return [];

  // Sort by numeric size
  return ((data ?? []) as SizeVariant[]).sort((a, b) => {
    const numA = parseFloat(a.size ?? "0");
    const numB = parseFloat(b.size ?? "0");
    return numA - numB;
  });
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw error;
  return (data ?? []) as Category[];
}
