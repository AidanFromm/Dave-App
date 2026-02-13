"use server";

import { createClient } from "@/lib/supabase/server";

export async function subscribeStockAlert(productId: string, variantId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "You must be logged in to subscribe." };

  // Check if already subscribed
  let query = supabase
    .from("stock_alerts")
    .select("id")
    .eq("email", user.email)
    .eq("product_id", productId)
    .is("notified_at", null);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data: existing } = await query.limit(1).single();
  if (existing) return { error: "Already subscribed." };

  const { error } = await supabase.from("stock_alerts").insert({
    user_id: user.id,
    email: user.email,
    product_id: productId,
    variant_id: variantId || null,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function unsubscribeStockAlert(productId: string, variantId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in." };

  let query = supabase
    .from("stock_alerts")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .is("notified_at", null);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  await query;
  return { success: true };
}

export async function checkStockAlert(productId: string, variantId?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { subscribed: false };

  let query = supabase
    .from("stock_alerts")
    .select("id")
    .eq("email", user.email)
    .eq("product_id", productId)
    .is("notified_at", null);

  if (variantId) {
    query = query.eq("variant_id", variantId);
  } else {
    query = query.is("variant_id", null);
  }

  const { data } = await query.limit(1).single();
  return { subscribed: !!data };
}
