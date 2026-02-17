import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ discounts: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { code, type, value, min_order, max_uses, expires_at } = body;

  if (!code || !type || !value) {
    return NextResponse.json({ error: "Code, type, and value are required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("discounts").insert({
    code: code.toUpperCase().trim(),
    type,
    value,
    min_order: min_order || 0,
    max_uses: max_uses || null,
    expires_at: expires_at || null,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A discount with this code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, active } = await request.json();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("discounts")
    .update({ active })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await request.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from("discounts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
