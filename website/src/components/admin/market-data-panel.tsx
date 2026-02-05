"use client";

import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import type { StockXMarketData } from "@/types/barcode";

interface MarketDataPanelProps {
  data: StockXMarketData | null;
  onSuggestPrice?: (price: number) => void;
}

function formatPrice(value: number | null): string {
  if (value == null) return "--";
  return `$${value.toFixed(0)}`;
}

export function MarketDataPanel({ data, onSuggestPrice }: MarketDataPanelProps) {
  if (!data) return null;

  const allNull =
    data.lastSale == null &&
    data.highestBid == null &&
    data.lowestAsk == null;

  if (allNull) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">
          Market data unavailable for this variant.
        </p>
      </div>
    );
  }

  const suggestedPrice = data.lastSale ?? data.lowestAsk ?? data.highestBid;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">StockX Market Data</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Last Sale</p>
          <p className="mt-1 text-lg font-bold">{formatPrice(data.lastSale)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Highest Bid</p>
          <p className="mt-1 text-lg font-bold text-green-600">
            {formatPrice(data.highestBid)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-xs text-muted-foreground">Lowest Ask</p>
          <p className="mt-1 text-lg font-bold text-red-500">
            {formatPrice(data.lowestAsk)}
          </p>
        </div>
      </div>

      {data.salesLast72Hours != null && (
        <p className="text-xs text-muted-foreground">
          {data.salesLast72Hours} sales in the last 72 hours
        </p>
      )}

      {suggestedPrice != null && onSuggestPrice && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSuggestPrice(suggestedPrice)}
          className="w-full"
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Suggest Price: ${suggestedPrice.toFixed(0)}
        </Button>
      )}
    </div>
  );
}
