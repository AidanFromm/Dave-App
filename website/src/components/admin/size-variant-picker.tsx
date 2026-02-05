"use client";

import { cn } from "@/lib/utils";
import type { StockXVariant } from "@/types/barcode";

interface SizeVariantPickerProps {
  variants: StockXVariant[];
  selectedVariantId: string | null;
  matchedVariantId: string | null;
  onSelect: (variant: StockXVariant) => void;
}

export function SizeVariantPicker({
  variants,
  selectedVariantId,
  matchedVariantId,
  onSelect,
}: SizeVariantPickerProps) {
  if (!variants.length) return null;

  // Sort by numeric size
  const sorted = [...variants].sort((a, b) => {
    const numA = parseFloat(a.size);
    const numB = parseFloat(b.size);
    if (isNaN(numA) || isNaN(numB)) return a.size.localeCompare(b.size);
    return numA - numB;
  });

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Size{" "}
        {matchedVariantId && (
          <span className="font-normal text-green-600">(auto-detected from barcode)</span>
        )}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((v) => {
          const isSelected = v.id === selectedVariantId;
          const isMatched = v.id === matchedVariantId;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : isMatched
                  ? "border-green-500 bg-green-500/10 text-green-700"
                  : "border-border bg-card text-foreground hover:border-muted-foreground"
              )}
            >
              {v.size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
