import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List all drops
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("drops")
      .select("*, products(id, name, price, images)")
      .order("drop_date", { ascending: false });

    if (error) throw error;

    // Get subscriber counts per drop
    const { data: subs } = await admin
      .from("drop_subscribers")
      .select("drop_id");

    const subCounts: Record<string, number> = {};
    (subs ?? []).forEach((s: { drop_id: string | null }) => {
      if (s.drop_id) subCounts[s.drop_id] = (subCounts[s.drop_id] || 0) + 1;
    });

    const drops = (data ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      subscriber_count: subCounts[d.id as string] || 0,
    }));

    return NextResponse.json({ drops });
  } catch (err) {
    console.error("Admin drops fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch drops" }, { status: 500 });
  }
}

// POST - Create drop
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, dropDate, productId, imageUrl } = body;

    if (!title || !dropDate) {
      return NextResponse.json({ error: "Title and drop date are required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: drop, error } = await admin
      .from("drops")
      .insert({
        title,
        description: description || null,
        drop_date: dropDate,
        product_id: productId || null,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ drop });
  } catch (err) {
    console.error("Admin create drop error:", err);
    return NextResponse.json({ error: "Failed to create drop" }, { status: 500 });
  }
}

// PATCH - Update drop
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Drop ID required" }, { status: 400 });

    const admin = createAdminClient();

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.dropDate !== undefined) dbUpdates.drop_date = updates.dropDate;
    if (updates.productId !== undefined) dbUpdates.product_id = updates.productId;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await admin
      .from("drops")
      .update(dbUpdates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin update drop error:", err);
    return NextResponse.json({ error: "Failed to update drop" }, { status: 500 });
  }
}

// DELETE - Remove drop
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Drop ID required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("drops").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin delete drop error:", err);
    return NextResponse.json({ error: "Failed to delete drop" }, { status: 500 });
  }
}
