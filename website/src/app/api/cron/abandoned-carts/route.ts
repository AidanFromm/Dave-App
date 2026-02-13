import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import {
  abandonedCartEmail1,
  abandonedCartEmail2,
  abandonedCartEmail3,
} from "@/lib/email-templates-recovery";

const resend = new Resend(process.env.RESEND_API_KEY);

interface CartItemJson {
  name?: string;
  price?: number;
  quantity?: number;
  image?: string | null;
  size?: string | null;
  product?: { name?: string; price?: number; images?: string[] };
  variant_size?: string | null;
  variant_price?: number | null;
}

function normalizeCartItems(raw: CartItemJson[]) {
  return raw.map((item) => ({
    name: item.name || item.product?.name || "Item",
    price: item.variant_price ?? item.price ?? item.product?.price ?? 0,
    quantity: item.quantity ?? 1,
    image: item.image || item.product?.images?.[0] || null,
    size: item.variant_size ?? item.size ?? null,
  }));
}

function generateDiscountCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SECURED10-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

  let sent = 0;
  let errors = 0;

  try {
    // Fetch all non-recovered abandoned carts
    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("recovered", false)
      .lt("created_at", oneHourAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!carts?.length) {
      return NextResponse.json({ message: "No abandoned carts to process", sent: 0 });
    }

    for (const cart of carts) {
      const items = normalizeCartItems(cart.cart_items as CartItemJson[]);
      const total = cart.cart_total || items.reduce((s, i) => s + i.price * i.quantity, 0);
      const cartAge = now.getTime() - new Date(cart.created_at).getTime();
      const hoursOld = cartAge / (60 * 60 * 1000);

      try {
        // Email 1: After 1 hour
        if (!cart.email_1_sent && hoursOld >= 1) {
          const { subject, html } = abandonedCartEmail1(items, total);
          await resend.emails.send({
            from: "Secured Tampa <orders@securedtampa.com>",
            to: cart.email,
            subject,
            html,
          });
          await supabase
            .from("abandoned_carts")
            .update({
              email_1_sent: true,
              email_1_sent_at: now.toISOString(),
              recovery_email_sent_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", cart.id);
          sent++;
        }

        // Email 2: After 24 hours
        if (cart.email_1_sent && !cart.email_2_sent && hoursOld >= 24) {
          const { subject, html } = abandonedCartEmail2(items, total);
          await resend.emails.send({
            from: "Secured Tampa <orders@securedtampa.com>",
            to: cart.email,
            subject,
            html,
          });
          await supabase
            .from("abandoned_carts")
            .update({
              email_2_sent: true,
              email_2_sent_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", cart.id);
          sent++;
        }

        // Email 3: After 72 hours with discount
        if (cart.email_2_sent && !cart.email_3_sent && hoursOld >= 72) {
          const discountCode = cart.discount_code || generateDiscountCode();
          const { subject, html } = abandonedCartEmail3(items, total, discountCode);
          await resend.emails.send({
            from: "Secured Tampa <orders@securedtampa.com>",
            to: cart.email,
            subject,
            html,
          });
          await supabase
            .from("abandoned_carts")
            .update({
              email_3_sent: true,
              email_3_sent_at: now.toISOString(),
              discount_code: discountCode,
              updated_at: now.toISOString(),
            })
            .eq("id", cart.id);
          sent++;
        }
      } catch (emailErr) {
        console.error(`Failed to send email for cart ${cart.id}:`, emailErr);
        errors++;
      }
    }

    return NextResponse.json({
      message: "Abandoned cart emails processed",
      processed: carts.length,
      sent,
      errors,
    });
  } catch (err) {
    console.error("Abandoned cart cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
