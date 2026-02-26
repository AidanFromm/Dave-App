"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, getRevenueOverTime, getTopProducts, getAdminOrders } from "@/actions/admin";
import { getInventoryStats, type InventoryStats } from "@/actions/inventory";
import { TimeSelector } from "@/components/admin/time-selector";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { ChannelChart } from "@/components/admin/channel-chart";
import { TopProducts } from "@/components/admin/top-products";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import type { TimePeriod } from "@/types/admin";
import { toast } from "sonner";
import {
  Package, DollarSign, Layers, TrendingUp, TrendingDown,
  ScanBarcode, ShoppingCart, ClipboardList, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Store, Globe, Eye,
  BarChart3, Box, Activity
} from "lucide-react";

const PERIOD_DAYS: Record<Exclude<TimePeriod, "custom">, number> = {
  today: 1, "7d": 7, "30d": 30, "90d": 90, all: 99999,
};

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  itemsSold: number;
  revenueChange: number;
  ordersChange: number;
  aovChange: number;
  itemsChange: number;
  webOrders: number;
  instoreOrders: number;
}

type RevenueData = Array<{ date: string; web: number; instore: number; total: number }>;
type ProductData = Array<{ name: string; revenue: number; quantity: number }>;

function ChangeBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-emerald-400" : "text-red-400"}`}>
      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "delivered" ? "bg-emerald-400" :
    status === "shipped" ? "bg-purple-400" :
    status === "pending" ? "bg-yellow-400" :
    status === "paid" ? "bg-blue-400" :
    status === "cancelled" ? "bg-red-400" :
    "bg-orange-400";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="capitalize">{status}</span>
    </span>
  );
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData>([]);
  const [topProducts, setTopProducts] = useState<ProductData>([]);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [invLoading, setInvLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const days = PERIOD_DAYS[period as Exclude<TimePeriod, "custom">] ?? 30;
        const [s, r, p] = await Promise.all([
          getDashboardStats(days),
          getRevenueOverTime(days),
          getTopProducts(days),
        ]);
        setStats(s);
        setRevenueData(r);
        setTopProducts(p);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  useEffect(() => {
    (async () => {
      setOrdersLoading(true);
      try {
        const orders = await getAdminOrders();
        setRecentOrders(orders.slice(0, 10));
      } catch { /* silent */ } finally {
        setOrdersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setInvLoading(true);
      try {
        setInventoryStats(await getInventoryStats());
      } catch {
        toast.error("Failed to load inventory stats");
      } finally {
        setInvLoading(false);
      }
    })();
  }, []);

  const pendingCount = recentOrders.filter(o => o.status === "pending" || o.status === "paid").length;
  const totalChannelOrders = (stats?.webOrders ?? 0) + (stats?.instoreOrders ?? 0);
  const webPct = totalChannelOrders > 0 ? ((stats?.webOrders ?? 0) / totalChannelOrders * 100).toFixed(0) : "0";
  const storePct = totalChannelOrders > 0 ? ((stats?.instoreOrders ?? 0) / totalChannelOrders * 100).toFixed(0) : "0";

  return (
    <div className="space-y-3 pb-8">
      {/* ── Header Row ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">Dashboard</h1>
          {pendingCount > 0 && (
            <Link href="/admin/orders?status=pending">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30 cursor-pointer text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {pendingCount} need attention
              </Badge>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TimeSelector selected={period} onChange={setPeriod} />
        </div>
      </div>

      {/* ── Quick Actions Toolbar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button asChild size="sm" className="h-11 gap-1.5 text-sm px-4">
          <Link href="/admin/scan"><ScanBarcode className="h-4 w-4" />Scan In</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 text-sm px-4 border-border/40">
          <Link href="/admin/orders/new"><ShoppingCart className="h-4 w-4" />New Order</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 text-sm px-4 border-border/40">
          <Link href="/admin/products"><Package className="h-4 w-4" />Inventory</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-11 gap-1.5 text-sm px-4 border-border/40">
          <Link href="/admin/orders"><ClipboardList className="h-4 w-4" />All Orders</Link>
        </Button>
      </div>

      {/* ── Hero Revenue + KPI Strip ── */}
      {loading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-card border border-border/40 p-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Hero: Revenue */}
          <div className="col-span-2 md:col-span-1 rounded-xl bg-gradient-to-br from-[#FB4F14]/15 to-[#FB4F14]/5 border border-[#FB4F14]/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FB4F14]">Revenue</p>
              <DollarSign className="h-4 w-4 text-[#FB4F14]" />
            </div>
            <p className="text-3xl md:text-4xl font-mono font-black mt-1.5 tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
            <ChangeBadge value={stats.revenueChange} />
          </div>
          {/* Orders */}
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Orders</p>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl md:text-3xl font-mono font-bold mt-1.5">{stats.totalOrders}</p>
            <ChangeBadge value={stats.ordersChange} />
          </div>
          {/* AOV */}
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Avg Order</p>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl md:text-3xl font-mono font-bold mt-1.5">{formatCurrency(stats.avgOrderValue)}</p>
            <ChangeBadge value={stats.aovChange} />
          </div>
          {/* Items Sold */}
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Items Sold</p>
              <Box className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl md:text-3xl font-mono font-bold mt-1.5">{stats.itemsSold}</p>
            <ChangeBadge value={stats.itemsChange} />
          </div>
          {/* Channel Split */}
          <div className="col-span-2 md:col-span-1 rounded-xl bg-card border border-border/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Channels</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-blue-400" />{webPct}% Web</span>
              <span className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-emerald-400" />{storePct}% Store</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-border/40 overflow-hidden flex">
              <div className="bg-blue-400 transition-all" style={{ width: `${webPct}%` }} />
              <div className="bg-emerald-400 transition-all" style={{ width: `${storePct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Inventory Strip ── */}
      {invLoading || !inventoryStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-card border border-border/40 p-3 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Products</p>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl md:text-2xl font-mono font-bold mt-1.5">{inventoryStats.totalProducts}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{inventoryStats.sneakers.products} sneakers / {inventoryStats.pokemon.products} pokemon</p>
          </div>
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Units</p>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl md:text-2xl font-mono font-bold mt-1.5">{inventoryStats.totalUnits}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{inventoryStats.sneakers.units} sneakers / {inventoryStats.pokemon.units} pokemon</p>
          </div>
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Value</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl md:text-2xl font-mono font-bold mt-1.5">{formatCurrency(inventoryStats.totalValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sneakers: {formatCurrency(inventoryStats.sneakers.value)}</p>
          </div>
          <div className="rounded-xl bg-card border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pokemon Value</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl md:text-2xl font-mono font-bold mt-1.5">{formatCurrency(inventoryStats.pokemon.value)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{inventoryStats.pokemon.units} units</p>
          </div>
        </div>
      )}

      {/* ── Low Stock Warning ── */}
      {!invLoading && inventoryStats && (inventoryStats.sneakers.units < 10 || inventoryStats.pokemon.units < 10) && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-4 py-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-amber-400 font-medium">Low stock:</span>
          <span className="text-muted-foreground">
            {inventoryStats.sneakers.units < 10 && `Sneakers ${inventoryStats.sneakers.units} units`}
            {inventoryStats.sneakers.units < 10 && inventoryStats.pokemon.units < 10 && " / "}
            {inventoryStats.pokemon.units < 10 && `Pokemon ${inventoryStats.pokemon.units} units`}
          </span>
        </div>
      )}

      {/* ── Revenue Chart + Top Products (side by side on desktop) ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-3">
          {loading ? (
            <div className="rounded-lg bg-card border border-border/40 p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : (
            <RevenueChart data={revenueData} />
          )}
        </div>
        <div className="md:col-span-2">
          {loading ? (
            <div className="rounded-lg bg-card border border-border/40 p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-[260px] w-full" />
            </div>
          ) : (
            <TopProducts products={topProducts} />
          )}
        </div>
      </div>

      {/* ── Recent Orders + Channel Chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {/* Orders Table */}
        <div className="md:col-span-3 rounded-lg bg-card border border-border/40 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border/30 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent Orders</span>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline font-medium">View All</Link>
          </div>
          {ordersLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No orders yet.</div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-left">
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Order</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Status</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/10 last:border-0 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono font-medium text-primary hover:underline">
                            {order.order_number ?? order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{order.customer_email ?? "--"}</td>
                        <td className="px-4 py-3 font-mono font-medium text-right">{formatCurrency(order.total ?? 0)}</td>
                        <td className="px-4 py-3 text-center text-xs"><StatusDot status={order.status} /></td>
                        <td className="px-4 py-3 text-muted-foreground text-right font-mono">{formatDateShort(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile + iPad */}
              <div className="lg:hidden divide-y divide-border/20">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-4 py-3 min-h-[56px] hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-primary">{order.order_number ?? order.id.slice(0, 8)}</span>
                        <span className="text-xs"><StatusDot status={order.status} /></span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{order.customer_email ?? "--"}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-mono font-medium">{formatCurrency(order.total ?? 0)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{formatDateShort(order.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Channel Chart + Recently Added */}
        <div className="md:col-span-2 space-y-3">
          {loading || !stats ? (
            <div className="rounded-lg bg-card border border-border/40 p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <ChannelChart webOrders={stats.webOrders} instoreOrders={stats.instoreOrders} />
          )}

          {/* Recently Added (compact) */}
          {!invLoading && inventoryStats && inventoryStats.recentProducts.length > 0 && (
            <div className="rounded-lg bg-card border border-border/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30">
                <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recently Added</span>
              </div>
              <div className="divide-y divide-border/15">
                {inventoryStats.recentProducts.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 min-h-[48px] hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-9 h-9 rounded object-contain bg-surface-850 flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded bg-surface-850 flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.size ? `Size ${p.size}` : "No size"} / Qty: {p.quantity}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono flex-shrink-0 ml-2">{formatDateShort(p.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
