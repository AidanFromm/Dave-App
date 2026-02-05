"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { updateOrderStatus } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTimeline } from "@/components/admin/order-timeline";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  SALES_CHANNEL_LABELS,
  FULFILLMENT_LABELS,
  type OrderStatus,
  type SalesChannel,
  type FulfillmentType,
  type OrderItem,
  type Address,
} from "@/types/order";
import { toast } from "sonner";
import { ArrowLeft, Truck, XCircle } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  returned: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      toast.error("Order not found");
      router.push("/admin/orders");
      return;
    }
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleMarkShipped = async () => {
    const tracking = window.prompt("Enter tracking number (optional):");
    if (tracking === null) return; // User cancelled

    setActionLoading(true);
    try {
      await updateOrderStatus(orderId, "shipped", tracking || undefined);
      toast.success("Order marked as shipped");
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await updateOrderStatus(orderId, "cancelled");
      toast.success("Order cancelled");
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-10 w-64" />
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const items = (order.items ?? []) as OrderItem[];
  const shippingAddress = order.shipping_address as Address | null;
  const statusLabel = ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const channelLabel = SALES_CHANNEL_LABELS[(order.sales_channel ?? order.channel) as SalesChannel] ?? (order.sales_channel ?? order.channel ?? "—");
  const fulfillmentLabel = FULFILLMENT_LABELS[order.fulfillment_type as FulfillmentType] ?? order.fulfillment_type ?? "—";

  // Build timeline events from order data
  const timelineEvents: Array<{ status: string; date: string; note?: string }> = [];
  if (order.created_at) {
    timelineEvents.push({ status: "pending", date: order.created_at, note: "Order placed" });
  }
  if (order.status === "paid" || order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
    timelineEvents.push({ status: "paid", date: order.updated_at ?? order.created_at });
  }
  if (order.shipped_at) {
    timelineEvents.push({
      status: "shipped",
      date: order.shipped_at,
      note: order.tracking_number ? `Tracking: ${order.tracking_number}` : undefined,
    });
  }
  if (order.delivered_at) {
    timelineEvents.push({ status: "delivered", date: order.delivered_at });
  }
  if (order.status === "cancelled") {
    timelineEvents.push({ status: "cancelled", date: order.updated_at ?? order.created_at });
  }
  if (order.status === "refunded") {
    timelineEvents.push({ status: "refunded", date: order.updated_at ?? order.created_at });
  }

  const canShip = ["pending", "paid", "processing"].includes(order.status);
  const canCancel = !["cancelled", "refunded", "delivered"].includes(order.status);

  return (
    <div className="p-6">
      {/* Back link */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {order.order_number ?? orderId.slice(0, 8)}
            </h1>
            <Badge
              variant="outline"
              className={`border-0 ${STATUS_COLORS[order.status] ?? ""}`}
            >
              {statusLabel}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {channelLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(order.created_at)} &middot; {fulfillmentLabel}
          </p>
        </div>

        <div className="flex gap-2">
          {canShip && (
            <Button
              onClick={handleMarkShipped}
              disabled={actionLoading}
              size="sm"
            >
              <Truck className="mr-1.5 h-4 w-4" />
              Mark Shipped
            </Button>
          )}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={actionLoading}
              size="sm"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium">Size</th>
                    <th className="pb-2 font-medium text-center">Qty</th>
                    <th className="pb-2 font-medium text-right">Price</th>
                    <th className="pb-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 text-muted-foreground">{item.sku ?? "—"}</td>
                      <td className="py-2 text-muted-foreground">{item.size ?? "—"}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(item.total ?? item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order totals */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.tax ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.shipping_cost ?? 0)}</span>
              </div>
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Customer</h2>
            <div className="space-y-1 text-sm">
              {(order.customer_name || (shippingAddress?.firstName && shippingAddress?.lastName)) && (
                <p className="font-medium">
                  {order.customer_name ?? `${shippingAddress?.firstName} ${shippingAddress?.lastName}`}
                </p>
              )}
              <p className="text-muted-foreground">{order.customer_email ?? "—"}</p>
            </div>
          </div>

          {/* Shipping address */}
          {shippingAddress && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">Shipping Address</h2>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p>{shippingAddress.firstName} {shippingAddress.lastName}</p>
                <p>{shippingAddress.street}</p>
                {shippingAddress.apartment && <p>{shippingAddress.apartment}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                </p>
                {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
              </div>
            </div>
          )}

          {/* Tracking */}
          {order.tracking_number && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">Tracking</h2>
              <p className="text-sm font-mono text-muted-foreground">{order.tracking_number}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-sm font-semibold mb-3">Timeline</h2>
            <OrderTimeline events={timelineEvents} />
          </div>

          {/* Notes */}
          {(order.customer_notes || order.internal_notes) && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">Notes</h2>
              {order.customer_notes && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Customer</p>
                  <p className="text-sm">{order.customer_notes}</p>
                </div>
              )}
              {order.internal_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Internal</p>
                  <p className="text-sm">{order.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
