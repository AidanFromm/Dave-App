"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/product";

export async function getPokemonProducts(): Promise<Product[]> {
  const supabase = await createClient();

  // Get pokemon products by tag or brand
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .or("brand.eq.Pokemon TCG,tags.cs.{pokemon}")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Product[];
}
