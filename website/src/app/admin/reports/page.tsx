"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { getDashboardStats, getRevenueOverTime, getTopProducts, getAdminCustomers } from "@/actions/admin";
import { getInventoryStats } from "@/actions/inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { TimePeriod } from "@/types/admin";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  Calendar,
  ChevronDown,
} from "lucide-react";

const COLORS = {
  primary: "#FB4F14",
  navy: "#002244",
  info: "#007AFF",
  success: "#34C759",
  muted: "#6B7280",
};

type PeriodOption = "7d" | "30d" | "90d";
const PERIOD_DAYS: Record<PeriodOption, number> = { "7d": 7, "30d": 30, "90d": 90 };
const PERIOD_LABELS: Record<PeriodOption, string> = { "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days" };

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<PeriodOption>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const days = PERIOD_DAYS[period];
        const [s, r, p, c, inv] = await Promise.all([
          getDashboardStats(days),
          getRevenueOverTime(days),
          getTopProducts(days, 10),
          getAdminCustomers(),
          getInventoryStats(),
        ]);
        setStats(s);
        setRevenueData(r);
        setTopProducts(p);
        setCustomers(c);
        setInventoryStats(inv);
      } catch {
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.total_spend ?? 0) - (a.total_spend ?? 0))
      .slice(0, 10);
  }, [customers]);

  const profitData = useMemo(() => {
    // Estimate profit margins from revenue data (rough 40% margin estimate)
    return revenueData.map((d) => ({
      date: d.date,
      revenue: d.total,
      profit: Math.round(d.total * 0.4 * 100) / 100,
    }));
  }, [revenueData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Sales performance, top products, and business insights.</p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodOption)}
            className="appearance-none rounded-lg border border-border bg-card px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {(Object.keys(PERIOD_LABELS) as PeriodOption[]).map((p) => (
              <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Summary KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Revenue</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-mono font-bold mt-3">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.revenueChange >= 0 ? "+" : ""}{stats.revenueChange}% vs prior period
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Orders</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-mono font-bold mt-3">{stats.totalOrders}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.ordersChange >= 0 ? "+" : ""}{stats.ordersChange}% vs prior period
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Avg Order Value</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-mono font-bold mt-3">{formatCurrency(stats.avgOrderValue)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats.aovChange >= 0 ? "+" : ""}{stats.aovChange}% vs prior period
            </p>
          </div>
          <div className="rounded-xl bg-card border border-border/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Inventory Value</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-mono font-bold mt-3">{formatCurrency(inventoryStats?.totalValue ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {inventoryStats?.totalUnits ?? 0} units across {inventoryStats?.totalProducts ?? 0} products
            </p>
          </div>
        </div>
      )}

      {/* Sales by Period (Line Chart) */}
      <div className="rounded-xl bg-card border border-border/50 p-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-tight mb-4">Sales by Period</h2>
        {revenueData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => [formatCurrency(Number(value) || 0), name === "web" ? "Web" : name === "instore" ? "In-Store" : "Total"]) as any}
                labelFormatter={((label: any) => formatShortDate(String(label))) as any}
                contentStyle={tooltipStyle}
              />
              <Legend formatter={((value: any) => <span className="text-sm capitalize">{value === "web" ? "Web" : value === "instore" ? "In-Store" : value}</span>) as any} />
              <Line type="monotone" dataKey="web" stroke={COLORS.primary} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="instore" stroke={COLORS.info} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="total" stroke={COLORS.success} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Two Column: Top Products + Profit Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="font-display text-lg font-semibold uppercase tracking-tight mb-4">Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip
                  formatter={((value: any, name: any) => [name === "revenue" ? formatCurrency(value) : value, name === "revenue" ? "Revenue" : "Qty"]) as any}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Profit Margins */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="font-display text-lg font-semibold uppercase tracking-tight mb-4">Revenue vs Est. Profit</h2>
          {profitData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={70} />
                <Tooltip
                  formatter={((value: any, name: any) => [formatCurrency(Number(value) || 0), name === "revenue" ? "Revenue" : "Est. Profit"]) as any}
                  labelFormatter={((label: any) => formatShortDate(String(label))) as any}
                  contentStyle={tooltipStyle}
                />
                <Legend formatter={((value: any) => <span className="text-sm capitalize">{value === "revenue" ? "Revenue" : "Est. Profit"}</span>) as any} />
                <Bar dataKey="revenue" fill={COLORS.navy} radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="profit" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="rounded-xl bg-card border border-border/50 p-5">
        <h2 className="font-display text-lg font-semibold uppercase tracking-tight mb-4">Top Customers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">#</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Customer</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-center">Orders</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Total Spend</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">AOV</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No customer data available.</td>
                </tr>
              ) : (
                topCustomers.map((c, i) => (
                  <tr key={c.id} className="border-b border-border/30 last:border-0 hover:bg-surface-800/20 transition-colors">
                    <td className="py-3 text-muted-foreground font-mono">{i + 1}</td>
                    <td className="py-3">
                      <p className="font-medium">{c.first_name ?? ""} {c.last_name ?? ""}</p>
                      <p className="text-xs text-muted-foreground">{c.email ?? ""}</p>
                    </td>
                    <td className="py-3 text-center font-mono">{c.total_orders ?? 0}</td>
                    <td className="py-3 text-right font-mono font-medium">{formatCurrency(c.total_spend ?? 0)}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{formatCurrency(c.avg_order_value ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
