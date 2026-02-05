"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/types/product";

interface RevenueChartProps {
  data: Array<{ date: string; web: number; instore: number; total: number }>;
}

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl shadow-card bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-card bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FB4F14" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FB4F14" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorInstore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
          </defs>
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
              name === "web" ? "Web" : "In-Store",
            ]}
            labelFormatter={(label: any) => formatShortDate(String(label))}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
            }}
          />
          <Area
            type="monotone"
            dataKey="instore"
            stackId="1"
            stroke="#007AFF"
            fill="url(#colorInstore)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="web"
            stackId="1"
            stroke="#FB4F14"
            fill="url(#colorWeb)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
