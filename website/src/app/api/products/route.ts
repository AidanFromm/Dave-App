import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured") === "true";
    const drops = searchParams.get("drops") === "true";
    const grouped = searchParams.get("grouped") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);

    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (featured) {
      query = query.eq("is_featured", true);
    }

    if (drops) {
      const now = new Date().toISOString();
      query = query
        .eq("is_drop", true)
        .lte("drop_starts_at", now)
        .or(`drop_ends_at.is.null,drop_ends_at.gt.${now}`);
    } else {
      // Exclude drop products from regular browsing
      query = query.eq("is_drop", false);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to fetch products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    const products = data ?? [];

    // If grouped=true, deduplicate by name — show one card per shoe name,
    // picking the variant with the lowest price as the display product,
    // and attaching available sizes info
    if (grouped && products.length > 0) {
      const groups = new Map<string, typeof products>();
      for (const p of products) {
        const key = p.name.trim().toLowerCase();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(p);
      }

      const groupedProducts = [];
      for (const [, variants] of groups) {
        // Pick the lowest-priced variant as the display product
        variants.sort((a: { price: number }, b: { price: number }) => a.price - b.price);
        const display = { ...variants[0] };

        // Attach size variants info
        const sizeVariants = variants
          .filter((v: { size: string | null }) => v.size)
          .map((v: { id: string; size: string | null; price: number; condition: string; quantity: number }) => ({
            id: v.id,
            size: v.size,
            price: v.price,
            condition: v.condition,
            quantity: v.quantity,
          }))
          .sort((a: { size: string | null }, b: { size: string | null }) => {
            const numA = parseFloat(a.size ?? "0");
            const numB = parseFloat(b.size ?? "0");
            return numA - numB;
          });

        // Total quantity across all variants
        display.quantity = variants.reduce((sum: number, v: { quantity: number }) => sum + v.quantity, 0);
        // Attach variants metadata
        (display as Record<string, unknown>).sizeVariants = sizeVariants;
        (display as Record<string, unknown>).variantCount = variants.length;

        groupedProducts.push(display);
      }

      const resp = NextResponse.json({ products: groupedProducts });
      resp.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
      return resp;
    }

    const response = NextResponse.json({ products });
    // Cache public product listings for 60 seconds
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
