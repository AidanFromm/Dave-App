"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCustomerDetail } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatDateShort } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";
import {
  ArrowLeft,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  StickyNote,
  ShieldCheck,
  ShieldX,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchCustomer = async () => {
    const data = await getCustomerDetail(customerId);
    setCustomer(data);
    setNotes(data?.admin_notes ?? "");
    setLoading(false);
  };

  useEffect(() => { fetchCustomer(); }, [customerId]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("customers").update({ admin_notes: notes }).eq("id", customerId);
      if (error) throw error;
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleToggleStatus = async (blocked: boolean) => {
    setStatusLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("customers").update({ is_blocked: blocked }).eq("id", customerId);
      if (error) throw error;
      setCustomer((prev: any) => prev ? { ...prev, is_blocked: blocked } : prev);
      toast.success(blocked ? "Customer blocked" : "Customer approved");
    } catch {
      toast.error("Failed to update customer status");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-32" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </Link>
        <p className="mt-6 text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  const fullName = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Unknown";
  const initials = `${(customer.first_name ?? "?")[0]}${(customer.last_name ?? "?")[0]}`.toUpperCase();
  const orders = customer.orders ?? [];

  const stats = [
    {
      label: "Total Orders",
      value: customer.total_orders ?? 0,
      icon: ShoppingBag,
      color: "text-blue-500",
    },
    {
      label: "Total Spend",
      value: formatCurrency(customer.total_spend ?? 0),
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Avg Order Value",
      value: formatCurrency(customer.avg_order_value ?? 0),
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      {/* Profile header */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-sm text-muted-foreground">{customer.email ?? "—"}</p>
          {customer.created_at && (
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(customer.created_at)}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Contact Info & Actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Contact */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Contact Information
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{customer.email ?? "--"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{customer.phone ?? "--"}</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {customer.is_blocked ? (
              <Button size="sm" variant="outline" onClick={() => handleToggleStatus(false)} disabled={statusLoading} className="gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Approve
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => handleToggleStatus(true)} disabled={statusLoading} className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
                <ShieldX className="h-3.5 w-3.5" />
                Block
              </Button>
            )}
            {customer.is_blocked && (
              <Badge variant="outline" className="border-0 bg-red-900/30 text-red-400 text-[10px]">Blocked</Badge>
            )}
          </div>
        </div>

        {/* Admin Notes */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            Admin Notes
          </h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add internal notes about this customer..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              {savingNotes ? "Saving..." : "Save Notes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Order History</h2>
        {/* Desktop table */}
        <div className="mt-3 hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold">Order #</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-center">Items</th>
                <th className="pb-3 font-semibold text-right">Total</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const itemCount =
                    (order.items as Array<{ quantity: number }> | null)?.reduce(
                      (sum: number, i: { quantity: number }) => sum + (i.quantity ?? 1),
                      0
                    ) ?? 0;
                  const statusLabel =
                    ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;

                  return (
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
                      <td className="py-3 text-center">{itemCount}</td>
                      <td className="py-3 text-right font-medium">
                        {formatCurrency(order.total ?? 0)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] border-0 ${STATUS_COLORS[order.status] ?? ""}`}
                        >
                          {statusLabel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="mt-3 md:hidden space-y-2">
          {orders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No orders yet.</div>
          ) : (
            orders.map((order: any) => {
              const itemCount =
                (order.items as Array<{ quantity: number }> | null)?.reduce(
                  (sum: number, i: { quantity: number }) => sum + (i.quantity ?? 1),
                  0
                ) ?? 0;
              const statusLabel =
                ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-primary text-sm">{order.order_number ?? order.id.slice(0, 8)}</span>
                    <Badge variant="outline" className={`text-[10px] border-0 ${STATUS_COLORS[order.status] ?? ""}`}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{formatDateShort(order.created_at)} -- {itemCount} item{itemCount !== 1 ? "s" : ""}</span>
                    <span className="text-sm font-medium">{formatCurrency(order.total ?? 0)}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
