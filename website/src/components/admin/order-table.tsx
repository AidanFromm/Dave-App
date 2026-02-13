"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  SALES_CHANNEL_LABELS,
  type OrderStatus,
  type SalesChannel,
} from "@/types/order";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 20;

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

const CHANNEL_COLORS: Record<string, string> = {
  web: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  pos: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  in_store: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  ios: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300",
  ebay: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
  whatnot: "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
};

const FILTER_STATUSES = ["all", "pending", "paid", "processing", "shipped", "delivered"] as const;

interface OrderTableProps {
  orders: any[];
}

export function OrderTable({ orders }: OrderTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = orders;

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          (o.order_number?.toLowerCase() ?? "").includes(q) ||
          (o.customer_email?.toLowerCase() ?? "").includes(q)
      );
    }

    // Sort by date (newest first)
    result = [...result].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return result;
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page on filter change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setCurrentPage(1); }, [search, statusFilter]);

  const getItemCount = (order: any): number => {
    const items = order.items as Array<{ quantity: number }> | null;
    return items?.reduce((sum, i) => sum + (i.quantity ?? 1), 0) ?? 0;
  };

  const getStatusLabel = (status: string): string => {
    return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
  };

  const getChannelLabel = (channel: string): string => {
    if (channel === "pos" || channel === "in_store") return "In-Store";
    return SALES_CHANNEL_LABELS[channel as SalesChannel] ?? channel;
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order # or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
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
              {s === "all" ? "All" : getStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-semibold">Order #</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Customer</th>
              <th className="pb-3 font-semibold text-center">Items</th>
              <th className="pb-3 font-semibold text-right">Total</th>
              <th className="pb-3 font-semibold text-center">Channel</th>
              <th className="pb-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {order.order_number ?? order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {formatDateShort(order.created_at)}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {order.customer_email ?? "—"}
                  </td>
                  <td className="py-3 text-center">{getItemCount(order)}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(order.total ?? 0)}
                  </td>
                  <td className="py-3 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] border-0 ${CHANNEL_COLORS[order.sales_channel ?? order.channel ?? "web"] ?? ""}`}
                    >
                      {getChannelLabel(order.sales_channel ?? order.channel ?? "web")}
                    </Badge>
                  </td>
                  <td className="py-3 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] border-0 ${STATUS_COLORS[order.status] ?? ""}`}
                    >
                      {getStatusLabel(order.status)}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {((safePage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
      </div>
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
