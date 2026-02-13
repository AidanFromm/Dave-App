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
import { ShippingSection } from "@/components/admin/shipping-section";
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
import { ArrowLeft, Truck, XCircle, MapPin, Bell, Mail, DollarSign, Package, CheckCircle, Link2, Loader2, Copy, Printer } from "lucide-react";

const PICKUP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ready: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  picked_up: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

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
  partially_refunded: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);

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

  const sendNotification = async (type: string, customData?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderId, customData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to send notification");
      }
      toast.success("Notification email sent!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send notification");
    }
  };

  const handleMarkShipped = async () => {
    const tracking = window.prompt("Enter tracking number:");
    if (tracking === null) return;
    if (!tracking.trim()) {
      toast.error("Tracking number is required");
      return;
    }
    const carrier = window.prompt("Enter carrier (usps, ups, fedex):", "usps");
    if (carrier === null) return;

    setActionLoading(true);
    try {
      await updateOrderStatus(orderId, "shipped", tracking.trim());
      await sendNotification("shipped", { trackingNumber: tracking.trim(), carrier: carrier.trim() || "other" });
      toast.success("Order marked as shipped & customer notified");
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReadyForPickup = async () => {
    const confirmed = window.confirm("Mark this order as ready for pickup and notify the customer?");
    if (!confirmed) return;
    await handlePickupStatus("ready");
  };

  const handleSendReminder = async () => {
    const confirmed = window.confirm("Send a payment reminder email to this customer?");
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await sendNotification("reminder");
      toast.success("Payment reminder sent");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reminder");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setActionLoading(true);
    try {
      await sendNotification("confirmation");
      toast.success("Confirmation email resent");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to resend confirmation");
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

  const handleRefund = async () => {
    const amt = parseFloat(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid refund amount");
      return;
    }
    setRefundLoading(true);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: amt, reason: refundReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      toast.success(`Refund of $${amt.toFixed(2)} processed`);
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.message ?? "Refund failed");
    } finally {
      setRefundLoading(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    setPaymentLinkLoading(true);
    try {
      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate payment link");
      await navigator.clipboard.writeText(data.url);
      toast.success("Payment link copied to clipboard");
      await fetchOrder();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate payment link";
      toast.error(message);
    } finally {
      setPaymentLinkLoading(false);
    }
  };

  const handlePickupStatus = async (status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, pickupStatus: status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      // Also send pickup email when marking ready
      if (status === "ready") {
        await sendNotification("pickup");
      }
      toast.success(
        status === "ready"
          ? "Marked ready — customer notified via email & SMS"
          : status === "picked_up"
            ? "Order marked as picked up"
            : "Pickup status updated"
      );
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update pickup status");
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

  const canShip = ["pending", "paid", "processing"].includes(order.status) && order.fulfillment_type === "ship";
  const canPickup = ["pending", "paid", "processing"].includes(order.status) && order.fulfillment_type === "pickup";
  const canRemind = order.status === "pending";
  const canCancel = !["cancelled", "refunded", "delivered"].includes(order.status);
  const canRefund = order.stripe_payment_id && !["refunded", "cancelled", "pending"].includes(order.status);
  const maxRefundable = order.total - (order.refund_amount ?? 0);

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

        <div className="flex flex-wrap gap-2">
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
          {canPickup && (
            <Button
              onClick={handleReadyForPickup}
              disabled={actionLoading}
              size="sm"
              className="bg-[#FB4F14] hover:bg-[#e04400]"
            >
              <MapPin className="mr-1.5 h-4 w-4" />
              Ready for Pickup
            </Button>
          )}
          <Button
            onClick={handleGeneratePaymentLink}
            disabled={paymentLinkLoading}
            size="sm"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            {paymentLinkLoading ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-1.5 h-4 w-4" />
            )}
            Payment Link
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/admin/orders/${orderId}/packing-slip`, "_blank")}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Packing Slip
          </Button>
          {canRemind && (
            <Button
              onClick={handleSendReminder}
              disabled={actionLoading}
              size="sm"
              variant="outline"
            >
              <Bell className="mr-1.5 h-4 w-4" />
              Payment Reminder
            </Button>
          )}
          <Button
            onClick={handleResendConfirmation}
            disabled={actionLoading}
            size="sm"
            variant="outline"
          >
            <Mail className="mr-1.5 h-4 w-4" />
            Resend Confirmation
          </Button>
          {canRefund && (
            <Button
              onClick={() => {
                setRefundAmount(maxRefundable.toFixed(2));
                setShowRefundModal(true);
              }}
              disabled={actionLoading}
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              <DollarSign className="mr-1.5 h-4 w-4" />
              Issue Refund
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

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              Issue Refund
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Order #{order.order_number} &middot; Max refundable: ${maxRefundable.toFixed(2)}
            </p>
            {order.refund_amount > 0 && (
              <p className="mt-1 text-xs text-amber-500">
                Previously refunded: ${order.refund_amount.toFixed(2)}
              </p>
            )}
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Refund Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxRefundable}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0.00"
                />
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundAmount(maxRefundable.toFixed(2))}
                    className="text-xs text-primary hover:underline"
                  >
                    Full refund
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Reason (optional)</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Customer request, defective item, etc."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRefundModal(false)}
                  disabled={refundLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleRefund}
                  disabled={refundLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {refundLoading ? "Processing..." : `Refund $${parseFloat(refundAmount || "0").toFixed(2)}`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* Shipping / Label Management */}
          {order.fulfillment_type === "ship" && (
            <ShippingSection
              orderId={orderId}
              trackingNumber={order.tracking_number}
              labelUrl={order.shipping_label_url}
              carrier={order.shipping_carrier}
              shippingRate={order.shipping_rate}
              trackingStatus={order.shipping_tracking_status}
              trackingHistory={order.shipping_tracking_history || []}
              onLabelCreated={fetchOrder}
            />
          )}

          {/* Pickup Status */}
          {order.fulfillment_type === "pickup" && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3">Pickup Status</h2>
              <Badge
                variant="outline"
                className={`border-0 ${PICKUP_STATUS_COLORS[order.pickup_status ?? "pending"] ?? ""}`}
              >
                {order.pickup_status === "ready"
                  ? "Ready for Pickup"
                  : order.pickup_status === "picked_up"
                    ? "Picked Up"
                    : "Pending"}
              </Badge>
              <div className="mt-3 flex flex-col gap-2">
                {(!order.pickup_status || order.pickup_status === "pending") && (
                  <Button
                    size="sm"
                    className="bg-[#FB4F14] hover:bg-[#e04400]"
                    onClick={() => handlePickupStatus("ready")}
                    disabled={actionLoading}
                  >
                    <MapPin className="mr-1.5 h-4 w-4" />
                    Mark Ready for Pickup
                  </Button>
                )}
                {order.pickup_status === "ready" && (
                  <Button
                    size="sm"
                    onClick={() => handlePickupStatus("picked_up")}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="mr-1.5 h-4 w-4" />
                    Mark as Picked Up
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Refund Info */}
          {(order.refund_amount ?? 0) > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50/5 p-4">
              <h2 className="text-sm font-semibold mb-3 text-amber-500">Refund Details</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refunded</span>
                  <span className="font-medium text-amber-500">{formatCurrency(order.refund_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                {order.refund_reason && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Reason</p>
                    <p className="text-sm">{order.refund_reason}</p>
                  </div>
                )}
              </div>
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
