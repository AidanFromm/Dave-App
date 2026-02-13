import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dropNotificationEmail } from "@/lib/email-templates";

// POST /api/cron/drops-notify
// Called by a cron job to email subscribers when drops go live
export async function POST(request: Request) {
  try {
    // Simple auth via secret header
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Find active drops whose drop_date has passed and have un-notified subscribers
    const { data: drops, error } = await supabase
      .from("drops")
      .select("id, title, description, image_url, product_id, drop_date")
      .eq("is_active", true)
      .lte("drop_date", now);

    if (error) throw error;
    if (!drops || drops.length === 0) {
      return NextResponse.json({ message: "No drops to process", notified: 0 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    let totalNotified = 0;

    for (const drop of drops) {
      // Get un-notified subscribers for this drop
      const { data: subs } = await supabase
        .from("drop_subscribers")
        .select("id, email")
        .eq("drop_id", drop.id)
        .eq("notified", false);

      if (!subs || subs.length === 0) continue;

      const productUrl = drop.product_id
        ? `https://securedtampa.com/product/${drop.product_id}`
        : null;

      const emailData = dropNotificationEmail({
        title: drop.title,
        description: drop.description,
        imageUrl: drop.image_url,
        productUrl,
      });

      // Send in batches of 10
      const emails = subs.map((s: { email: string }) => s.email);
      for (let i = 0; i < emails.length; i += 10) {
        const batch = emails.slice(i, i + 10);
        await Promise.allSettled(
          batch.map((email: string) =>
            resend.emails.send({
              from: "Secured Tampa <orders@securedtampa.com>",
              to: email,
              subject: emailData.subject,
              html: emailData.html,
            })
          )
        );
      }

      // Mark all as notified
      const subIds = subs.map((s: { id: string }) => s.id);
      await supabase
        .from("drop_subscribers")
        .update({ notified: true })
        .in("id", subIds);

      // Update notify count
      await supabase
        .from("drops")
        .update({ notify_count: subs.length })
        .eq("id", drop.id);

      totalNotified += subs.length;
    }

    return NextResponse.json({ message: "Notifications sent", notified: totalNotified });
  } catch (err) {
    console.error("Drops notify cron error:", err);
    return NextResponse.json({ error: "Failed to process drop notifications" }, { status: 500 });
  }
}
