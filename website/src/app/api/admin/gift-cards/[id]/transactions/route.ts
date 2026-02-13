import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
