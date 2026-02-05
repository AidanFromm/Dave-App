"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/types/product";

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    itemsSold: number;
    revenueChange: number;
    ordersChange: number;
    aovChange: number;
    itemsChange: number;
  };
}

interface KPICardProps {
  label: string;
  value: string;
  change: number;
}

function KPICard({ label, value, change }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl shadow-card bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <div className="flex items-center gap-1 mt-2">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
            isPositive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
      </div>
    </div>
  );
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        label="Revenue"
        value={formatCurrency(stats.totalRevenue)}
        change={stats.revenueChange}
      />
      <KPICard
        label="Orders"
        value={stats.totalOrders.toLocaleString()}
        change={stats.ordersChange}
      />
      <KPICard
        label="Avg Order Value"
        value={formatCurrency(stats.avgOrderValue)}
        change={stats.aovChange}
      />
      <KPICard
        label="Items Sold"
        value={stats.itemsSold.toLocaleString()}
        change={stats.itemsChange}
      />
    </div>
  );
}
