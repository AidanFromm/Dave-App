"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

interface StockXSearchResult {
  id: string;
  name: string;
  brand: string;
  colorway: string;
  styleId: string;
  retailPrice: number;
  thumbnailUrl: string;
  imageUrl: string;
}

interface StockXSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: StockXSearchResult) => void;
  initialQuery?: string;
}

export function StockXSearchModal({
  open,
  onClose,
  onSelect,
  initialQuery = "",
}: StockXSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StockXSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens with new query
  useEffect(() => {
    if (open && initialQuery) {
      setQuery(initialQuery);
      setResults([]);
      setError("");
    }
  }, [open, initialQuery]);

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
        if ((data.products ?? []).length === 0) {
          setError("No products found. Try a different search term.");
        }
      }
    } catch {
      setError("Search failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Search StockX</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search by name, style ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="max-h-96 space-y-2 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
            >
              {(product.imageUrl || product.thumbnailUrl) && (
                <img
                  src={product.imageUrl || product.thumbnailUrl}
                  alt={product.name}
                  className="h-14 w-14 rounded-md object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.brand}
                  {product.colorway ? ` · ${product.colorway}` : ""}
                </p>
                <div className="mt-1 flex gap-1.5">
                  {product.styleId && (
                    <Badge variant="secondary" className="text-[10px]">
                      {product.styleId}
                    </Badge>
                  )}
                  {product.retailPrice > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      ${product.retailPrice}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                Select
              </Button>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
