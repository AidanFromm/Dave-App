import { NextResponse } from "next/server";
import { Resend } from "resend";
import { orderConfirmationEmail, type OrderConfirmationData } from "@/lib/email-templates";
import { requireAdmin } from "@/lib/admin-auth";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}
const FROM = "Secured Tampa <orders@securedtampa.com>";

interface ConfirmationRequest {
  email: string;
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity: number; size?: string }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  fulfillmentType: "ship" | "pickup";
  shippingAddress?: {
    firstName: string;
    lastName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  // Internal secret for webhook calls
  internalSecret?: string;
}

export async function POST(request: Request) {
  try {
    const body: ConfirmationRequest = await request.json();

    // Allow internal calls (from webhook) with secret, otherwise require admin
    const isInternalCall = body.internalSecret === process.env.INTERNAL_API_SECRET;
    if (!isInternalCall) {
      const auth = await requireAdmin();
      if (auth.error) return auth.error;
    }

    if (!body.email || !body.orderNumber) {
      return NextResponse.json({ error: "Missing email or order number" }, { status: 400 });
    }

    const data: OrderConfirmationData = {
      orderNumber: body.orderNumber,
      items: body.items,
      subtotal: body.subtotal,
      tax: body.tax,
      shippingCost: body.shippingCost,
      total: body.total,
      fulfillmentType: body.fulfillmentType,
      shippingAddress: body.shippingAddress,
    };

    const email = orderConfirmationEmail(data);

    const result = await getResend().emails.send({
      from: FROM,
      to: body.email,
      subject: email.subject,
      html: email.html,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error: unknown) {
    console.error("Failed to send confirmation email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
