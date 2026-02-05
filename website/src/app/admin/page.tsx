"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, getRevenueOverTime, getTopProducts } from "@/actions/admin";
import { TimeSelector } from "@/components/admin/time-selector";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { ChannelChart } from "@/components/admin/channel-chart";
import { TopProducts } from "@/components/admin/top-products";
import { Skeleton } from "@/components/ui/skeleton";
import type { TimePeriod } from "@/types/admin";

const PERIOD_DAYS: Record<Exclude<TimePeriod, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
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

export default function AdminDashboardPage() {
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
          getTopProducts(days),
        ]);
        setStats(statsResult);
        setRevenueData(revenueResult);
        setTopProducts(productsResult);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <TimeSelector selected={period} onChange={setPeriod} />
      </div>

      {/* KPI Cards */}
      {loading || !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl shadow-card bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <DashboardStats stats={stats} />
      )}

      {/* Revenue Chart */}
      {loading ? (
        <div className="rounded-xl shadow-card bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : (
        <RevenueChart data={revenueData} />
      )}

      {/* Bottom Row: Top Products + Channel Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="rounded-xl shadow-card bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <TopProducts products={topProducts} />
          )}
        </div>
        <div className="lg:col-span-1">
          {loading || !stats ? (
            <div className="rounded-xl shadow-card bg-card p-6 space-y-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-[250px] w-full" />
            </div>
          ) : (
            <ChannelChart
              webOrders={stats.webOrders}
              instoreOrders={stats.instoreOrders}
            />
          )}
        </div>
      </div>
    </div>
  );
}
