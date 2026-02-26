"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ScanOut } from "@/components/admin/scan-out";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ScanBarcode,
  Search,
  Package,
  ImageOff,
  DollarSign,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

type POSMode = "scan" | "inventory";

interface InventoryProduct {
  id: string;
  name: string;
  brand: string | null;
  size: string | null;
  condition: string | null;
  cost: number;
  price: number;
  quantity: number;
  image_urls: string[] | null;
  barcode: string | null;
}

export default function POSPage() {
  const [mode, setMode] = useState<POSMode>("scan");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Search inventory
  const searchInventory = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/admin/products?search=${encodeURIComponent(query)}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || data || []);
      }
    } catch {
      // silent
    }
    setSearching(false);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInventory(value), 300);
  };

  // When selecting a product from inventory, switch to scan mode with that product
  const handleSelectProduct = (product: InventoryProduct) => {
    // Use the barcode search endpoint that ScanOut uses internally
    // We'll trigger a scan with the product's barcode or ID
    const barcode = product.barcode || product.id;
    setMode("scan");
    // Store selected product for ScanOut to pick up
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pos-product-selected", {
        detail: { barcode, product }
      }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-base text-muted-foreground">
          Scan product, search inventory, collect payment
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("scan")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-base font-bold transition-all",
            mode === "scan"
              ? "border-[#002244] bg-[#002244] text-white"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30"
          )}
        >
          <ScanBarcode className="h-5 w-5" />
          Scan / Camera
        </button>
        <button
          onClick={() => setMode("inventory")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-base font-bold transition-all",
            mode === "inventory"
              ? "border-[#FB4F14] bg-[#FB4F14] text-white"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30"
          )}
        >
          <Search className="h-5 w-5" />
          Search Inventory
        </button>
      </div>

      {/* Scan Mode */}
      {mode === "scan" && <ScanOut />}

      {/* Inventory Search Mode */}
      {mode === "inventory" && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by product name, brand, or barcode..."
              className="h-14 pl-12 text-lg bg-card border-2 border-border rounded-xl focus:border-[#FB4F14]"
              autoFocus
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Results */}
          {searching && !searchResults.length && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                  <Skeleton className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          )}

          {!searching && hasSearched && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
              <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No products found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
            </div>
          )}

          {!searching && !hasSearched && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
              <DollarSign className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Search your inventory to start a sale</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Type a product name, brand, or barcode</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </p>
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="flex w-full items-center gap-4 rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-[#FB4F14]/50 hover:bg-[#FB4F14]/5"
                >
                  {/* Image */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    {product.image_urls?.[0] ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {product.brand && (
                        <span className="text-xs text-muted-foreground">{product.brand}</span>
                      )}
                      {product.size && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Size {product.size}
                        </Badge>
                      )}
                      {product.condition && product.condition !== "new" && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-500">
                          Preowned
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Qty: {product.quantity}</span>
                      {product.barcode && (
                        <span className="font-mono">{product.barcode}</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
                    {product.cost > 0 && (
                      <p className="text-[10px] text-muted-foreground">Cost: {formatCurrency(product.cost)}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
