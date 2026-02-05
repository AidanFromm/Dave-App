"use client";

import { Badge } from "@/components/ui/badge";
import type { ScanResult } from "@/types/barcode";

interface ScanResultCardProps {
  result: ScanResult;
}

export function ScanResultCard({ result }: ScanResultCardProps) {
  const sourceBadge = {
    local_cache: { label: "Local Cache", className: "bg-green-500/10 text-green-600 border-green-500/20" },
    stockx: { label: "StockX", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    manual: { label: "Manual", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  }[result.source];

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-4">
      {/* Product image */}
      {result.imageUrl ? (
        <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <img
            src={result.imageUrl}
            alt={result.productName}
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
          <span className="text-xs text-muted-foreground">No image</span>
        </div>
      )}

      {/* Product info */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold leading-tight">
            {result.productName}
          </h3>
          <Badge variant="outline" className={sourceBadge.className}>
            {sourceBadge.label}
          </Badge>
        </div>

        {result.brand && (
          <p className="text-sm text-muted-foreground">{result.brand}</p>
        )}

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
            <Badge variant="outline" className="text-xs">
              Size {result.size}
            </Badge>
          )}
        </div>

        {result.retailPrice != null && result.retailPrice > 0 && (
          <p className="text-sm">
            Retail:{" "}
            <span className="font-medium">
              ${result.retailPrice.toFixed(2)}
            </span>
          </p>
        )}

        <p className="font-mono text-xs text-muted-foreground">
          Barcode: {result.barcode}
        </p>
      </div>
    </div>
  );
}
