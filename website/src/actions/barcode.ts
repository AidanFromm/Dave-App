"use server";

import { createClient } from "@/lib/supabase/server";
import type { BarcodeCatalogEntry } from "@/types/barcode";

export async function lookupBarcode(
  barcode: string
): Promise<BarcodeCatalogEntry | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barcode_catalog")
    .select("*")
    .eq("barcode", barcode)
    .single();

  if (error || !data) return null;
  return data as BarcodeCatalogEntry;
}

export async function saveBarcodeCatalogEntry(entry: {
  barcode: string;
  barcode_type: string;
  stockx_product_id?: string | null;
  stockx_variant_id?: string | null;
  product_name: string;
  brand?: string | null;
  colorway?: string | null;
  style_id?: string | null;
  size?: string | null;
  retail_price?: number | null;
  image_url?: string | null;
  image_urls?: string[];
  product_type?: string;
}): Promise<{ data: BarcodeCatalogEntry | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("barcode_catalog")
    .upsert(
      {
        ...entry,
        product_type: entry.product_type ?? "sneaker",
        image_urls: entry.image_urls ?? [],
        created_by: user?.id ?? null,
        last_scanned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode" }
    )
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as BarcodeCatalogEntry, error: null };
}

export async function updateScanCount(barcode: string): Promise<void> {
  const supabase = await createClient();

  // Use raw SQL via rpc or manual update
  const { data: existing } = await supabase
    .from("barcode_catalog")
    .select("scan_count")
    .eq("barcode", barcode)
    .single();

  if (existing) {
    await supabase
      .from("barcode_catalog")
      .update({
        scan_count: (existing.scan_count ?? 0) + 1,
        last_scanned_at: new Date().toISOString(),
      })
      .eq("barcode", barcode);
  }
}

export async function searchBarcodeCatalog(
  query: string
): Promise<BarcodeCatalogEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("barcode_catalog")
    .select("*")
    .or(
      `product_name.ilike.%${query}%,style_id.ilike.%${query}%,barcode.ilike.%${query}%`
    )
    .order("last_scanned_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as BarcodeCatalogEntry[];
}

export async function getBarcodeCatalogCount(): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("barcode_catalog")
    .select("*", { count: "exact", head: true });

  return count ?? 0;
}
