"use server";

import { createClient } from "@/lib/supabase/server";

export async function syncAbandonedCart(cartItems: unknown[], cartTotal: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !cartItems.length) return;

  // Upsert: find existing non-recovered cart for this user, update it
  const { data: existing } = await supabase
    .from("abandoned_carts")
    .select("id")
    .eq("user_id", user.id)
    .eq("recovered", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await supabase
      .from("abandoned_carts")
      .update({
        cart_items: cartItems,
        cart_total: cartTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("abandoned_carts").insert({
      user_id: user.id,
      email: user.email,
      cart_items: cartItems,
      cart_total: cartTotal,
    });
  }
}

export async function markCartRecovered(userId: string) {
  const supabase = await createClient();
  await supabase
    .from("abandoned_carts")
    .update({ recovered: true, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("recovered", false);
}

export async function clearAbandonedCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("abandoned_carts")
    .update({ recovered: true, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("recovered", false);
}
