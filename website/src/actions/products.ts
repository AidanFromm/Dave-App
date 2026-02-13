"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product, Category, ProductCondition } from "@/types/product";

export async function getProducts(categoryId?: string): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_drop", false);

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
    .eq("is_drop", false)
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
    .eq("is_drop", false)
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

export async function getCategoryForProduct(categoryId: string | null): Promise<Category | null> {
  if (!categoryId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();
  if (error) return null;
  return data as Category;
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null,
  limit = 4
): Promise<Product[]> {
  const supabase = await createClient();

  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .neq("id", productId)
      .gt("quantity", 0)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data && data.length > 0) return data as Product[];
  }

  // Fallback: recent products
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", productId)
    .gt("quantity", 0)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Product[];
}

export async function getActiveDrops(): Promise<Product[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_drop", true)
    .lte("drop_starts_at", now)
    .or(`drop_ends_at.is.null,drop_ends_at.gt.${now}`)
    .order("drop_starts_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getUpcomingDrops(): Promise<Product[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_drop", true)
    .gt("drop_starts_at", now)
    .order("drop_starts_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getAllDropProducts(): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq("is_drop", true)
    .order("drop_starts_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Product[];
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
