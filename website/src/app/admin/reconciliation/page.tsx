"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  brand: string | null;
  images: string[];
}

interface Reconciliation {
  id: string;
  product_id: string;
  expected_qty: number;
  actual_qty: number;
  discrepancy: number;
  resolved: boolean;
  resolved_by: string | null;
  notes: string | null;
  created_at: string;
}

export default function ReconciliationPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [tab, setTab] = useState<"count" | "history">("count");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/reconciliation");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.products);
      setReconciliations(data.reconciliations);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitCount = async (product: ProductRow) => {
    const actualStr = counts[product.id];
    if (!actualStr || actualStr.trim() === "") {
      toast.error("Enter an actual count");
      return;
    }
    const actual = parseInt(actualStr, 10);
    if (isNaN(actual) || actual < 0) {
      toast.error("Invalid count");
      return;
    }

    setSubmitting(product.id);
    try {
      const res = await fetch("/api/admin/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          expected_qty: product.quantity,
          actual_qty: actual,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Count recorded for ${product.name}`);
      setCounts((prev) => ({ ...prev, [product.id]: "" }));
      await fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit count");
    } finally {
      setSubmitting(null);
    }
  };

  const handleResolve = async (rec: Reconciliation, adjustInventory: boolean) => {
    setResolving(rec.id);
    try {
      const res = await fetch("/api/admin/reconciliation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: rec.id,
          resolved: true,
          resolved_by: user?.id,
          adjust_inventory: adjustInventory,
          product_id: rec.product_id,
          actual_qty: rec.actual_qty,
          notes: adjustInventory ? "Inventory adjusted to match actual count" : "Discrepancy acknowledged",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(adjustInventory ? "Inventory adjusted and resolved" : "Marked as resolved");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to resolve");
    } finally {
      setResolving(null);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const unresolvedRecs = reconciliations.filter((r) => !r.resolved && r.discrepancy !== 0);
  const productMap = new Map(products.map((p) => [p.id, p]));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Inventory Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare expected vs actual inventory counts and resolve discrepancies
          </p>
        </div>
        {unresolvedRecs.length > 0 && (
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {unresolvedRecs.length} unresolved
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("count")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            tab === "count"
              ? "bg-primary text-white"
              : "bg-surface-800/50 text-muted-foreground hover:text-foreground"
          )}
        >
          Count Inventory
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-semibold transition-colors relative",
            tab === "history"
              ? "bg-primary text-white"
              : "bg-surface-800/50 text-muted-foreground hover:text-foreground"
          )}
        >
          Discrepancies
          {unresolvedRecs.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
              {unresolvedRecs.length}
            </span>
          )}
        </button>
      </div>

      {tab === "count" && (
        <>
          {/* Search */}
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-surface-800/50 border-surface-700/50"
            />
          </div>

          {/* Product count table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-800/30">
                  <th className="text-left p-3 font-semibold">Product</th>
                  <th className="text-left p-3 font-semibold">SKU</th>
                  <th className="text-center p-3 font-semibold">Expected Qty</th>
                  <th className="text-center p-3 font-semibold">Actual Count</th>
                  <th className="text-center p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-surface-800/20">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">
                      {product.sku ?? "--"}
                    </td>
                    <td className="p-3 text-center font-mono font-bold">
                      {product.quantity}
                    </td>
                    <td className="p-3 text-center">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={counts[product.id] ?? ""}
                        onChange={(e) =>
                          setCounts((prev) => ({ ...prev, [product.id]: e.target.value }))
                        }
                        className="w-20 mx-auto text-center bg-surface-800/50 border-surface-700/50 h-8"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmitCount(product)}
                        disabled={submitting === product.id}
                      >
                        {submitting === product.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {reconciliations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No reconciliation records yet</p>
            </div>
          ) : (
            reconciliations.map((rec) => {
              const product = productMap.get(rec.product_id);
              const isDiscrepancy = rec.discrepancy !== 0;
              return (
                <div
                  key={rec.id}
                  className={cn(
                    "rounded-lg border p-4",
                    rec.resolved
                      ? "border-border bg-card"
                      : isDiscrepancy
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-green-500/30 bg-green-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{product?.name ?? "Unknown Product"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(rec.created_at).toLocaleString()}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>Expected: <strong>{rec.expected_qty}</strong></span>
                        <span>Actual: <strong>{rec.actual_qty}</strong></span>
                        <span className={cn(
                          "font-bold",
                          rec.discrepancy > 0 ? "text-green-500" : rec.discrepancy < 0 ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {rec.discrepancy > 0 ? "+" : ""}{rec.discrepancy}
                        </span>
                      </div>
                      {rec.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{rec.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {rec.resolved ? (
                        <Badge className="bg-green-500/10 text-green-500 border-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : isDiscrepancy ? (
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleResolve(rec, true)}
                            disabled={resolving === rec.id}
                            className="bg-primary hover:bg-primary/90 text-xs"
                          >
                            {resolving === rec.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 mr-1" />
                            )}
                            Adjust Inventory
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(rec, false)}
                            disabled={resolving === rec.id}
                            className="text-xs"
                          >
                            Acknowledge
                          </Button>
                        </div>
                      ) : (
                        <Badge className="bg-green-500/10 text-green-500 border-0">
                          Match
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
