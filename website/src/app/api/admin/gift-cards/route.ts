import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SEC-";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET - List all gift cards
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("gift_cards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Also fetch transaction counts
    const { data: txns } = await admin
      .from("gift_card_transactions")
      .select("gift_card_id, id");

    const txnCounts: Record<string, number> = {};
    (txns ?? []).forEach((t: { gift_card_id: string }) => {
      txnCounts[t.gift_card_id] = (txnCounts[t.gift_card_id] || 0) + 1;
    });

    const cards = (data ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      transaction_count: txnCounts[c.id as string] || 0,
    }));

    return NextResponse.json({ giftCards: cards });
  } catch (err) {
    console.error("Admin gift cards fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch gift cards" }, { status: 500 });
  }
}

// POST - Create manual gift card
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { amount, recipientEmail, recipientName, message, expiresAt } = body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const code = generateGiftCardCode();
    const admin = createAdminClient();

    const { data: card, error } = await admin
      .from("gift_cards")
      .insert({
        code,
        initial_amount: numAmount,
        remaining_balance: numAmount,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        message: message || null,
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Log transaction
    await admin.from("gift_card_transactions").insert({
      gift_card_id: card.id,
      amount: numAmount,
      type: "purchase",
      note: "Manual creation by admin",
    });

    // Send email if recipient email provided
    if (recipientEmail) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { giftCardEmail } = await import("@/lib/email-templates");
        const emailData = giftCardEmail({
          code,
          amount: numAmount,
          recipientName: recipientName || "there",
          message: message || null,
        });
        await resend.emails.send({
          from: "Secured Tampa <orders@securedtampa.com>",
          to: recipientEmail,
          subject: emailData.subject,
          html: emailData.html,
        });
      } catch (emailErr) {
        console.error("Failed to send gift card email:", emailErr);
      }
    }

    return NextResponse.json({ giftCard: card });
  } catch (err) {
    console.error("Admin create gift card error:", err);
    return NextResponse.json({ error: "Failed to create gift card" }, { status: 500 });
  }
}

// PATCH - Deactivate/reactivate
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, isActive } = await request.json();
    if (!id) return NextResponse.json({ error: "Gift card ID required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("gift_cards")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin gift card patch error:", err);
    return NextResponse.json({ error: "Failed to update gift card" }, { status: 500 });
  }
}
