import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrder } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  FULFILLMENT_LABELS,
} from "@/types/order";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Order {order.order_number}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed on {formatDate(order.created_at)}
      </p>

      <div className="mt-4 flex gap-2">
        <Badge variant="outline">
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
        <Badge variant="secondary">
          {FULFILLMENT_LABELS[order.fulfillment_type]}
        </Badge>
      </div>

      {/* Items & Totals */}
      <div className="mt-6 rounded-xl shadow-card bg-card p-4 sm:p-6">
        <div className="space-y-3">
          <h2 className="font-semibold">Items</h2>
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">
                  {item.sku && `${item.sku} · `}
                  {item.size && `Size ${item.size} · `}
                  Qty {item.quantity}
                </p>
              </div>
              <span className="font-medium">{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {order.shipping_cost === 0
                ? "FREE"
                : formatCurrency(order.shipping_cost)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-secured-success">
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="mt-6 rounded-xl shadow-card bg-card p-4 sm:p-6">
          <h2 className="font-semibold">Shipping Address</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.shipping_address.firstName}{" "}
            {order.shipping_address.lastName}
            <br />
            {order.shipping_address.street}
            {order.shipping_address.apartment &&
              `, ${order.shipping_address.apartment}`}
            <br />
            {order.shipping_address.city}, {order.shipping_address.state}{" "}
            {order.shipping_address.zipCode}
          </p>
        </div>
      )}

      {/* Pickup Code */}
      {order.fulfillment_type === "pickup" && order.pickup_code && (
        <div className="mt-6 rounded-xl shadow-card bg-card p-4 sm:p-6">
          <h2 className="font-semibold">Pickup Verification</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Show this code when picking up your order in-store.
          </p>
          <div className="mt-3 rounded-lg border-2 border-[#FB4F14]/50 bg-[#FB4F14]/5 p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Pickup Code</p>
            <p className="mt-2 text-3xl font-bold tracking-[0.3em] text-[#FB4F14]">{order.pickup_code}</p>
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.tracking_number && (
        <div className="mt-6">
          <h2 className="font-semibold">Tracking</h2>
          <p className="mt-1 text-sm font-mono">{order.tracking_number}</p>
        </div>
      )}
    </div>
  );
}
