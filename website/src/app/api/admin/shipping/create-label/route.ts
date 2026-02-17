import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createShipment, createTransaction, FROM_ADDRESS, DEFAULT_PARCEL } from "@/lib/shippo";
import { requireAdmin } from "@/lib/admin-auth";
import type { Address } from "@/types/order";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();
    const { orderId, rateId } = await req.json();
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

    let selectedRateId = rateId;

    // If no rateId provided, create shipment and pick cheapest rate
    if (!selectedRateId) {
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

      if (!shipment.rates || shipment.rates.length === 0) {
        return NextResponse.json({ error: "No shipping rates available" }, { status: 400 });
      }

      // Pick cheapest
      const cheapest = shipment.rates.sort(
        (a: any, b: any) => parseFloat(a.amount) - parseFloat(b.amount)
      )[0];
      selectedRateId = cheapest.object_id;

      await supabase
        .from("orders")
        .update({ shippo_shipment_id: shipment.object_id })
        .eq("id", orderId);
    }

    // Create transaction (purchase label)
    const transaction = await createTransaction(selectedRateId);

    if (transaction.status !== "SUCCESS") {
      return NextResponse.json(
        { error: transaction.messages?.map((m: any) => m.text).join("; ") || "Label creation failed" },
        { status: 400 }
      );
    }

    // Update order with label info
    await supabase
      .from("orders")
      .update({
        tracking_number: transaction.tracking_number,
        shipping_label_url: transaction.label_url,
        shipping_carrier: transaction.rate?.provider || "",
        shipping_rate: parseFloat(transaction.rate?.amount || "0"),
        shippo_transaction_id: transaction.object_id,
        status: "shipped",
        shipped_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.json({
      trackingNumber: transaction.tracking_number,
      labelUrl: transaction.label_url,
      carrier: transaction.rate?.provider,
      rate: transaction.rate?.amount,
      transactionId: transaction.object_id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
