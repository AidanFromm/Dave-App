"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { AdjustmentReason, ADJUSTMENT_REASON_LABELS } from "@/types/admin";
import { adjustStock } from "@/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Reasons available for manual admin adjustments
const MODAL_REASONS: AdjustmentReason[] = [
  "restocked",
  "sold_instore",
  "damaged",
  "returned",
  "adjustment",
];

interface StockAdjustModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjusted: () => void;
}

export function StockAdjustModal({
  product,
  open,
  onOpenChange,
  onAdjusted,
}: StockAdjustModalProps) {
  const [reason, setReason] = useState<AdjustmentReason | "">("");
  const [quantityChange, setQuantityChange] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const parsedChange = parseInt(quantityChange, 10);
  const isValidChange = !isNaN(parsedChange) && parsedChange !== 0;
  const newQuantity = isValidChange
    ? product.quantity + parsedChange
    : product.quantity;

  const canSubmit = reason !== "" && isValidChange && newQuantity >= 0;

  const handleSubmit = async () => {
    if (!canSubmit || !reason) return;

    setLoading(true);
    try {
      await adjustStock(
        product.id,
        parsedChange,
        reason,
        notes.trim() || undefined
      );
      toast.success(
        `Stock updated: ${product.name} (${product.quantity} -> ${newQuantity})`
      );
      // Reset form
      setReason("");
      setQuantityChange("");
      setNotes("");
      onOpenChange(false);
      onAdjusted();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to adjust stock"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset form when closing
      setReason("");
      setQuantityChange("");
      setNotes("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock &mdash; {product.name}</DialogTitle>
          <DialogDescription>
            Modify the inventory quantity for this product.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Quantity */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
            <span className="text-sm text-muted-foreground">
              Current Quantity
            </span>
            <span className="text-lg font-semibold font-mono">
              {product.quantity}
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Select
              value={reason}
              onValueChange={(val) => setReason(val as AdjustmentReason)}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {MODAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ADJUSTMENT_REASON_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity Change */}
          <div className="space-y-2">
            <Label htmlFor="quantity-change">Quantity Change</Label>
            <Input
              id="quantity-change"
              type="number"
              placeholder="e.g. +5 or -2"
              value={quantityChange}
              onChange={(e) => setQuantityChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Use positive numbers to add stock, negative to remove.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Preview */}
          {isValidChange && (
            <div
              className={`flex items-center justify-between rounded-lg border p-3 ${
                newQuantity < 0
                  ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                  : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
              }`}
            >
              <span className="text-sm font-medium">Preview</span>
              <span className="text-sm font-mono">
                Previous: {product.quantity} &rarr; New:{" "}
                <span
                  className={
                    newQuantity < 0
                      ? "text-red-600 dark:text-red-400 font-bold"
                      : "font-bold"
                  }
                >
                  {newQuantity}
                </span>
              </span>
            </div>
          )}

          {newQuantity < 0 && isValidChange && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Warning: New quantity would be negative. This is not allowed.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
