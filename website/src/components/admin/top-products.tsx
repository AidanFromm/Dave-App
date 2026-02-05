"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/types/product";

interface TopProductsProps {
  products: Array<{ name: string; revenue: number; quantity: number }>;
}

export function TopProducts({ products }: TopProductsProps) {
  if (!products || products.length === 0) {
    return (
      <div className="rounded-xl shadow-card bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-card bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={products} layout="vertical" margin={{ left: 20 }}>
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
            width={120}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--card))",
            }}
          />
          <Bar
            dataKey="revenue"
            fill="#FB4F14"
            radius={[0, 4, 4, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
