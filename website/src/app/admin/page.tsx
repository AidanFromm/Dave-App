"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, getRevenueOverTime, getTopProducts } from "@/actions/admin";
import { getInventoryStats, type InventoryStats } from "@/actions/inventory";
import { TimeSelector } from "@/components/admin/time-selector";
import { DashboardStats } from "@/components/admin/dashboard-stats";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { ChannelChart } from "@/components/admin/channel-chart";
import { TopProducts } from "@/components/admin/top-products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { formatDateShort } from "@/lib/utils";
import type { TimePeriod } from "@/types/admin";
import { toast } from "sonner";
import { Package, DollarSign, Layers, TrendingUp } from "lucide-react";

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
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [invLoading, setInvLoading] = useState(true);

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
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  useEffect(() => {
    async function fetchInventory() {
      setInvLoading(true);
      try {
        const data = await getInventoryStats();
        setInventoryStats(data);
      } catch (error) {
        toast.error("Failed to load inventory stats");
      } finally {
        setInvLoading(false);
      }
    }
    fetchInventory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <TimeSelector selected={period} onChange={setPeriod} />
      </div>

      {/* Inventory Overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Inventory Overview</h2>
        {invLoading || !inventoryStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl shadow-card bg-card p-4 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{inventoryStats.totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryStats.sneakers.products} sneakers, {inventoryStats.pokemon.products} pokemon
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{inventoryStats.totalUnits}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryStats.sneakers.units} sneakers, {inventoryStats.pokemon.units} pokemon
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(inventoryStats.totalValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sneakers: {formatCurrency(inventoryStats.sneakers.value)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pokemon Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(inventoryStats.pokemon.value)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryStats.pokemon.units} units across {inventoryStats.pokemon.products} products
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Sales KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Sales Performance</h2>
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
      </div>

      {/* Recently Added */}
      {!invLoading && inventoryStats && inventoryStats.recentProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Added Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryStats.recentProducts.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                        <Package className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.size ? `Size ${p.size}` : "No size"} | Qty: {p.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateShort(p.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
