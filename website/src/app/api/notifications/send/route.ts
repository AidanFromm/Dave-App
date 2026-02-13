import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import {
  orderShippedEmail,
  orderPickupEmail,
  paymentReminderEmail,
  welcomeEmail,
  orderConfirmationEmail,
  type OrderShippedData,
  type OrderPickupData,
  type PaymentReminderData,
  type WelcomeEmailData,
  type OrderConfirmationData,
} from '@/lib/email-templates';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 're_cYnijget_FyAroQA3mF9U9qD4jX4Z75wf');
}
const FROM = 'Secured Tampa <orders@securedtampa.com>';

type NotificationType = 'confirmation' | 'shipped' | 'pickup' | 'reminder' | 'welcome';

interface SendRequest {
  type: NotificationType;
  orderId?: string;
  email?: string; // for welcome emails without an order
  customData?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body: SendRequest = await request.json();
    const { type, orderId, customData } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing notification type' }, { status: 400 });
    }

    // Welcome email doesn't need an order
    if (type === 'welcome') {
      const data: WelcomeEmailData = {
        customerName: (customData?.customerName as string) ?? 'there',
      };
      const email = welcomeEmail(data);
      const toEmail = (body.email ?? customData?.email) as string;
      if (!toEmail) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

      const result = await getResend().emails.send({ from: FROM, to: toEmail, subject: email.subject, html: email.html });
      return NextResponse.json({ success: true, id: result.data?.id });
    }

    // All other types need an order
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const customerName = order.customer_name ?? order.shipping_address?.firstName ?? 'there';
    const customerEmail = order.customer_email;
    if (!customerEmail) {
      return NextResponse.json({ error: 'No customer email on order' }, { status: 400 });
    }

    const items = (order.items ?? []).map((i: any) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size ?? undefined,
    }));

    let emailContent: { subject: string; html: string };

    switch (type) {
      case 'confirmation': {
        const data: OrderConfirmationData = {
          orderNumber: order.order_number,
          items,
          subtotal: order.subtotal ?? 0,
          tax: order.tax ?? 0,
          shippingCost: order.shipping_cost ?? 0,
          total: order.total ?? 0,
          fulfillmentType: order.fulfillment_type ?? 'ship',
          shippingAddress: order.shipping_address ?? undefined,
        };
        emailContent = orderConfirmationEmail(data);
        break;
      }
      case 'shipped': {
        const data: OrderShippedData = {
          orderNumber: order.order_number,
          customerName,
          trackingNumber: (customData?.trackingNumber as string) ?? order.tracking_number ?? '',
          carrier: (customData?.carrier as string) ?? 'other',
          items,
        };
        emailContent = orderShippedEmail(data);
        break;
      }
      case 'pickup': {
        const data: OrderPickupData = {
          orderNumber: order.order_number,
          customerName,
          items,
        };
        emailContent = orderPickupEmail(data);
        break;
      }
      case 'reminder': {
        const data: PaymentReminderData = {
          orderNumber: order.order_number,
          customerName,
          total: order.total ?? 0,
          paymentUrl: customData?.paymentUrl as string | undefined,
        };
        emailContent = paymentReminderEmail(data);
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const result = await getResend().emails.send({
      from: FROM,
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err: any) {
    console.error('Notification send error:', err);
    return NextResponse.json({ error: err.message ?? 'Failed to send notification' }, { status: 500 });
  }
}
