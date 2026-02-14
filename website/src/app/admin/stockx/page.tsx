"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  STOCKX_AUTH_URL,
  STOCKX_REDIRECT_URI,
  STOCKX_AUDIENCE,
} from "@/lib/constants";

interface StockXProduct {
  id: string;
  name: string;
  brand: string;
  colorway: string;
  styleId: string;
  retailPrice: number;
  thumbnailUrl: string;
}

export default function StockXPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockXProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/stockx/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.products ?? []);
      }
    } catch {
      setError("Search failed");
      toast.error("StockX search failed");
    }
    setLoading(false);
  };

  const connectStockX = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("stockx_state", state);

    const clientId = process.env.NEXT_PUBLIC_STOCKX_CLIENT_ID ?? "";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: STOCKX_REDIRECT_URI,
      scope: "offline_access openid",
      audience: STOCKX_AUDIENCE,
      state,
    });

    window.location.href = `${STOCKX_AUTH_URL}?${params}`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">StockX Integration</h1>
        <Button variant="outline" onClick={connectStockX}>
          <ExternalLink className="mr-2 h-4 w-4" /> Connect StockX
        </Button>
      </div>

      {/* Search */}
      <div className="mt-6 flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search by name or barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6 space-y-3">
          {results.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
            >
              {product.thumbnailUrl && (
                <img
                  src={product.thumbnailUrl}
                  alt={product.name}
                  className="h-16 w-16 rounded-md object-contain bg-white p-1"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.brand} · {product.colorway}
                </p>
                <div className="mt-1 flex gap-2">
                  {product.styleId && (
                    <Badge variant="secondary" className="text-xs">
                      {product.styleId}
                    </Badge>
                  )}
                  {product.retailPrice > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Retail: ${product.retailPrice}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Pre-fill product form with StockX data
                  const params = new URLSearchParams({
                    name: product.name,
                    brand: product.brand,
                    colorway: product.colorway,
                    sku: product.styleId,
                    price: String(product.retailPrice),
                  });
                  window.location.href = `/admin/products/new?${params}`;
                }}
              >
                Use
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
