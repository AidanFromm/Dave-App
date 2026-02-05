"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { getDashboardStats, getRevenueOverTime, getTopProducts } from "@/actions/admin";
import { TimeSelector } from "@/components/admin/time-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/types/product";
import type { TimePeriod } from "@/types/admin";

const PERIOD_DAYS: Record<Exclude<TimePeriod, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

const COLORS = {
  primary: "#FB4F14",
  info: "#007AFF",
  success: "#34C759",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type RevenueData = Array<{ date: string; web: number; instore: number; total: number }>;
type ProductData = Array<{ name: string; revenue: number; quantity: number }>;

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

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function computeAovTrend(revenueData: RevenueData): Array<{ date: string; aov: number }> {
  // Compute a running average order value trend from revenue data
  // We'll approximate by using total revenue and assuming an average per day
  let runningTotal = 0;
  let runningDays = 0;
  return revenueData.map((d) => {
    runningTotal += d.total;
    runningDays += 1;
    return {
      date: d.date,
      aov: runningDays > 0 ? Math.round((runningTotal / runningDays) * 100) / 100 : 0,
    };
  });
}

function computeOrdersByDayOfWeek(revenueData: RevenueData): Array<{ day: string; orders: number; revenue: number }> {
  const days = DAY_NAMES.map((name) => ({ day: name, orders: 0, revenue: 0 }));
  revenueData.forEach((d) => {
    const date = new Date(d.date + "T00:00:00");
    const dayIndex = date.getDay();
    days[dayIndex].orders += 1;
    days[dayIndex].revenue += d.total;
  });
  return days;
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl shadow-card bg-card p-4 space-y-4">
      <Skeleton className="h-5 w-40" />
      <Skeleton className={`w-full`} style={{ height }} />
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData>([]);
  const [topProducts, setTopProducts] = useState<ProductData>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const days = PERIOD_DAYS[period as Exclude<TimePeriod, "custom">] ?? 30;
        const [statsResult, revenueResult, productsResult] = await Promise.all([
          getDashboardStats(days),
          getRevenueOverTime(days),
          getTopProducts(days, 10),
        ]);
        setStats(statsResult);
        setRevenueData(revenueResult);
        setTopProducts(productsResult);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  const aovTrend = computeAovTrend(revenueData);
  const ordersByDay = computeOrdersByDayOfWeek(revenueData);

  const tooltipStyle = {
    borderRadius: "8px",
    border: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--card))",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <TimeSelector selected={period} onChange={setPeriod} />
      </div>

      {/* Revenue Over Time (Full Width) */}
      {loading ? (
        <ChartSkeleton height={350} />
      ) : (
        <div className="rounded-xl shadow-card bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          {revenueData.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInstore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.info} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={80}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)),
                    name === "web" ? "Web" : name === "instore" ? "In-Store" : "Total",
                  ]}
                  labelFormatter={(label: any) => formatShortDate(String(label))}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  verticalAlign="top"
                  formatter={(value: string) => (
                    <span className="text-sm text-foreground capitalize">
                      {value === "web" ? "Web" : value === "instore" ? "In-Store" : value}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="instore"
                  stackId="1"
                  stroke={COLORS.info}
                  fill="url(#colorInstore)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="web"
                  stackId="1"
                  stroke={COLORS.primary}
                  fill="url(#colorWeb)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Two-Column Row: Sales by Channel + AOV Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Channel (PieChart) */}
        {loading || !stats ? (
          <ChartSkeleton height={280} />
        ) : (
          <div className="rounded-xl shadow-card bg-card p-4">
            <h3 className="text-lg font-semibold mb-4">Sales by Channel</h3>
            {stats.webOrders + stats.instoreOrders === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: `Web (${Math.round((stats.webOrders / (stats.webOrders + stats.instoreOrders)) * 100)}%)`,
                        value: stats.webOrders,
                      },
                      {
                        name: `In-Store (${Math.round((stats.instoreOrders / (stats.webOrders + stats.instoreOrders)) * 100)}%)`,
                        value: stats.instoreOrders,
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill={COLORS.primary} strokeWidth={0} />
                    <Cell fill={COLORS.info} strokeWidth={0} />
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [Number(value), "Orders"]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* AOV Trend (LineChart) */}
        {loading ? (
          <ChartSkeleton height={280} />
        ) : (
          <div className="rounded-xl shadow-card bg-card p-4">
            <h3 className="text-lg font-semibold mb-4">AOV Trend</h3>
            {aovTrend.length === 0 ? (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={aovTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCurrency(v)}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={80}
                  />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => [formatCurrency(Number(value)), "Avg Order Value"]}
                    labelFormatter={(label: any) => formatShortDate(String(label))}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="aov"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Orders by Day of Week (BarChart) */}
      {loading ? (
        <ChartSkeleton height={280} />
      ) : (
        <div className="rounded-xl shadow-card bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Orders by Day of Week</h3>
          {ordersByDay.every((d) => d.orders === 0) ? (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    name === "revenue" ? formatCurrency(Number(value)) : Number(value),
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-sm text-foreground capitalize">{value}</span>
                  )}
                />
                <Bar dataKey="orders" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="revenue" fill={COLORS.info} radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Top Products (Horizontal BarChart) */}
      {loading ? (
        <ChartSkeleton height={350} />
      ) : (
        <div className="rounded-xl shadow-card bg-card p-4">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          {topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={140}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [
                    name === "revenue" ? formatCurrency(Number(value)) : Number(value),
                    name === "revenue" ? "Revenue" : "Qty Sold",
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-sm text-foreground capitalize">
                      {value === "revenue" ? "Revenue" : "Qty Sold"}
                    </span>
                  )}
                />
                <Bar
                  dataKey="revenue"
                  fill={COLORS.primary}
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
                <Bar
                  dataKey="quantity"
                  fill={COLORS.success}
                  radius={[0, 4, 4, 0]}
                  barSize={16}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}
