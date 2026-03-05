"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanStatusBadge } from "./scan-status-badge";
import { Check, X, DollarSign, Clock, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Scan {
  id: string;
  upc: string;
  product_name: string | null;
  product_image: string | null;
  suggested_price: number | null;
  final_price: number | null;
  status: "pending" | "priced" | "dismissed";
  created_at: string;
  user_id: string;
}

interface ScanCardProps {
  scan: Scan;
  onPrice: (id: string, price: number) => void;
  onDismiss: (id: string) => void;
}

export function ScanCard({ scan, onPrice, onDismiss }: ScanCardProps) {
  const [price, setPrice] = useState(
    scan.final_price?.toString() ?? scan.suggested_price?.toString() ?? ""
  );
  const [submitting, setSubmitting] = useState(false);

  const isPending = scan.status === "pending";
  const timeAgo = getTimeAgo(scan.created_at);

  async function handlePrice() {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) return;
    setSubmitting(true);
    await onPrice(scan.id, numPrice);
    setSubmitting(false);
  }

  async function handleDismiss() {
    setSubmitting(true);
    await onDismiss(scan.id);
    setSubmitting(false);
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        isPending
          ? "border-yellow-500/30 bg-surface-900 shadow-lg shadow-yellow-500/5 animate-in slide-in-from-top-2 duration-300"
          : scan.status === "priced"
          ? "border-green-500/20 bg-surface-950 opacity-75"
          : "border-surface-800 bg-surface-950 opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ScanStatusBadge status={scan.status} />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Barcode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-sm text-foreground">{scan.upc}</span>
          </div>

          {scan.product_name && (
            <p className="mt-1 text-sm font-medium text-foreground truncate">
              {scan.product_name}
            </p>
          )}

          {scan.suggested_price != null && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Suggested: ${scan.suggested_price.toFixed(2)}
            </p>
          )}
        </div>

        {scan.product_image && (
          <img
            src={scan.product_image}
            alt=""
            className="h-16 w-16 rounded-lg object-cover border border-surface-800 flex-shrink-0"
          />
        )}
      </div>

      {isPending && (
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="Set price..."
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePrice();
              }}
              className="pl-9 h-10 font-mono"
              disabled={submitting}
            />
          </div>
          <Button
            size="sm"
            onClick={handlePrice}
            disabled={submitting || !price || isNaN(parseFloat(price))}
            className="h-10 bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            Price
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            disabled={submitting}
            className="h-10 text-muted-foreground hover:text-red-400"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {scan.status === "priced" && scan.final_price != null && (
        <div className="mt-2 flex items-center gap-1 text-green-400 text-sm font-medium">
          <DollarSign className="h-4 w-4" />
          {scan.final_price.toFixed(2)}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
