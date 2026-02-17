import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import * as Sentry from "@sentry/nextjs";

const STOCKX_API_KEY = process.env.STOCKX_API_KEY ?? "";
const STOCKX_BASE = "https://api.stockx.com/v2";

async function fetchStockXPrice(styleId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${STOCKX_BASE}/catalog/search?query=${encodeURIComponent(styleId)}`,
      {
        headers: {
          "x-api-key": STOCKX_API_KEY,
          "Accept": "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const product = data?.products?.[0];
    if (!product) return null;
    // Try to get the lowest ask or market price
    return product.market?.lowestAsk ?? product.retailPrice ?? null;
  } catch (err) {
    Sentry.captureException(err);
    return null;
  }
}

export async function POST() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();

    // Get all sneaker products with a sku/style_id
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, sku, sell_price, market_price, category")
      .eq("category", "sneaker");

    if (error) throw error;
    if (!products || products.length === 0) {
      return NextResponse.json({ message: "No sneaker products found", synced: 0 });
    }

    const results: any[] = [];
    const now = new Date().toISOString();

    for (const product of products) {
      const searchTerm = product.sku || product.name;
      if (!searchTerm) continue;

      const marketPrice = await fetchStockXPrice(searchTerm);
      if (marketPrice === null) {
        results.push({
          id: product.id,
          name: product.name,
          status: "no_data",
          old_price: product.market_price,
          new_price: null,
        });
        continue;
      }

      const oldPrice = product.market_price;
      const { error: updateError } = await supabase
        .from("products")
        .update({ market_price: marketPrice, last_price_sync: now })
        .eq("id", product.id);

      if (updateError) {
        Sentry.captureException(updateError);
        results.push({ id: product.id, name: product.name, status: "error", error: updateError.message });
        continue;
      }

      results.push({
        id: product.id,
        name: product.name,
        status: "synced",
        old_price: oldPrice,
        new_price: marketPrice,
        change_pct: oldPrice ? (((marketPrice - oldPrice) / oldPrice) * 100).toFixed(1) : null,
      });
    }

    return NextResponse.json({
      message: "Price sync complete",
      synced: results.filter((r) => r.status === "synced").length,
      total: products.length,
      timestamp: now,
      results,
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Price sync failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, sku, sell_price, market_price, last_price_sync, category")
      .eq("category", "sneaker")
      .not("market_price", "is", null)
      .order("last_price_sync", { ascending: false });

    if (error) throw error;

    const lastSync = products?.[0]?.last_price_sync ?? null;

    return NextResponse.json({
      last_sync: lastSync,
      products: products ?? [],
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to fetch price data" }, { status: 500 });
  }
}
