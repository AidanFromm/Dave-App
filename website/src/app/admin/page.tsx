"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Package, DollarSign, Layers, TrendingUp, Plus, ScanBarcode, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
        </div>
        <div className="flex items-center gap-2">
          <TimeSelector selected={period} onChange={setPeriod} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/admin/products/new">
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5 border-border/50">
          <Link href="/admin/scan">
            <ScanBarcode className="h-3.5 w-3.5" />
            Scan In
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5 border-border/50">
          <Link href="/admin/pokemon">
            <Sparkles className="h-3.5 w-3.5" />
            Add Pokémon
          </Link>
        </Button>
      </div>

      {/* Inventory Overview */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">Inventory Overview</h2>
        {invLoading || !inventoryStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 p-5 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl bg-card border border-border/50 p-5 transition-colors hover:border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Products</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-mono font-bold mt-3">{inventoryStats.totalProducts}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {inventoryStats.sneakers.products} sneakers · {inventoryStats.pokemon.products} pokémon
              </p>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-5 transition-colors hover:border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Total Units</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Package className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-mono font-bold mt-3">{inventoryStats.totalUnits}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {inventoryStats.sneakers.units} sneakers · {inventoryStats.pokemon.units} pokémon
              </p>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-5 transition-colors hover:border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Inventory Value</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-mono font-bold mt-3">{formatCurrency(inventoryStats.totalValue)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Sneakers: {formatCurrency(inventoryStats.sneakers.value)}
              </p>
            </div>
            <div className="rounded-xl bg-card border border-border/50 p-5 transition-colors hover:border-border">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Pokémon Value</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-mono font-bold mt-3">{formatCurrency(inventoryStats.pokemon.value)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {inventoryStats.pokemon.units} units · {inventoryStats.pokemon.products} products
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sales KPI Cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4">Sales Performance</h2>
        {loading || !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 p-5 space-y-3">
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
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/50">
            <h3 className="text-sm font-semibold">Recently Added</h3>
          </div>
          <div className="divide-y divide-border/30">
            {inventoryStats.recentProducts.slice(0, 6).map((p, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-surface-800/20 transition-colors">
                <div className="flex items-center gap-3">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-contain bg-surface-850" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-surface-850 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.size ? `Size ${p.size}` : "No size"} · Qty: {p.quantity}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">{formatDateShort(p.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      {loading ? (
        <div className="rounded-xl bg-card border border-border/50 p-6 space-y-4">
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
            <div className="rounded-xl bg-card border border-border/50 p-6 space-y-4">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <TopProducts products={topProducts} />
          )}
        </div>
        <div className="lg:col-span-1">
          {loading || !stats ? (
            <div className="rounded-xl bg-card border border-border/50 p-6 space-y-4">
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
