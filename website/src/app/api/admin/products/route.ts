import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (category === "pokemon") {
      query = query.or("brand.eq.Pokemon TCG,tags.cs.{pokemon}");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    console.error("Admin products fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
