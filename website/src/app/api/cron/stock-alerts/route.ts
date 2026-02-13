import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { backInStockEmail } from "@/lib/email-templates-recovery";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = createAdminClient();
  let sent = 0;
  let errors = 0;

  try {
    // Get all pending stock alerts (not yet notified)
    const { data: alerts, error } = await supabase
      .from("stock_alerts")
      .select("*")
      .is("notified_at", null);

    if (error) throw error;
    if (!alerts?.length) {
      return NextResponse.json({ message: "No pending stock alerts", sent: 0 });
    }

    // Group by product_id to batch lookups
    const productIds = [...new Set(alerts.map((a) => a.product_id))];

    const { data: products } = await supabase
      .from("products")
      .select("id, name, images, quantity")
      .in("id", productIds);

    const productMap = new Map(
      (products || []).map((p) => [p.id, p])
    );

    // Check variant stock if variant_id exists
    const variantIds = alerts
      .map((a) => a.variant_id)
      .filter((v): v is string => !!v);

    let variantMap = new Map<string, { quantity: number }>();
    if (variantIds.length) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, quantity")
        .in("id", variantIds);

      variantMap = new Map(
        (variants || []).map((v) => [v.id, v])
      );
    }

    const now = new Date().toISOString();

    for (const alert of alerts) {
      const product = productMap.get(alert.product_id);
      if (!product) continue;

      // Check if item is back in stock
      let inStock = false;
      if (alert.variant_id) {
        const variant = variantMap.get(alert.variant_id);
        inStock = (variant?.quantity ?? 0) > 0;
      } else {
        inStock = product.quantity > 0;
      }

      if (!inStock) continue;

      try {
        const productUrl = `https://securedtampa.com/product/${alert.variant_id || alert.product_id}`;
        const productImage = product.images?.[0] || null;
        const { subject, html } = backInStockEmail(product.name, productImage, productUrl);

        await resend.emails.send({
          from: "Secured Tampa <orders@securedtampa.com>",
          to: alert.email,
          subject,
          html,
        });

        await supabase
          .from("stock_alerts")
          .update({ notified_at: now })
          .eq("id", alert.id);

        sent++;
      } catch (emailErr) {
        console.error(`Failed to send stock alert ${alert.id}:`, emailErr);
        errors++;
      }
    }

    return NextResponse.json({
      message: "Stock alerts processed",
      checked: alerts.length,
      sent,
      errors,
    });
  } catch (err) {
    console.error("Stock alerts cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
