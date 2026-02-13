import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAX_RATE } from "@/lib/constants";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: orderId } = await params;
    const body = await request.json();
    const { items, shippingCost, discount, note } = body;

    const admin = createAdminClient();

    // Fetch current order
    const { data: order, error: fetchErr } = await admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow editing pending/processing orders
    if (!["pending", "paid", "processing"].includes(order.status)) {
      return NextResponse.json(
        { error: "Only pending, paid, or processing orders can be edited" },
        { status: 400 }
      );
    }

    // Build changes log
    const changes: string[] = [];
    const oldItems = order.items as Array<{ name: string; quantity: number; price: number; size?: string }>;

    // Calculate new totals
    const newItems = items ?? oldItems;
    const subtotal = newItems.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    const newShipping = shippingCost !== undefined ? Number(shippingCost) : (order.shipping_cost ?? 0);
    const newDiscount = discount !== undefined ? Number(discount) : (order.discount ?? 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = subtotal + tax + newShipping - newDiscount;

    // Detect changes
    if (items) {
      const oldMap = new Map(oldItems.map((i: { name: string; quantity: number }) => [i.name, i.quantity]));
      const newMap = new Map(newItems.map((i: { name: string; quantity: number }) => [i.name, i.quantity]));

      for (const [name, qty] of newMap) {
        const oldQty = oldMap.get(name as string);
        if (oldQty === undefined) {
          changes.push(`Added ${name} (x${qty})`);
        } else if (oldQty !== qty) {
          changes.push(`Changed ${name} quantity: ${oldQty} -> ${qty}`);
        }
      }
      for (const [name] of oldMap) {
        if (!newMap.has(name)) {
          changes.push(`Removed ${name}`);
        }
      }
    }
    if (shippingCost !== undefined && Number(shippingCost) !== (order.shipping_cost ?? 0)) {
      changes.push(`Shipping adjusted to $${Number(shippingCost).toFixed(2)}`);
    }
    if (discount !== undefined && Number(discount) !== (order.discount ?? 0)) {
      changes.push(`Discount adjusted to $${Number(discount).toFixed(2)}`);
    }
    if (Math.abs(total - order.total) > 0.01) {
      changes.push(`Total changed from $${order.total.toFixed(2)} to $${total.toFixed(2)}`);
    }

    // Update order
    const updateData: Record<string, unknown> = {
      items: newItems,
      subtotal,
      tax,
      shipping_cost: newShipping,
      discount: newDiscount,
      total,
      updated_at: new Date().toISOString(),
    };

    // Append to internal notes
    const editLog = `[${new Date().toLocaleString()}] Order edited by admin: ${changes.join("; ")}${note ? ` | Note: ${note}` : ""}`;
    const existingNotes = order.internal_notes || "";
    updateData.internal_notes = existingNotes
      ? `${existingNotes}\n${editLog}`
      : editLog;

    const { error: updateErr } = await admin
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    // Send "Order Updated" email
    if (order.customer_email && changes.length > 0) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { orderUpdatedEmail } = await import("@/lib/email-templates");

        const customerName = order.customer_name ||
          (order.shipping_address as { firstName?: string })?.firstName || "Customer";

        const emailData = orderUpdatedEmail({
          orderNumber: order.order_number,
          customerName,
          changes,
          newTotal: total,
          items: newItems,
        });

        await resend.emails.send({
          from: "Secured Tampa <orders@securedtampa.com>",
          to: order.customer_email,
          subject: emailData.subject,
          html: emailData.html,
        });
      } catch (emailErr) {
        console.error("Failed to send order updated email:", emailErr);
      }
    }

    return NextResponse.json({ success: true, changes, total });
  } catch (err) {
    console.error("Order edit error:", err);
    return NextResponse.json({ error: "Failed to edit order" }, { status: 500 });
  }
}
