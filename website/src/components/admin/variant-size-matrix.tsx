"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ProductVariant, VariantCondition } from "@/types/product";
import { VARIANT_CONDITION_LABELS, VARIANT_CONDITIONS } from "@/types/product";
import { Plus, Trash2, Zap, DollarSign, Package } from "lucide-react";
import { cn } from "@/lib/utils";

// Common US sneaker sizes (4–15 including halves)
const COMMON_SIZES = [
  "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5",
  "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5",
  "12", "12.5", "13", "13.5", "14", "14.5", "15",
];

export interface VariantRow {
  id?: string; // existing variant ID
  size: string;
  condition: VariantCondition;
  price: number;
  cost: number;
  quantity: number;
  barcode: string;
  isNew?: boolean; // true if not yet saved
}

interface VariantSizeMatrixProps {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}

export function VariantSizeMatrix({ variants, onChange }: VariantSizeMatrixProps) {
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkCost, setBulkCost] = useState("");
  const [bulkQty, setBulkQty] = useState("");
  const [bulkCondition, setBulkCondition] = useState<VariantCondition>("DS");

  const existingSizes = new Set(variants.map((v) => v.size));

  const addSize = (size: string) => {
    if (existingSizes.has(size)) return;
    onChange([
      ...variants,
      {
        size,
        condition: bulkCondition,
        price: bulkPrice ? parseFloat(bulkPrice) : 0,
        cost: bulkCost ? parseFloat(bulkCost) : 0,
        quantity: bulkQty ? parseInt(bulkQty) : 1,
        barcode: "",
        isNew: true,
      },
    ]);
  };

  const addAllCommonSizes = () => {
    const newVariants = COMMON_SIZES.filter((s) => !existingSizes.has(s)).map(
      (size) => ({
        size,
        condition: bulkCondition,
        price: bulkPrice ? parseFloat(bulkPrice) : 0,
        cost: bulkCost ? parseFloat(bulkCost) : 0,
        quantity: bulkQty ? parseInt(bulkQty) : 1,
        barcode: "",
        isNew: true,
      })
    );
    onChange([...variants, ...newVariants]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: string | number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const setAllPrices = () => {
    if (!bulkPrice) return;
    const price = parseFloat(bulkPrice);
    onChange(variants.map((v) => ({ ...v, price })));
  };

  const setAllCosts = () => {
    if (!bulkCost) return;
    const cost = parseFloat(bulkCost);
    onChange(variants.map((v) => ({ ...v, cost })));
  };

  const setAllQuantities = () => {
    if (!bulkQty) return;
    const quantity = parseInt(bulkQty);
    onChange(variants.map((v) => ({ ...v, quantity })));
  };

  const setAllConditions = () => {
    onChange(variants.map((v) => ({ ...v, condition: bulkCondition })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Package className="h-4 w-4" />
          Size Variants
          <Badge variant="secondary">{variants.length}</Badge>
        </h2>
      </div>

      {/* Bulk Controls */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bulk Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Default Price</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={setAllPrices} title="Apply to all">
                <DollarSign className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Cost</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bulkCost}
                onChange={(e) => setBulkCost(e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={setAllCosts} title="Apply to all">
                <DollarSign className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Qty</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="1"
                value={bulkQty}
                onChange={(e) => setBulkQty(e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={setAllQuantities} title="Apply to all">
                <Zap className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Condition</Label>
            <div className="flex gap-1">
              <Select value={bulkCondition} onValueChange={(v) => setBulkCondition(v as VariantCondition)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIANT_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8 px-2 shrink-0" onClick={setAllConditions} title="Apply to all">
                <Zap className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick-add sizes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Add Sizes</p>
          <Button size="sm" variant="outline" onClick={addAllCommonSizes} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add All Sizes (4–15)
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_SIZES.map((size) => {
            const exists = existingSizes.has(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => addSize(size)}
                disabled={exists}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  exists
                    ? "border-primary bg-primary/10 text-primary cursor-default"
                    : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Variant Rows */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_100px_100px_70px_120px_32px] gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span>Size</span>
            <span>Condition</span>
            <span>Price</span>
            <span>Cost</span>
            <span>Qty</span>
            <span>Barcode</span>
            <span></span>
          </div>

          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {variants.map((v, i) => (
              <div
                key={v.id ?? `new-${v.size}-${i}`}
                className={cn(
                  "grid grid-cols-[60px_1fr_100px_100px_70px_120px_32px] gap-2 items-center rounded-lg border p-2",
                  v.isNew ? "border-primary/30 bg-primary/5" : "border-border"
                )}
              >
                <span className="text-sm font-bold">{v.size}</span>
                <Select
                  value={v.condition}
                  onValueChange={(val) => updateVariant(i, "condition", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VARIANT_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  value={v.price || ""}
                  onChange={(e) => updateVariant(i, "price", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                  placeholder="0.00"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={v.cost || ""}
                  onChange={(e) => updateVariant(i, "cost", parseFloat(e.target.value) || 0)}
                  className="h-8 text-sm"
                  placeholder="0.00"
                />
                <Input
                  type="number"
                  value={v.quantity}
                  onChange={(e) => updateVariant(i, "quantity", parseInt(e.target.value) || 0)}
                  className="h-8 text-sm"
                />
                <Input
                  value={v.barcode}
                  onChange={(e) => updateVariant(i, "barcode", e.target.value)}
                  className="h-8 text-sm"
                  placeholder="UPC"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeVariant(i)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {variants.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No size variants yet. Click sizes above to add them, or use &quot;Add All Sizes&quot;.
        </div>
      )}
    </div>
  );
}
