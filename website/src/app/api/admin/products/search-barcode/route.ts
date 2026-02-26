import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Try exact barcode match first
  let { data: product } = await supabase
    .from("products")
    .select("id, name, brand, size, cost, price, quantity, image_urls, is_active, barcode")
    .eq("barcode", q)
    .eq("is_active", true)
    .single();

  // Try style_id match
  if (!product) {
    const { data } = await supabase
      .from("products")
      .select("id, name, brand, size, cost, price, quantity, image_urls, is_active, barcode")
      .eq("style_id", q)
      .eq("is_active", true)
      .limit(1)
      .single();
    product = data;
  }

  // Try UPC in barcode_cache to find linked product
  if (!product) {
    const { data: cache } = await supabase
      .from("barcode_cache")
      .select("product_name, style_id")
      .eq("barcode", q)
      .single();

    if (cache?.style_id) {
      const { data } = await supabase
        .from("products")
        .select("id, name, brand, size, cost, price, quantity, image_urls, is_active, barcode")
        .eq("style_id", cache.style_id)
        .eq("is_active", true)
        .limit(1)
        .single();
      product = data;
    }
  }

  // Try name search as last resort
  if (!product) {
    const { data } = await supabase
      .from("products")
      .select("id, name, brand, size, cost, price, quantity, image_urls, is_active, barcode")
      .eq("is_active", true)
      .ilike("name", `%${q}%`)
      .limit(1)
      .single();
    product = data;
  }

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}
