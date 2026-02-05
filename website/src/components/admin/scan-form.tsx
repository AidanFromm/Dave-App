"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "./image-upload";
import { SizeVariantPicker } from "./size-variant-picker";
import { MarketDataPanel } from "./market-data-panel";
import type {
  ScanResult,
  StockXVariant,
  StockXMarketData,
  ScanFormData,
} from "@/types/barcode";
import type { ProductCondition } from "@/types/product";
import { toast } from "sonner";

interface ScanFormProps {
  result: ScanResult;
  onSubmit: (data: ScanFormData) => Promise<void>;
  onMarketDataFetch?: (
    productId: string,
    variantId: string
  ) => Promise<StockXMarketData | null>;
}

const CONDITIONS: { value: ProductCondition; label: string; sub?: string }[] = [
  { value: "new", label: "New" },
  { value: "used_like_new", label: "Used", sub: "Like New" },
  { value: "used_good", label: "Used", sub: "Good" },
  { value: "used_fair", label: "Used", sub: "Fair" },
];

export function ScanForm({ result, onSubmit, onMarketDataFetch }: ScanFormProps) {
  const [condition, setCondition] = useState<ProductCondition>("new");
  const [hasBox, setHasBox] = useState(true);
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>(
    result.imageUrls.length > 0 ? result.imageUrls : []
  );
  const [selectedVariant, setSelectedVariant] = useState<StockXVariant | null>(
    () => {
      if (!result.stockxVariantId || !result.variants.length) return null;
      return (
        result.variants.find((v) => v.id === result.stockxVariantId) ?? null
      );
    }
  );
  const [selectedSize, setSelectedSize] = useState(result.size ?? "");
  const [marketData, setMarketData] = useState<StockXMarketData | null>(
    result.marketData
  );
  const [submitting, setSubmitting] = useState(false);
  const [productName, setProductName] = useState(result.productName);

  const isUsed = condition !== "new";

  const handleVariantSelect = async (variant: StockXVariant) => {
    setSelectedVariant(variant);
    setSelectedSize(variant.size);

    // Fetch market data for this variant
    if (result.stockxProductId && onMarketDataFetch) {
      const data = await onMarketDataFetch(result.stockxProductId, variant.id);
      setMarketData(data);
    }
  };

  const handleConditionChange = (c: ProductCondition) => {
    setCondition(c);
    // If switching to new, restore stock images
    if (c === "new" && result.imageUrls.length > 0) {
      setImages(result.imageUrls);
    }
    // If switching to used, clear stock images so user uploads own
    if (c !== "new" && result.source !== "manual") {
      setImages([]);
    }
  };

  const handleSubmit = async () => {
    if (!productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    const costNum = parseFloat(cost);
    const priceNum = parseFloat(price);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        barcode: result.barcode,
        productName: productName.trim(),
        brand: result.brand,
        colorway: result.colorway,
        styleId: result.styleId,
        size: selectedSize || result.size || null,
        stockxProductId: result.stockxProductId,
        stockxVariantId: selectedVariant?.id ?? result.stockxVariantId,
        condition,
        hasBox,
        cost: isNaN(costNum) ? 0 : costNum,
        price: priceNum,
        images,
        productType: "sneaker",
      });
    } catch {
      toast.error("Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Product Name (editable) */}
      <div className="space-y-1.5">
        <Label>Product Name</Label>
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      {/* Size Picker */}
      {result.variants.length > 0 && (
        <SizeVariantPicker
          variants={result.variants}
          selectedVariantId={selectedVariant?.id ?? null}
          matchedVariantId={result.stockxVariantId}
          onSelect={handleVariantSelect}
        />
      )}

      {/* If no variants but we need a size */}
      {result.variants.length === 0 && (
        <div className="space-y-1.5">
          <Label>Size</Label>
          <Input
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            placeholder="e.g. 10, 10.5"
          />
        </div>
      )}

      {/* Market Data */}
      <MarketDataPanel
        data={marketData}
        onSuggestPrice={(p) => setPrice(String(p))}
      />

      {/* Condition */}
      <div className="space-y-2">
        <Label>Condition</Label>
        <div className="grid grid-cols-4 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => handleConditionChange(c.value)}
              className={cn(
                "rounded-lg border-2 px-3 py-3 text-center transition-colors",
                condition === c.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <p className="text-sm font-semibold">{c.label}</p>
              {c.sub && (
                <p className="text-[11px] text-muted-foreground">{c.sub}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Has Box */}
      <div className="flex items-center justify-between">
        <Label>Has Box</Label>
        <Switch checked={hasBox} onCheckedChange={setHasBox} />
      </div>

      {/* Images */}
      <div className="space-y-2">
        <Label>
          {isUsed ? "Upload Photos (required for used items)" : "Images"}
        </Label>
        {condition === "new" && images.length > 0 && result.source !== "manual" ? (
          <div className="grid grid-cols-3 gap-2">
            {images.slice(0, 3).map((url, i) => (
              <div
                key={url}
                className="aspect-square overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={url}
                  alt={`Stock ${i + 1}`}
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
        ) : (
          <ImageUpload images={images} onChange={setImages} />
        )}
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Cost (what you paid)</Label>
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
      </div>

      {/* Submit */}
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
        Add to Inventory
      </Button>
    </div>
  );
}
