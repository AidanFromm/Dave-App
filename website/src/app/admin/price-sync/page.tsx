"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Minus, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

interface PriceProduct {
  id: string;
  name: string;
  sku: string;
  sell_price: number;
  market_price: number | null;
  last_price_sync: string | null;
}

interface SyncResult {
  id: string;
  name: string;
  status: string;
  old_price: number | null;
  new_price: number | null;
  change_pct: string | null;
}

export default function AdminPriceSyncPage() {
  const [products, setProducts] = useState<PriceProduct[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/price-sync");
      const data = await res.json();
      setProducts(data.products ?? []);
      setLastSync(data.last_sync);
    } catch {
      toast.error("Failed to load price data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResults(null);
    try {
      const res = await fetch("/api/admin/price-sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSyncResults(data.results ?? []);
      toast.success(`Synced ${data.synced} of ${data.total} products`);
      await fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  const getMarginClass = (sell: number, market: number | null) => {
    if (!market) return "text-muted-foreground";
    const margin = ((sell - market) / market) * 100;
    if (margin > 10) return "text-green-400";
    if (margin > 0) return "text-green-300";
    if (margin > -10) return "text-yellow-400";
    return "text-red-400";
  };

  const getMarginText = (sell: number, market: number | null) => {
    if (!market) return "--";
    const margin = ((sell - market) / market) * 100;
    return `${margin >= 0 ? "+" : ""}${margin.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            StockX Price Sync
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare your prices against StockX market data
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-lg bg-[#FB4F14] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#FB4F14]/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {/* Last Sync Info */}
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-5 py-4">
        <Clock className="h-5 w-5 text-[#FB4F14]" />
        <div>
          <p className="text-sm font-medium">Last Sync</p>
          <p className="text-xs text-muted-foreground">
            {lastSync ? new Date(lastSync).toLocaleString() : "Never synced"}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-medium">{products.length} Products</p>
          <p className="text-xs text-muted-foreground">with market data</p>
        </div>
      </div>

      {/* Sync Results */}
      {syncResults && syncResults.length > 0 && (
        <div className="rounded-xl border border-[#FB4F14]/30 bg-[#FB4F14]/5 p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FB4F14]">
            Sync Results
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {syncResults.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                <span className="truncate max-w-[300px]">{r.name}</span>
                <div className="flex items-center gap-3">
                  {r.status === "synced" ? (
                    <>
                      <span className="text-muted-foreground">
                        {r.old_price ? formatCurrency(r.old_price) : "--"}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">
                        {r.new_price ? formatCurrency(r.new_price) : "--"}
                      </span>
                      {r.change_pct && (
                        <span className={`text-xs font-mono ${parseFloat(r.change_pct) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {parseFloat(r.change_pct) >= 0 ? "+" : ""}{r.change_pct}%
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground capitalize">{r.status.replace("_", " ")}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Your Price</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Market Price</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Margin</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Last Synced</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <DollarSign className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No market data yet. Run a sync to get started.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-border/30 last:border-0 hover:bg-surface-800/20 transition-colors">
                      <td className="px-4 py-3 font-medium truncate max-w-[250px]">{p.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{p.sku ?? "--"}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(p.sell_price)}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {p.market_price ? formatCurrency(p.market_price) : "--"}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${getMarginClass(p.sell_price, p.market_price)}`}>
                        <span className="flex items-center justify-end gap-1">
                          {p.market_price && p.sell_price > p.market_price && <ArrowUpRight className="h-3.5 w-3.5" />}
                          {p.market_price && p.sell_price < p.market_price && <ArrowDownRight className="h-3.5 w-3.5" />}
                          {getMarginText(p.sell_price, p.market_price)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {p.last_price_sync ? new Date(p.last_price_sync).toLocaleDateString() : "--"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
