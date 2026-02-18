import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { productId, productName } = await request.json();
    if (!productId && !productName) {
      return NextResponse.json({ error: "Missing productId or productName" }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (productName) {
      // Delete all products (and their variants) matching this name
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .ilike("name", productName);

      const ids = (products ?? []).map((p: { id: string }) => p.id);
      if (ids.length > 0) {
        await supabase.from("product_variants").delete().in("product_id", ids);
        await supabase.from("products").delete().in("id", ids);
      }
      return NextResponse.json({ success: true, deletedCount: ids.length });
    }

    // Delete related variants first
    await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId);

    // Delete the product
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      console.error("Failed to delete product:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
