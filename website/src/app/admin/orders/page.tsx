"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { getAdminOrders, updateOrderStatus } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";
import { toast } from "sonner";
import {
  Search,
  Printer,
  CheckSquare,
  Square,
  ChevronDown,
  Package,
  Truck,
  XCircle,
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/30 text-yellow-400",
  confirmed: "bg-blue-900/30 text-blue-400",
  paid: "bg-blue-900/30 text-blue-400",
  processing: "bg-orange-900/30 text-orange-400",
  shipped: "bg-purple-900/30 text-purple-400",
  delivered: "bg-green-900/30 text-green-400",
  cancelled: "bg-red-900/30 text-red-400",
  returned: "bg-gray-900/30 text-gray-400",
  refunded: "bg-gray-900/30 text-gray-400",
};

const FILTER_STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") result = result.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        (o.order_number?.toLowerCase() ?? "").includes(q) ||
        (o.customer_email?.toLowerCase() ?? "").includes(q) ||
        (o.customer_name?.toLowerCase() ?? "").includes(q)
      );
    }
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00");
      result = result.filter((o) => new Date(o.created_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59");
      result = result.filter((o) => new Date(o.created_at) <= to);
    }
    return [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useMemo(() => { setCurrentPage(1); }, [search, statusFilter, dateFrom, dateTo]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map((o) => o.id)));
    }
  };

  const handleBulkUpdate = async (newStatus: string) => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(Array.from(selected).map((id) => updateOrderStatus(id, newStatus)));
      toast.success(`Updated ${selected.size} order(s) to ${ORDER_STATUS_LABELS[newStatus as OrderStatus] ?? newStatus}`);
      setSelected(new Set());
      await fetchOrders();
    } catch (err: any) {
      toast.error(err.message ?? "Bulk update failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handlePrintPackingSlips = () => {
    const selectedOrders = orders.filter((o) => selected.has(o.id));
    if (selectedOrders.length === 0) return;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Pop-up blocked"); return; }
    const html = `<!DOCTYPE html><html><head><title>Packing Slips</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #111; }
  .slip { page-break-after: always; padding: 40px; max-width: 700px; margin: 0 auto; }
  .slip:last-child { page-break-after: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #FB4F14; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0; color: #002244; }
  .header .order-info { text-align: right; font-size: 13px; color: #555; }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 4px; border-bottom: 1px solid #ddd; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  td { padding: 8px 4px; border-bottom: 1px solid #eee; }
  .address { font-size: 13px; line-height: 1.6; }
  .checklist { list-style: none; padding: 0; margin: 0; }
  .checklist li { padding: 6px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; display: flex; align-items: center; gap: 8px; }
  .checklist li:before { content: ''; display: inline-block; width: 14px; height: 14px; border: 1.5px solid #999; border-radius: 2px; flex-shrink: 0; }
  .return-address { margin-top: 32px; padding-top: 16px; border-top: 1px dashed #ccc; font-size: 11px; color: #888; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style></head><body>
${selectedOrders.map((order) => {
  const items = (order.items ?? []) as any[];
  const addr = order.shipping_address as any;
  const customerName = addr ? `${addr.firstName ?? ""} ${addr.lastName ?? ""}`.trim() : (order.customer_name ?? "");
  return `<div class="slip">
    <div class="header">
      <div><h1>SECURED TAMPA</h1><p style="font-size:12px;color:#888;margin:4px 0 0;">Packing Slip</p></div>
      <div class="order-info">
        <strong>${order.order_number ?? order.id.slice(0, 8)}</strong><br/>
        ${new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
      </div>
    </div>
    <div class="section">
      <h3>Ship To</h3>
      <div class="address">${addr ? `${customerName}<br/>${addr.street ?? ""}${addr.apartment ? "<br/>" + addr.apartment : ""}<br/>${addr.city ?? ""}, ${addr.state ?? ""} ${addr.zipCode ?? ""}${addr.phone ? "<br/>" + addr.phone : ""}` : (order.customer_email ?? "N/A")}</div>
    </div>
    <div class="section">
      <h3>Items</h3>
      <table>
        <thead><tr><th>Product</th><th>Size</th><th style="text-align:center">Qty</th></tr></thead>
        <tbody>${items.map((item: any) => `<tr><td>${item.name}</td><td>${item.size ?? "--"}</td><td style="text-align:center">${item.quantity}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="section">
      <h3>Packing Checklist</h3>
      <ul class="checklist">
        ${items.map((item: any) => `<li>${item.name}${item.size ? " - Size " + item.size : ""} (x${item.quantity})</li>`).join("")}
        <li>Packaging intact / no damage</li>
        <li>Correct items verified</li>
        <li>Receipt / invoice excluded</li>
      </ul>
    </div>
    <div class="return-address">
      SECURED TAMPA -- 123 Main St, Tampa, FL 33601 -- securedtampa.com
    </div>
  </div>`;
}).join("")}
</body></html>`;
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const getItemCount = (order: any): number => {
    return (order.items as any[] | null)?.reduce((sum: number, i: any) => sum + (i.quantity ?? 1), 0) ?? 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {orders.length} total{pendingCount > 0 && ` / ${pendingCount} pending`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search order #, email, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="To"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {s === "all" ? "All" : ORDER_STATUS_LABELS[s as OrderStatus] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkUpdate("processing")}
              disabled={bulkLoading}
              className="gap-1.5"
            >
              <Package className="h-3.5 w-3.5" />
              Mark Processing
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkUpdate("shipped")}
              disabled={bulkLoading}
              className="gap-1.5"
            >
              <Truck className="h-3.5 w-3.5" />
              Mark Shipped
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintPackingSlips}
              className="gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Packing Slips
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkUpdate("cancelled")}
              disabled={bulkLoading}
              className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                    {selected.size === paginated.length && paginated.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Items</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">No orders found.</td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-surface-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(order.id)} className="text-muted-foreground hover:text-foreground">
                        {selected.has(order.id) ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium text-primary hover:underline font-mono text-xs">
                        {order.order_number ?? order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDateShort(order.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[200px]">{order.customer_email ?? "--"}</td>
                    <td className="px-4 py-3 text-center text-xs">{getItemCount(order)}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-xs">{formatCurrency(order.total ?? 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className={`text-[10px] border-0 ${STATUS_COLORS[order.status] ?? ""}`}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {((safePage - 1) * ITEMS_PER_PAGE) + 1}--{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
