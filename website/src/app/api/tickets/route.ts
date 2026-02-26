import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendTicketConfirmation, sendTicketNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const category = formData.get("category") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const attachment = formData.get("attachment") as File | null;

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const attachments: string[] = [];

    // Upload attachment if provided
    if (attachment && attachment.size > 0) {
      if (attachment.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
      }
      const ext = attachment.name.split(".").pop();
      const path = `tickets/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const buffer = Buffer.from(await attachment.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, buffer, { contentType: attachment.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("ticket-attachments").getPublicUrl(path);
        attachments.push(urlData.publicUrl);
      }
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({ customer_name: name, customer_email: email, category, subject })
      .select("id")
      .single();

    if (ticketError) throw ticketError;

    // Create initial message
    const { error: msgError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "customer",
        sender_name: name,
        message,
        attachments,
      });

    if (msgError) throw msgError;

    // Send emails (don't await to avoid blocking response)
    sendTicketConfirmation(email, name, subject).catch(console.error);
    sendTicketNotification(name, email, subject, category).catch(console.error);

    return NextResponse.json({ success: true, ticketId: ticket.id });
  } catch (err) {
    console.error("Ticket creation error:", err);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tickets")
    .select("*, ticket_messages(count)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
