"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { toast } from "sonner";
import {
  Truck,
  Package,
  Printer,
  Loader2,
  CheckCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import type { Address } from "@/types/order";

interface ShippingOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string;
  shipping_address: Address | null;
  total: number;
  status: string;
  tracking_number: string | null;
  shipping_label_url: string | null;
  shipping_carrier: string | null;
  created_at: string;
}

export default function AdminShippingPage() {
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [tab, setTab] = useState<"needs_label" | "shipped">("needs_label");

  const fetchOrders = async () => {
    const supabase = createClient();

    if (tab === "needs_label") {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("fulfillment_type", "ship")
        .in("status", ["pending", "paid", "processing"])
        .is("tracking_number", null)
        .order("created_at", { ascending: false });
      setOrders((data as ShippingOrder[]) || []);
    } else {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("fulfillment_type", "ship")
        .not("tracking_number", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      setOrders((data as ShippingOrder[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setSelectedIds(new Set());
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  };

  const bulkCreateLabels = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    let success = 0;
    let failed = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch("/api/admin/shipping/create-label", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }

    toast.success(`Labels created: ${success} success, ${failed} failed`);
    setBulkLoading(false);
    setSelectedIds(new Set());
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-[#FB4F14]" />
            Shipping
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage shipping labels and tracking
          </p>
        </div>

        {tab === "needs_label" && selectedIds.size > 0 && (
          <Button
            className="bg-[#FB4F14] hover:bg-[#e04400]"
            onClick={bulkCreateLabels}
            disabled={bulkLoading}
          >
            {bulkLoading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Creating {selectedIds.size} Labels...
              </>
            ) : (
              <>
                <Printer className="mr-1.5 h-4 w-4" />
                Create {selectedIds.size} Label{selectedIds.size > 1 ? "s" : ""}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        <button
          onClick={() => setTab("needs_label")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "needs_label"
              ? "bg-[#FB4F14] text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="inline-block mr-1.5 h-4 w-4" />
          Needs Label
        </button>
        <button
          onClick={() => setTab("shipped")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "shipped"
              ? "bg-[#FB4F14] text-white"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle className="inline-block mr-1.5 h-4 w-4" />
          Shipped
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Truck className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {tab === "needs_label"
              ? "No orders need shipping labels"
              : "No shipped orders yet"}
          </p>
        </div>
      ) : (
        <>
        {/* Desktop Table */}
        <div className="hidden md:block rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {tab === "needs_label" && (
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === orders.length && orders.length > 0}
                      onChange={toggleAll}
                      className="rounded accent-[#FB4F14]"
                    />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Destination</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                {tab === "shipped" && (
                  <>
                    <th className="px-4 py-3 text-left font-medium">Carrier</th>
                    <th className="px-4 py-3 text-left font-medium">Tracking</th>
                  </>
                )}
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const addr = order.shipping_address;
                return (
                  <tr
                    key={order.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {tab === "needs_label" && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order.id)}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded accent-[#FB4F14]"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:text-[#FB4F14] transition-colors"
                      >
                        {order.order_number || order.id.slice(0, 8)}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(order.created_at)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{order.customer_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {addr
                        ? `${addr.city}, ${addr.state} ${addr.zipCode}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    {tab === "shipped" && (
                      <>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {order.shipping_carrier || "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs">
                            {order.tracking_number?.slice(0, 16)}
                            {(order.tracking_number?.length || 0) > 16 ? "..." : ""}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.shipping_label_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(order.shipping_label_url!, "_blank")}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="ghost">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2">
          {orders.map((order) => {
            const addr = order.shipping_address;
            return (
              <div key={order.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  {tab === "needs_label" && (
                    <label className="flex items-center min-h-[44px] min-w-[44px] justify-center -ml-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded accent-[#FB4F14]"
                      />
                    </label>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-sm hover:text-[#FB4F14] transition-colors">
                        {order.order_number || order.id.slice(0, 8)}
                      </Link>
                      <span className="text-sm font-medium">{formatCurrency(order.total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{order.customer_name || order.customer_email}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {addr ? `${addr.city}, ${addr.state} ${addr.zipCode}` : "--"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatDateShort(order.created_at)}</span>
                    </div>
                    {tab === "shipped" && order.tracking_number && (
                      <div className="flex items-center gap-2 mt-2">
                        {order.shipping_carrier && (
                          <Badge variant="outline" className="text-[10px]">{order.shipping_carrier}</Badge>
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground truncate">{order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  {order.shipping_label_url && (
                    <Button size="sm" variant="ghost" onClick={() => window.open(order.shipping_label_url!, "_blank")} className="min-h-[44px]">
                      <Printer className="h-4 w-4" />
                    </Button>
                  )}
                  <Link href={`/admin/orders/${order.id}`}>
                    <Button size="sm" variant="ghost" className="min-h-[44px]">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
