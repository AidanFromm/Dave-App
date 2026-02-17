import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createShipment, FROM_ADDRESS, DEFAULT_PARCEL } from "@/lib/shippo";
import { requireAdmin } from "@/lib/admin-auth";
import type { Address } from "@/types/order";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();
    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const addr = order.shipping_address as Address | null;
    if (!addr) {
      return NextResponse.json({ error: "Order has no shipping address" }, { status: 400 });
    }

    const shipment = await createShipment(
      FROM_ADDRESS,
      {
        name: `${addr.firstName} ${addr.lastName}`,
        street1: addr.street,
        street2: addr.apartment || "",
        city: addr.city,
        state: addr.state,
        zip: addr.zipCode,
        country: addr.country || "US",
        phone: addr.phone || "",
      },
      DEFAULT_PARCEL
    );

    // Save shipment ID to order
    await supabase
      .from("orders")
      .update({ shippo_shipment_id: shipment.object_id })
      .eq("id", orderId);

    const rates = (shipment.rates || []).map((r: any) => ({
      id: r.object_id,
      provider: r.provider,
      servicelevel: r.servicelevel?.name || r.servicelevel_name,
      amount: r.amount,
      currency: r.currency,
      estimated_days: r.estimated_days || r.days,
      duration_terms: r.duration_terms,
    }));

    return NextResponse.json({ rates, shipmentId: shipment.object_id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
