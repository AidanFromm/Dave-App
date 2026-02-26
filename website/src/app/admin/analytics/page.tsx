"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { getAnalyticsData } from "@/actions/analytics";
import { TimeSelector } from "@/components/admin/time-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/types/product";
import type { TimePeriod } from "@/types/admin";
import { toast } from "sonner";

const PERIOD_DAYS: Record<Exclude<TimePeriod, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 365,
};

const COLORS = {
  primary: "#FB4F14",
  navy: "#002244",
  muted: "#9CA3AF",
  green: "#34C759",
  purple: "#8B5CF6",
  amber: "#F59E0B",
};

const CATEGORY_COLORS = [COLORS.primary, COLORS.navy, COLORS.green, COLORS.purple, COLORS.amber, COLORS.muted];

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MetricCard({
  title,
  value,
  change,
  prefix = "",
}: {
  title: string;
  value: string;
  change?: number;
  prefix?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">
        {prefix}
        {value}
      </p>
      {change !== undefined && (
        <p className={`text-xs font-medium ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
          {change >= 0 ? "+" : ""}
          {change}% vs prior period
        </p>
      )}
    </div>
  );
}

function InfoCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-1">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
    </div>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="w-full" style={{ height }} />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

type AnalyticsResult = Awaited<ReturnType<typeof getAnalyticsData>>;

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card))",
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const days = PERIOD_DAYS[period as Exclude<TimePeriod, "custom">] ?? 30;
        const result = await getAnalyticsData(days);
        if (!cancelled) setData(result);
      } catch {
        toast.error("Failed to load analytics data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [period]);

  const s = data?.stats;
  const channelData = data?.channelData ?? [];
  const totalChannelOrders = channelData.reduce((sum: number, c: { orders: number }) => sum + c.orders, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header + Time Period Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <TimeSelector selected={period} onChange={setPeriod} />
      </div>

      {/* 2. Key Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : s ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricCard title="Revenue" value={formatCurrency(s.totalRevenue)} change={s.revenueChange} />
          <MetricCard title="Orders" value={String(s.totalOrders)} change={s.ordersChange} />
          <MetricCard title="Avg Order Value" value={formatCurrency(s.avgOrderValue)} change={s.aovChange} />
          <MetricCard title="Items Sold" value={String(s.itemsSold)} change={s.itemsChange} />
          <MetricCard title="Customers" value={String(s.uniqueCustomers)} change={s.customersChange} />
        </div>
      ) : null}

      {/* 3. Revenue Over Time (Area Chart) */}
      {loading ? (
        <ChartSkeleton height={350} />
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          {!data?.revenueOverTime.length ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.revenueOverTime}>
                <defs>
                  <linearGradient id="gWeb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInstore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), name === "web" ? "Web" : "In-Store"]}
                  labelFormatter={(label: any) => formatShortDate(String(label))}
                  contentStyle={tooltipStyle}
                />
                <Legend formatter={(value: any) => <span className="text-sm text-foreground">{value === "web" ? "Web" : "In-Store"}</span>} />
                <Area type="monotone" dataKey="instore" stackId="1" stroke={COLORS.navy} fill="url(#gInstore)" strokeWidth={2} />
                <Area type="monotone" dataKey="web" stackId="1" stroke={COLORS.primary} fill="url(#gWeb)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* 4. Two-Column: Orders by Channel + Revenue by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <>
            <ChartSkeleton height={280} />
            <ChartSkeleton height={280} />
          </>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Orders by Channel</h3>
              {totalChannelOrders === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">No data available</div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="orders">
                        <Cell fill={COLORS.primary} strokeWidth={0} />
                        <Cell fill={COLORS.navy} strokeWidth={0} />
                      </Pie>
                      <Legend iconType="circle" formatter={(value: any) => <span className="text-sm text-foreground">{value}</span>} />
                      <Tooltip formatter={(value: any) => [value, "Orders"]} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: 32 }}>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{totalChannelOrders}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Revenue by Category</h3>
              {!data?.categoryData.length ? (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                      {data.categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" formatter={(value: any) => <span className="text-sm text-foreground">{value}</span>} />
                    <Tooltip formatter={(value: any) => [formatCurrency(value), "Revenue"]} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>

      {/* 5. Top Products (Horizontal Bar Chart) */}
      {loading ? (
        <ChartSkeleton height={400} />
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          {!data?.topProducts.length ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(300, data.topProducts.length * 44)}>
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={160} />
                <Tooltip
                  formatter={(value: any, name: any) => [name === "revenue" ? formatCurrency(value) : value, name === "revenue" ? "Revenue" : "Units Sold"]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={18} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* 6. Two-Column: Sales by Day of Week + Sales by Hour */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <>
            <ChartSkeleton height={280} />
            <ChartSkeleton height={280} />
          </>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Avg Revenue by Day of Week</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={70} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), "Avg Revenue"]} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">Sales by Hour</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.salesByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={2} />
                  <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" width={70} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), "Revenue"]} contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" fill={COLORS.navy} radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* 7. Customer Insights */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data?.customers ? (
        <>
          <h3 className="text-lg font-semibold">Customer Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Total Customers" value={String(data.customers.total)} />
            <InfoCard title="New Customers This Period" value={String(data.customers.new)} />
            <InfoCard
              title="Top Customer"
              value={data.customers.topCustomers?.[0] ? formatCurrency(data.customers.topCustomers[0].totalSpend) : "$0"}
              subtitle={data.customers.topCustomers?.[0]?.email || "N/A"}
            />
          </div>
        </>
      ) : null}

      {/* 8. Inventory Health */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data?.inventory ? (
        <>
          <h3 className="text-lg font-semibold">Inventory Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard title="Total Products" value={String(data.inventory.total)} />
            <InfoCard title="Low Stock (< 3)" value={String(data.inventory.lowStock)} />
            <InfoCard title="Out of Stock" value={String(data.inventory.outOfStock)} />
          </div>
        </>
      ) : null}
    </div>
  );
}


