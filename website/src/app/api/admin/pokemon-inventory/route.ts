import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("pokemon_card_details")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch pokemon inventory:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error) {
    console.error("Pokemon inventory fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    // First create the product in the products table
    const productName = body.name;
    const images = body.image_url ? [body.image_url] : [];
    const tags = ["pokemon", body.card_type];
    if (body.condition) tags.push(body.condition);
    if (body.grading_company) tags.push("graded", body.grading_company.toLowerCase());
    if (body.card_type === "sealed") tags.push("sealed");
    if (body.set_name) tags.push(body.set_name.toLowerCase().replace(/\s+/g, "-"));

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name: productName,
        brand: "Pokemon TCG",
        price: body.selling_price,
        cost: body.price_paid,
        quantity: body.quantity ?? 1,
        images,
        tags,
        is_active: true,
        condition: "new",
      })
      .select()
      .single();

    if (productError) {
      console.error("Failed to create product:", productError);
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    // Then create the pokemon_card_details record
    const { data: detail, error: detailError } = await supabase
      .from("pokemon_card_details")
      .insert({
        product_id: product.id,
        card_type: body.card_type,
        name: body.name,
        set_name: body.set_name ?? null,
        card_number: body.card_number ?? null,
        rarity: body.rarity ?? null,
        condition: body.condition ?? null,
        grading_company: body.grading_company ?? null,
        grade: body.grade ?? null,
        cert_number: body.cert_number ?? null,
        sealed_type: body.sealed_type ?? null,
        image_url: body.image_url ?? null,
        price_paid: body.price_paid,
        selling_price: body.selling_price,
        quantity: body.quantity ?? 1,
        tcgplayer_price: body.tcgplayer_price ?? null,
        last_price_check: body.tcgplayer_price ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (detailError) {
      console.error("Failed to create pokemon detail:", detailError);
      // Clean up the product
      await supabase.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: "Failed to create pokemon detail" }, { status: 500 });
    }

    return NextResponse.json({ product, detail }, { status: 201 });
  } catch (error) {
    console.error("Pokemon inventory create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
