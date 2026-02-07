"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { ScanResult } from "@/types/barcode";

interface ScanResultCardProps {
  result: ScanResult;
}

export function ScanResultCard({ result }: ScanResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sourceBadge = {
    local_cache: { label: "Local Cache", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    stockx: { label: "StockX", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    manual: { label: "Manual", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  }[result.source];

  const hasImage = result.imageUrl && !imageError;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Product image - larger, top section */}
      <div className="relative aspect-square w-full bg-gradient-to-br from-muted to-muted/50">
        {hasImage ? (
          <>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}
            <img
              src={result.imageUrl!}
              alt={result.productName}
              className={`h-full w-full object-contain p-4 transition-opacity duration-300 ${
                imageLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Package className="h-12 w-12" />
            <span className="text-sm">No image available</span>
          </div>
        )}
        {/* Source badge overlay */}
        <Badge 
          variant="outline" 
          className={`absolute right-3 top-3 ${sourceBadge.className}`}
        >
          {sourceBadge.label}
        </Badge>
      </div>

      {/* Product info - bottom section */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold leading-tight">
            {result.productName}
          </h3>
          {result.brand && (
            <p className="text-sm text-muted-foreground">{result.brand}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {result.colorway && (
            <Badge variant="secondary" className="text-xs">
              {result.colorway}
            </Badge>
          )}
          {result.styleId && (
            <Badge variant="secondary" className="text-xs font-mono">
              {result.styleId}
            </Badge>
          )}
          {result.size && (
            <Badge className="bg-primary text-xs">
              Size {result.size}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          {result.retailPrice != null && result.retailPrice > 0 && (
            <p className="text-sm">
              Retail: <span className="font-semibold">${result.retailPrice}</span>
            </p>
          )}
          <p className="font-mono text-xs text-muted-foreground">
            {result.barcode}
          </p>
        </div>
      </div>
    </div>
  );
}
