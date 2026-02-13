import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`gc-balance:${ip}`, { limit: 10, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Gift card code is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: card, error } = await supabase
      .from("gift_cards")
      .select("id, code, initial_amount, remaining_balance, is_active, expires_at, created_at")
      .eq("code", code.trim().toUpperCase())
      .single();

    if (error || !card) {
      return NextResponse.json({ error: "Gift card not found" }, { status: 404 });
    }

    return NextResponse.json({
      code: card.code,
      initialAmount: card.initial_amount,
      remainingBalance: card.remaining_balance,
      isActive: card.is_active,
      expiresAt: card.expires_at,
      createdAt: card.created_at,
    });
  } catch {
    return NextResponse.json({ error: "Failed to check balance" }, { status: 500 });
  }
}
