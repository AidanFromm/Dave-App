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

// Size categories for sneakers
type SizeCategory = "mens" | "womens" | "gradeSchool" | "preschool" | "toddler" | "crib";

const SIZE_CATEGORIES: Record<SizeCategory, { label: string; sizes: string[] }> = {
  mens: {
    label: "Men's",
    sizes: [
      "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5",
      "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5",
      "12", "12.5", "13", "13.5", "14", "15", "16", "17", "18",
    ],
  },
  womens: {
    label: "Women's",
    sizes: [
      "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5",
      "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14",
    ],
  },
  gradeSchool: {
    label: "Grade School",
    sizes: ["3.5Y", "4Y", "4.5Y", "5Y", "5.5Y", "6Y", "6.5Y", "7Y"],
  },
  preschool: {
    label: "Preschool",
    sizes: [
      "10.5C", "11C", "11.5C", "12C", "12.5C", "13C", "13.5C",
      "1Y", "1.5Y", "2Y", "2.5Y", "3Y",
    ],
  },
  toddler: {
    label: "Toddler",
    sizes: ["2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C"],
  },
  crib: {
    label: "Crib",
    sizes: ["0C", "1C", "2C", "3C", "4C"],
  },
};

// Legacy - for backward compatibility
const COMMON_SIZES = SIZE_CATEGORIES.mens.sizes;

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
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>("mens");
  const [customSize, setCustomSize] = useState("");

  const existingSizes = new Set(variants.map((v) => v.size));
  const currentSizes = SIZE_CATEGORIES[sizeCategory].sizes;

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

  const addAllSizesInCategory = () => {
    const newVariants = currentSizes.filter((s) => !existingSizes.has(s)).map(
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

  const addCustomSize = () => {
    if (!customSize.trim() || existingSizes.has(customSize.trim())) return;
    addSize(customSize.trim());
    setCustomSize("");
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Add Sizes</p>
          <Button size="sm" variant="outline" onClick={addAllSizesInCategory} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add All {SIZE_CATEGORIES[sizeCategory].label}
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
          {(Object.keys(SIZE_CATEGORIES) as SizeCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSizeCategory(cat)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                sizeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {SIZE_CATEGORIES[cat].label}
            </button>
          ))}
        </div>

        {/* Size Buttons for Selected Category */}
        <div className="flex flex-wrap gap-1.5">
          {currentSizes.map((size) => {
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

        {/* Custom Size Input */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            type="text"
            placeholder="Custom size (e.g. 15.5)"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
            className="h-8 text-sm max-w-[200px]"
          />
          <Button size="sm" variant="outline" onClick={addCustomSize} className="h-8 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add Custom
          </Button>
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
