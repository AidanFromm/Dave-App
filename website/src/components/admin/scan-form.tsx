"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageUpload } from "./image-upload";
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

const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
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
  const isFromSource = result.source !== "manual";
  
  const sizeAutoDetected = !!(result.stockxVariantId && selectedVariant);
  const detectedSize = selectedVariant?.size ?? result.size;

  const handleSizeDropdownChange = async (variantId: string) => {
    const variant = result.variants.find((v) => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setSelectedSize(variant.size);
      if (result.stockxProductId && onMarketDataFetch) {
        const data = await onMarketDataFetch(result.stockxProductId, variant.id);
        setMarketData(data);
      }
    }
  };

  const handleConditionChange = (c: ProductCondition) => {
    setCondition(c);
    if (c === "new" && result.imageUrls.length > 0) {
      setImages(result.imageUrls);
    }
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

  const sortedVariants = [...result.variants].sort((a, b) => {
    const numA = parseFloat(a.size);
    const numB = parseFloat(b.size);
    if (isNaN(numA) || isNaN(numB)) return a.size.localeCompare(b.size);
    return numA - numB;
  });

  return (
    <div className="space-y-5">
      {/* Product Name */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-2">
          Product Name
          {isFromSource && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600">
              <Check className="h-3 w-3" />
              StockX
            </span>
          )}
        </Label>
        {isFromSource ? (
          <div className="flex h-10 items-center rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 text-sm font-medium text-foreground/80">
            {productName}
          </div>
        ) : (
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        )}
      </div>

      {/* Size Display */}
      {sizeAutoDetected ? (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            Size
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
              <Check className="h-3 w-3" />
              Auto-detected
            </span>
          </Label>
          <div className="flex h-10 items-center rounded-lg border border-green-500/30 bg-green-500/5 px-4 font-semibold text-green-700">
            {detectedSize}
          </div>
        </div>
      ) : result.variants.length > 0 ? (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            Size
            <span className="text-xs font-normal text-amber-600">
              (Select size)
            </span>
          </Label>
          <div className="relative">
            <select
              value={selectedVariant?.id ?? ""}
              onChange={(e) => handleSizeDropdownChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-border bg-card px-4 pr-10 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a size...</option>
              {sortedVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="flex items-center gap-2">
            Size
            <span className="text-xs font-normal text-muted-foreground">
              (Enter manually)
            </span>
          </Label>
          <Input
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            placeholder="e.g. 10, 10.5"
          />
        </div>
      )}

      {/* Condition — moved up, right after product info */}
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
            </button>
          ))}
        </div>
      </div>

      {/* Images — immediately after condition */}
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

      {/* Has Box */}
      <div
        onClick={() => setHasBox(!hasBox)}
        className={cn(
          "flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-all",
          hasBox
            ? "border-green-500 bg-green-500/10"
            : "border-red-500/50 bg-red-500/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              hasBox ? "bg-green-500 text-white" : "bg-red-500/20 text-red-500"
            )}
          >
            {hasBox ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-semibold">Has Box</p>
            <p className="text-xs text-muted-foreground">
              {hasBox ? "Original box included" : "No box"}
            </p>
          </div>
        </div>
        <div
          className={cn(
            "flex h-6 w-11 items-center rounded-full px-0.5 transition-colors",
            hasBox ? "bg-green-500" : "bg-muted"
          )}
        >
          <div
            className={cn(
              "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
              hasBox ? "translate-x-5" : "translate-x-0"
            )}
          />
        </div>
      </div>

      {/* Market Data */}
      <MarketDataPanel
        data={marketData}
        onSuggestPrice={(p) => setPrice(String(p))}
      />

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
