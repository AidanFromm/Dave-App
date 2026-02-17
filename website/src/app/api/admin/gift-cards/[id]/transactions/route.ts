import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { id } = await params;
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("gift_card_transactions")
      .select("*")
      .eq("gift_card_id", id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ transactions: data ?? [] });
  } catch (err) {
    console.error("Gift card transactions error:", err);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
