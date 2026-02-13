"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingCart, Mail, CheckCircle, XCircle, RefreshCw, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/types/product";

interface AbandonedCart {
  id: string;
  email: string;
  cart_items: Array<{ name?: string; price?: number; quantity?: number }>;
  cart_total: number;
  recovered: boolean;
  email_1_sent: boolean;
  email_1_sent_at: string | null;
  email_2_sent: boolean;
  email_2_sent_at: string | null;
  email_3_sent: boolean;
  email_3_sent_at: string | null;
  discount_code: string | null;
  created_at: string;
}

interface StockAlert {
  id: string;
  email: string;
  product_id: string;
  variant_id: string | null;
  created_at: string;
  notified_at: string | null;
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"carts" | "alerts">("carts");
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    const [cartsRes, alertsRes] = await Promise.all([
      supabase
        .from("abandoned_carts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("stock_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setCarts((cartsRes.data as AbandonedCart[]) || []);
    setStockAlerts((alertsRes.data as StockAlert[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCarts = carts.length;
  const recoveredCarts = carts.filter((c) => c.recovered).length;
  const recoveryRate = totalCarts > 0 ? ((recoveredCarts / totalCarts) * 100).toFixed(1) : "0";
  const totalRevenueLost = carts
    .filter((c) => !c.recovered)
    .reduce((s, c) => s + (c.cart_total || 0), 0);
  const totalRevenueRecovered = carts
    .filter((c) => c.recovered)
    .reduce((s, c) => s + (c.cart_total || 0), 0);
  const emailsSent = carts.reduce(
    (s, c) => s + (c.email_1_sent ? 1 : 0) + (c.email_2_sent ? 1 : 0) + (c.email_3_sent ? 1 : 0),
    0
  );

  const pendingAlerts = stockAlerts.filter((a) => !a.notified_at).length;
  const notifiedAlerts = stockAlerts.filter((a) => a.notified_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
            Cart Recovery & Stock Alerts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track abandoned carts, recovery emails, and back-in-stock notifications.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-800/50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Abandoned Carts"
          value={totalCarts.toString()}
          sub={`${recoveredCarts} recovered`}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Recovery Rate"
          value={`${recoveryRate}%`}
          sub={`${formatCurrency(totalRevenueRecovered)} recovered`}
        />
        <StatCard
          icon={<Mail className="h-5 w-5" />}
          label="Emails Sent"
          value={emailsSent.toString()}
          sub={`${formatCurrency(totalRevenueLost)} at risk`}
        />
        <StatCard
          icon={<Mail className="h-5 w-5" />}
          label="Stock Alerts"
          value={stockAlerts.length.toString()}
          sub={`${pendingAlerts} pending, ${notifiedAlerts} notified`}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveTab("carts")}
          className={`px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
            activeTab === "carts"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Abandoned Carts ({totalCarts})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 -mb-px transition-colors ${
            activeTab === "alerts"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          Stock Alerts ({stockAlerts.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === "carts" ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-800/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Items</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Total</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Email 1</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Email 2</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Email 3</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {carts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No abandoned carts yet.
                  </td>
                </tr>
              ) : (
                carts.map((cart) => (
                  <tr key={cart.id} className="border-b border-border/50 hover:bg-surface-800/20">
                    <td className="px-4 py-3 font-medium">{cart.email}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                      {(cart.cart_items || []).map((i) => i.name).filter(Boolean).join(", ") || "--"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {formatCurrency(cart.cart_total || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EmailBadge sent={cart.email_1_sent} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EmailBadge sent={cart.email_2_sent} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EmailBadge sent={cart.email_3_sent} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cart.recovered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500">
                          <CheckCircle className="h-3 w-3" /> Recovered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500">
                          <XCircle className="h-3 w-3" /> Abandoned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(cart.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-800/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Product ID</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Variant ID</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Subscribed</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Notified</th>
              </tr>
            </thead>
            <tbody>
              {stockAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No stock alert subscriptions yet.
                  </td>
                </tr>
              ) : (
                stockAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-border/50 hover:bg-surface-800/20">
                    <td className="px-4 py-3 font-medium">{alert.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {alert.product_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {alert.variant_id ? `${alert.variant_id.slice(0, 8)}...` : "--"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {alert.notified_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-500">
                          <CheckCircle className="h-3 w-3" /> Notified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500">
                          <Mail className="h-3 w-3" /> Waiting
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {alert.notified_at
                        ? new Date(alert.notified_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-bold font-mono">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function EmailBadge({ sent }: { sent: boolean }) {
  return sent ? (
    <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="mx-auto h-4 w-4 text-muted-foreground/30" />
  );
}
