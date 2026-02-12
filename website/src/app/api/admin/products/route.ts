import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
