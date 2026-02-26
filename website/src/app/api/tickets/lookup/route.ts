import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, subject, category, status, created_at")
    .eq("customer_email", email.toLowerCase().trim())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch messages for each ticket
  const results = await Promise.all(
    (tickets || []).map(async (ticket) => {
      const { data: messages } = await supabase
        .from("ticket_messages")
        .select("id, sender_type, sender_name, message, attachments, created_at")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      return { ...ticket, messages: messages || [] };
    })
  );

  return NextResponse.json(results);
}
