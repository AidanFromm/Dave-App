"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "./image-upload";
import { toast } from "sonner";
import { SEALED_PRODUCT_TYPES, type SealedProductType, type ScanFormData } from "@/types/barcode";

interface SealedProductFormProps {
  onSubmit: (data: ScanFormData) => Promise<void>;
  onBack: () => void;
}

export function SealedProductForm({ onSubmit, onBack }: SealedProductFormProps) {
  const [productName, setProductName] = useState("");
  const [setSeries, setSetSeries] = useState("");
  const [sealedType, setSealedType] = useState<SealedProductType>("booster_box");
  const [condition, setCondition] = useState<"sealed" | "opened">("sealed");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    const costNum = parseFloat(cost);
    const qty = parseInt(quantity, 10) || 1;
    const typeLabel = SEALED_PRODUCT_TYPES.find((t) => t.value === sealedType)?.label ?? sealedType;

    setSubmitting(true);
    try {
      await onSubmit({
        barcode: `sealed-${Date.now()}`,
        productName: `${productName.trim()} [${typeLabel}]`,
        brand: "Pokemon TCG",
        colorway: null,
        styleId: null,
        size: null,
        stockxProductId: null,
        stockxVariantId: null,
        condition: condition === "sealed" ? "new" : "used_like_new",
        hasBox: true,
        cost: isNaN(costNum) ? 0 : costNum,
        price: priceNum,
        images,
        productType: "pokemon_sealed",
        sealedType,
        quantity: qty,
      });
      toast.success(`${productName} added to inventory!`);
    } catch {
      toast.error("Failed to add sealed product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back
      </button>

      <div>
        <h2 className="text-xl font-bold">Add Sealed Product</h2>
        <p className="text-sm text-muted-foreground">
          Booster boxes, ETBs, tins, and other sealed Pokemon products
        </p>
      </div>

      {/* Product Name */}
      <div className="space-y-2">
        <Label>Product Name *</Label>
        <Input
          placeholder="e.g. Scarlet & Violet 151 Booster Box"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="text-lg"
        />
      </div>

      {/* Set/Series */}
      <div className="space-y-2">
        <Label>Set / Series</Label>
        <Input
          placeholder="e.g. Scarlet & Violet 151, Obsidian Flames"
          value={setSeries}
          onChange={(e) => setSetSeries(e.target.value)}
        />
      </div>

      {/* Product Type */}
      <div className="space-y-2">
        <Label>Product Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SEALED_PRODUCT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSealedType(type.value)}
              className={cn(
                "rounded-lg border-2 px-3 py-3 text-center transition-colors",
                sealedType === type.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <p className="text-sm font-semibold">{type.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label>Condition</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCondition("sealed")}
            className={cn(
              "rounded-lg border-2 px-4 py-3 text-center transition-colors",
              condition === "sealed"
                ? "border-green-500 bg-green-500/10 text-green-600"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <p className="text-sm font-semibold">Sealed</p>
            <p className="text-xs text-muted-foreground">Factory sealed, unopened</p>
          </button>
          <button
            type="button"
            onClick={() => setCondition("opened")}
            className={cn(
              "rounded-lg border-2 px-4 py-3 text-center transition-colors",
              condition === "opened"
                ? "border-amber-500 bg-amber-500/10 text-amber-600"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <p className="text-sm font-semibold">Opened</p>
            <p className="text-xs text-muted-foreground">Previously opened</p>
          </button>
        </div>
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label>Photos</Label>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      {/* Pricing + Quantity */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Cost (each)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="text-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Selling Price *</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="text-lg font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="text-lg"
          />
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Add Sealed Product to Inventory
      </Button>
    </div>
  );
}
