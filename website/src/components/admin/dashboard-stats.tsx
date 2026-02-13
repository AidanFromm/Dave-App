"use client";

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3, Package } from "lucide-react";
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
  icon: React.ReactNode;
  accentColor?: string;
}

function KPICard({ label, value, change, icon, accentColor = "text-primary" }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl bg-card border border-border/50 p-5 transition-colors hover:border-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ${accentColor}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-mono font-bold mt-3">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        {isPositive ? (
          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
        )}
        <span
          className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            isPositive
              ? "bg-green-500/10 text-green-500"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {isPositive ? "+" : ""}
          {change}%
        </span>
        <span className="text-[10px] text-muted-foreground">vs prior period</span>
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
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KPICard
        label="Orders"
        value={stats.totalOrders.toLocaleString()}
        change={stats.ordersChange}
        icon={<ShoppingCart className="h-4 w-4" />}
      />
      <KPICard
        label="Avg Order Value"
        value={formatCurrency(stats.avgOrderValue)}
        change={stats.aovChange}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <KPICard
        label="Items Sold"
        value={stats.itemsSold.toLocaleString()}
        change={stats.itemsChange}
        icon={<Package className="h-4 w-4" />}
      />
    </div>
  );
}
