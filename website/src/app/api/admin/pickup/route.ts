import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSMS } from "@/lib/twilio";

export async function POST(request: Request) {
  try {
    const { orderId, pickupStatus } = (await request.json()) as {
      orderId?: string;
      pickupStatus?: string;
    };

    if (!orderId || !pickupStatus) {
      return NextResponse.json({ error: "Missing orderId or pickupStatus" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update pickup_status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        pickup_status: pickupStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send SMS when marking as "ready"
    if (pickupStatus === "ready") {
      const phone =
        order.shipping_address?.phone ??
        order.customer_phone ??
        null;

      if (phone) {
        const msg = `Hey! Your order #${order.order_number} from Secured Tampa is ready for pickup! 🏪 Bring a valid photo ID. See you soon!`;
        const result = await sendSMS(phone, msg);
        if (!result.success) {
          console.error("SMS failed for pickup notification:", result.error);
        }
      }
    }

    return NextResponse.json({ success: true, pickupStatus });
  } catch (err: any) {
    console.error("Pickup status error:", err);
    return NextResponse.json({ error: err.message ?? "Failed" }, { status: 500 });
  }
}
