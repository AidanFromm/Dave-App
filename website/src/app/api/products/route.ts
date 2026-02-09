import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured") === "true";
    const drops = searchParams.get("drops") === "true";
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
      query = query.eq("is_drop", true);
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

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
