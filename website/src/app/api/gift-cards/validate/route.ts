import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Gift card code is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: card, error } = await supabase
      .from("gift_cards")
      .select("id, code, remaining_balance, is_active, expires_at")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (error || !card) {
      return NextResponse.json({ error: "Invalid gift card code" }, { status: 404 });
    }

    if (!card.is_active) {
      return NextResponse.json({ error: "This gift card has been deactivated" }, { status: 400 });
    }

    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return NextResponse.json({ error: "This gift card has expired" }, { status: 400 });
    }

    if (card.remaining_balance <= 0) {
      return NextResponse.json({ error: "This gift card has no remaining balance" }, { status: 400 });
    }

    return NextResponse.json({
      id: card.id,
      code: card.code,
      balance: card.remaining_balance,
    });
  } catch {
    return NextResponse.json({ error: "Failed to validate gift card" }, { status: 500 });
  }
}
