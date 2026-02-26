import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendTicketReply } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Get ticket info
  const { data: ticket } = await supabase
    .from("tickets")
    .select("customer_email, customer_name, subject, status")
    .eq("id", id)
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  // Create admin message
  const { error } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id: id,
      sender_type: "admin",
      sender_name: "Secured Tampa Support",
      message: message.trim(),
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-update status to in_progress if still open
  if (ticket.status === "open") {
    await supabase.from("tickets").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", id);
  }

  // Send email
  sendTicketReply(ticket.customer_email, ticket.customer_name || "Customer", ticket.subject, message.trim()).catch(console.error);

  return NextResponse.json({ success: true });
}
