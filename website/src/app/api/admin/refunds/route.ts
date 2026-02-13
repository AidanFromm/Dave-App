import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { refundEmail } from "@/lib/email-templates";

const resend = new Resend(
  process.env.RESEND_API_KEY ?? "re_cYnijget_FyAroQA3mF9U9qD4jX4Z75wf"
);
const FROM = "Secured Tampa <orders@securedtampa.com>";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, amount, reason } = body as {
      orderId?: string;
      amount?: number;
      reason?: string;
    };

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid refund amount" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.stripe_payment_id) {
      return NextResponse.json(
        { error: "No Stripe payment associated with this order" },
        { status: 400 }
      );
    }

    if (["refunded", "cancelled"].includes(order.status)) {
      return NextResponse.json(
        { error: "Order is already refunded or cancelled" },
        { status: 400 }
      );
    }

    const maxRefundable =
      order.total - (order.refund_amount ?? 0);
    if (amount > maxRefundable) {
      return NextResponse.json(
        {
          error: `Refund amount exceeds maximum refundable ($${maxRefundable.toFixed(2)})`,
        },
        { status: 400 }
      );
    }

    // Process Stripe refund
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: order.stripe_payment_id,
      amount: Math.round(amount * 100), // cents
      reason: "requested_by_customer",
    });

    // Update order
    const totalRefunded = (order.refund_amount ?? 0) + amount;
    const isFullRefund = totalRefunded >= order.total;
    const newStatus = isFullRefund ? "refunded" : "partially_refunded";

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        refund_amount: totalRefunded,
        refund_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order after refund:", updateError);
      // Refund was already processed on Stripe — log but don't fail
    }

    // Send refund notification email
    if (order.customer_email) {
      try {
        const customerName =
          order.customer_name ??
          order.shipping_address?.firstName ??
          "there";
        const emailContent = refundEmail({
          orderNumber: order.order_number,
          customerName,
          refundAmount: amount,
          originalTotal: order.total,
          isFullRefund,
          reason: reason || undefined,
        });
        await resend.emails.send({
          from: FROM,
          to: order.customer_email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } catch (emailErr) {
        console.error("Failed to send refund email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      refundAmount: amount,
      totalRefunded,
      newStatus,
    });
  } catch (err: any) {
    console.error("Refund error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to process refund" },
      { status: 500 }
    );
  }
}
