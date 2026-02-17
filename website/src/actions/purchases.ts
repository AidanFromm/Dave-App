"use server";

import { createClient } from "@/lib/supabase/server";

export interface PurchaseItem {
  description: string;
  category: "sneaker" | "pokemon_raw" | "pokemon_graded" | "pokemon_sealed";
  condition: string;
  size?: string | null;
  grade?: string | null;
  cert_number?: string | null;
  grading_company?: string | null;
  offered_price: number;
  market_price?: number | null;
}

export interface CreatePurchaseInput {
  seller_name: string;
  seller_phone?: string;
  seller_email?: string;
  items: PurchaseItem[];
  total_paid: number;
  payment_method: "cash" | "zelle" | "store_credit";
  notes?: string;
  photos?: string[];
}

export async function createPurchase(input: CreatePurchaseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Create the purchase transaction
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchase_transactions")
    .insert({
      seller_name: input.seller_name,
      seller_phone: input.seller_phone || null,
      seller_email: input.seller_email || null,
      items: input.items,
      total_paid: input.total_paid,
      payment_method: input.payment_method,
      notes: input.notes || null,
      photos: input.photos || [],
      created_by: user.id,
    })
    .select()
    .single();

  if (purchaseError) throw new Error(purchaseError.message);

  // 2. Create product entries in inventory for each item
  const productInserts = input.items.map((item) => {
    const categoryMap: Record<string, string> = {
      sneaker: "Sneakers",
      pokemon_raw: "Pokemon TCG",
      pokemon_graded: "Pokemon TCG",
      pokemon_sealed: "Pokemon TCG",
    };

    const tags: string[] = [item.category, "walk-in-purchase"];
    if (item.category === "pokemon_graded" && item.grading_company) {
      tags.push(item.grading_company.toLowerCase());
    }

    return {
      name: item.description,
      brand: categoryMap[item.category] || null,
      size: item.size || null,
      condition: item.condition === "new" ? "new" : item.condition === "like_new" ? "used_like_new" : item.condition === "good" ? "used_good" : item.condition === "fair" ? "used_fair" : "used_good",
      price: item.offered_price,
      cost: item.offered_price,
      compare_at_price: item.market_price || null,
      quantity: 1,
      low_stock_threshold: 1,
      images: input.photos || [],
      is_active: false, // not listed until reviewed
      is_featured: false,
      is_drop: false,
      tags,
      has_box: item.category === "sneaker" ? true : false,
      description: item.category === "pokemon_graded"
        ? `${item.grading_company || "Graded"} ${item.grade || ""} - Cert #${item.cert_number || "N/A"}`
        : null,
    };
  });

  const { error: productsError } = await supabase
    .from("products")
    .insert(productInserts);

  if (productsError) {
    // Failed to create inventory entries - purchase was recorded
    // Don't throw - purchase was recorded successfully
  }

  return purchase;
}

export async function getPurchases(filters?: {
  search?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  payment_method?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("purchase_transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.search) {
    query = query.ilike("seller_name", `%${filters.search}%`);
  }
  if (filters?.startDate) {
    query = query.gte("created_at", filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte("created_at", filters.endDate);
  }
  if (filters?.payment_method) {
    query = query.eq("payment_method", filters.payment_method);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Filter by category client-side (items is JSONB)
  if (filters?.category) {
    return (data ?? []).filter((p: Record<string, unknown>) => {
      const items = p.items as PurchaseItem[];
      return items.some((i) => i.category === filters.category);
    });
  }

  return data ?? [];
}

export async function getPurchaseById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
