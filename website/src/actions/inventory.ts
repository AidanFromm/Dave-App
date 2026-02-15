"use server";

import { createClient } from "@/lib/supabase/server";
import type { Product, ProductCondition } from "@/types/product";

export interface GroupedProduct {
  name: string;
  image: string | null;
  totalQuantity: number;
  variantCount: number;
  averageCost: number;
  sellPrice: number;
  category: "sneaker" | "pokemon" | "other";
  categoryId: string | null;
  condition: string | null;
  tags: string[] | null;
}

export interface ProductVariant {
  id: string;
  name: string;
  size: string | null;
  quantity: number;
  cost: number | null;
  price: number;
  condition: ProductCondition;
  images: string[];
  sku: string | null;
  brand: string | null;
  created_at: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
  sneakers: { products: number; units: number; value: number };
  pokemon: { products: number; units: number; value: number };
  recentProducts: Array<{ name: string; size: string | null; quantity: number; created_at: string; image: string | null }>;
}

/**
 * Determine category from a product's category_id or tags.
 * We check the categories table; if slug contains "pokemon" => pokemon, else sneaker.
 */
async function resolveCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string | null,
  tags: string[]
): Promise<"sneaker" | "pokemon" | "other"> {
  // Check pokemon keywords first (name not available here, use empty string)
  if (isPokemonProduct("", tags)) return "pokemon";
  const lowerTags = tags.map((t) => t.toLowerCase());
  if (lowerTags.includes("sneaker") || lowerTags.includes("sneakers") || lowerTags.includes("shoe") || lowerTags.includes("shoes")) return "sneaker";

  if (categoryId) {
    const { data } = await supabase
      .from("categories")
      .select("slug, name")
      .eq("id", categoryId)
      .single();
    if (data) {
      const slug = (data.slug ?? data.name ?? "").toLowerCase();
      if (slug.includes("pokemon") || slug.includes("pokémon")) return "pokemon";
      if (slug.includes("sneaker") || slug.includes("shoe")) return "sneaker";
    }
  }

  return "sneaker"; // default
}

// Cache categories for batch operations
let categoryCache: Map<string, "sneaker" | "pokemon" | "other"> | null = null;

async function buildCategoryCache(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (categoryCache) return categoryCache;
  const { data } = await supabase.from("categories").select("id, slug, name");
  const cache = new Map<string, "sneaker" | "pokemon" | "other">();
  (data ?? []).forEach((cat: { id: string; slug: string; name: string }) => {
    const slug = (cat.slug ?? cat.name ?? "").toLowerCase();
    if (slug.includes("pokemon") || slug.includes("pokémon")) {
      cache.set(cat.id, "pokemon");
    } else if (slug.includes("sneaker") || slug.includes("shoe")) {
      cache.set(cat.id, "sneaker");
    } else {
      cache.set(cat.id, "other");
    }
  });
  categoryCache = cache;
  return cache;
}

const POKEMON_KEYWORDS = [
  "pokemon", "pokémon", "pikachu", "charizard", "mewtwo", "booster",
  "etb", "elite trainer", "trainer box", "paldea", "obsidian", "scarlet",
  "violet", "prismatic", "surging sparks", "twilight masquerade",
  "temporal forces", "paldean fates", "paradox rift", "raging surf",
  "lost origin", "astral radiance", "brilliant stars", "evolving skies",
  "fusion strike", "celebrations", "vivid voltage", "darkness ablaze",
  "rebel clash", "sword", "shield", "vmax", "vstar", "ex box",
];

function isPokemonProduct(name: string, tags: string[]): boolean {
  const lowerName = name.toLowerCase();
  const lowerTags = tags.map((t) => t.toLowerCase());
  return POKEMON_KEYWORDS.some(
    (kw) => lowerName.includes(kw) || lowerTags.some((t) => t.includes(kw))
  );
}

function classifyProduct(
  product: Product,
  catCache: Map<string, "sneaker" | "pokemon" | "other">
): "sneaker" | "pokemon" | "other" {
  if (isPokemonProduct(product.name, product.tags ?? [])) return "pokemon";

  const lowerTags = (product.tags ?? []).map((t) => t.toLowerCase());
  if (lowerTags.includes("sneaker") || lowerTags.includes("sneakers")) return "sneaker";
  if (product.category_id && catCache.has(product.category_id)) {
    return catCache.get(product.category_id)!;
  }
  return "sneaker";
}

export async function getGroupedProducts(category?: "sneaker" | "pokemon"): Promise<GroupedProduct[]> {
  const supabase = await createClient();
  const catCache = await buildCategoryCache(supabase);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) throw error;
  const products = (data ?? []) as Product[];

  // Group by normalized name
  const groups = new Map<string, Product[]>();
  products.forEach((p) => {
    const key = p.name.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  const result: GroupedProduct[] = [];
  groups.forEach((variants) => {
    const first = variants[0];
    const cat = classifyProduct(first, catCache);
    if (category && cat !== category) return;

    const totalQty = variants.reduce((sum, v) => sum + v.quantity, 0);
    const costsWithQty = variants
      .filter((v) => v.cost != null && v.cost > 0)
      .map((v) => ({ cost: v.cost!, qty: v.quantity }));
    const totalCostUnits = costsWithQty.reduce((s, c) => s + c.qty, 0);
    const avgCost = totalCostUnits > 0
      ? costsWithQty.reduce((s, c) => s + c.cost * c.qty, 0) / totalCostUnits
      : 0;

    result.push({
      name: first.name.trim(),
      image: first.images?.[0] ?? null,
      totalQuantity: totalQty,
      variantCount: variants.length,
      averageCost: Math.round(avgCost * 100) / 100,
      sellPrice: first.price,
      category: cat,
      categoryId: first.category_id,
      condition: first.condition ?? null,
      tags: Array.isArray(first.tags) ? first.tags : null,
    });
  });

  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export async function getProductVariants(productName: string): Promise<ProductVariant[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, size, quantity, cost, price, condition, images, sku, brand, created_at")
    .ilike("name", productName.trim())
    .order("size");

  if (error) throw error;

  return ((data ?? []) as ProductVariant[]).sort((a, b) => {
    const numA = parseFloat(a.size ?? "0");
    const numB = parseFloat(b.size ?? "0");
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.size ?? "").localeCompare(b.size ?? "");
  });
}

export async function addProductVariant(data: {
  name: string;
  size: string;
  quantity: number;
  cost: number;
  price: number;
  condition: ProductCondition;
  categoryId?: string | null;
}) {
  const supabase = await createClient();

  // Find an existing product with same name to inherit fields
  const { data: existing } = await supabase
    .from("products")
    .select("*")
    .ilike("name", data.name.trim())
    .limit(1)
    .single();

  const insertData = {
    name: data.name.trim(),
    size: data.size,
    quantity: data.quantity,
    cost: data.cost,
    price: data.price,
    condition: data.condition,
    category_id: data.categoryId ?? existing?.category_id ?? null,
    brand: existing?.brand ?? null,
    description: existing?.description ?? null,
    images: existing?.images ?? [],
    tags: existing?.tags ?? [],
    is_active: true,
    low_stock_threshold: existing?.low_stock_threshold ?? 2,
  };

  const { error } = await supabase.from("products").insert(insertData);
  if (error) throw new Error(error.message);
}

export async function updateProductVariant(
  id: string,
  updates: {
    price?: number;
    cost?: number;
    quantity?: number;
    condition?: ProductCondition;
    size?: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Legacy functions (used by product-form and other components) ───

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

// ─── New inventory functions ───

export async function getInventoryStats(): Promise<InventoryStats> {
  const supabase = await createClient();
  const catCache = await buildCategoryCache(supabase);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const products = (data ?? []) as Product[];

  const uniqueNames = new Set<string>();
  const sneakerNames = new Set<string>();
  const pokemonNames = new Set<string>();

  let totalUnits = 0;
  let totalValue = 0;
  const sneakers = { products: 0, units: 0, value: 0 };
  const pokemon = { products: 0, units: 0, value: 0 };

  products.forEach((p) => {
    const key = p.name.trim().toLowerCase();
    const cat = classifyProduct(p, catCache);
    const value = p.quantity * (p.cost ?? p.price);

    uniqueNames.add(key);
    totalUnits += p.quantity;
    totalValue += value;

    if (cat === "sneaker") {
      sneakerNames.add(key);
      sneakers.units += p.quantity;
      sneakers.value += value;
    } else if (cat === "pokemon") {
      pokemonNames.add(key);
      pokemon.units += p.quantity;
      pokemon.value += value;
    }
  });

  sneakers.products = sneakerNames.size;
  pokemon.products = pokemonNames.size;

  const recentProducts = products.slice(0, 10).map((p) => ({
    name: p.name,
    size: p.size,
    quantity: p.quantity,
    created_at: p.created_at,
    image: p.images?.[0] ?? null,
  }));

  return {
    totalProducts: uniqueNames.size,
    totalUnits,
    totalValue: Math.round(totalValue * 100) / 100,
    sneakers,
    pokemon,
    recentProducts,
  };
}
