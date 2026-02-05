"use client";

import { useEffect, useState, useCallback } from "react";
import { Product } from "@/types/product";
import { getInventoryList } from "@/actions/admin";
import { InventoryTable } from "@/components/admin/inventory-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Package } from "lucide-react";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getInventoryList();
      setProducts(data as Product[]);
    } catch {
      console.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Manage product stock levels
            </p>
          </div>
          {!loading && (
            <Badge variant="secondary" className="text-sm">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {/* Search skeleton */}
          <Skeleton className="h-10 w-80" />
          {/* Table skeleton */}
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted/50 px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[600px]" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3 border-t"
              >
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-4 flex-1 max-w-[150px]" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">No products found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add products to start managing inventory.
          </p>
        </div>
      ) : (
        <InventoryTable products={products} onRefresh={handleRefresh} />
      )}
    </div>
  );
}
