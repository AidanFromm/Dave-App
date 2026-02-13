import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Shippo tracking webhook
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Shippo sends tracking updates with this structure
    const trackingNumber = payload.tracking_number;
    const trackingStatus = payload.tracking_status;
    const trackingHistory = payload.tracking_history || [];

    if (!trackingNumber) {
      return NextResponse.json({ error: "No tracking number" }, { status: 400 });
    }

    // Find order by tracking number
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("tracking_number", trackingNumber)
      .single();

    if (!order) {
      // Not our order, ignore
      return NextResponse.json({ ok: true });
    }

    const updates: Record<string, any> = {
      shipping_tracking_status: trackingStatus?.status || null,
      shipping_tracking_history: trackingHistory,
    };

    // Auto-update order status based on tracking
    if (trackingStatus?.status === "DELIVERED") {
      updates.status = "delivered";
      updates.delivered_at = trackingStatus.status_date || new Date().toISOString();
    } else if (trackingStatus?.status === "TRANSIT" && order.status !== "shipped") {
      updates.status = "shipped";
    }

    await supabase.from("orders").update(updates).eq("id", order.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Shippo webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
