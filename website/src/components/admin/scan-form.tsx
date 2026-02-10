"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  Check, 
  X, 
  ChevronDown,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Store,
  Truck,
  ShoppingCart,
  Clock
} from "lucide-react";
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

type ScanMode = "in" | "out";

interface ScanFormProps {
  result: ScanResult;
  onSubmit: (data: ScanFormData) => Promise<void>;
  onMarketDataFetch?: (
    productId: string,
    variantId: string
  ) => Promise<StockXMarketData | null>;
  defaultMode?: ScanMode;
}

const CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "used_like_new", label: "Like New" },
  { value: "used_good", label: "Good" },
  { value: "used_fair", label: "Fair" },
];

// Product journey timeline steps
interface JourneyStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
}

function ProductJourney({ currentStep }: { currentStep: string }) {
  const steps: JourneyStep[] = [
    {
      id: "acquired",
      label: "Acquired",
      description: "Product scanned in",
      icon: <ArrowDownToLine className="h-4 w-4" />,
      status: currentStep === "acquired" ? "current" : currentStep === "in_stock" || currentStep === "sold" ? "completed" : "pending",
    },
    {
      id: "in_stock",
      label: "In Stock",
      description: "Listed for sale",
      icon: <Package className="h-4 w-4" />,
      status: currentStep === "in_stock" ? "current" : currentStep === "sold" ? "completed" : "pending",
    },
    {
      id: "sold",
      label: "Sold",
      description: "Purchased by customer",
      icon: <ShoppingCart className="h-4 w-4" />,
      status: currentStep === "sold" ? "current" : "pending",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        Product Journey
      </p>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  step.status === "completed" && "border-green-500 bg-green-500 text-white",
                  step.status === "current" && "border-primary bg-primary text-primary-foreground",
                  step.status === "pending" && "border-border bg-muted text-muted-foreground"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </motion.div>
              <p className={cn(
                "mt-2 text-xs font-medium text-center",
                step.status === "pending" && "text-muted-foreground"
              )}>
                {step.label}
              </p>
            </div>
            
            {/* Connector */}
            {idx < steps.length - 1 && (
              <div className={cn(
                "mx-2 h-0.5 w-12 sm:w-16",
                steps[idx + 1].status !== "pending" ? "bg-green-500" : "bg-border"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScanForm({ result, onSubmit, onMarketDataFetch, defaultMode = "in" }: ScanFormProps) {
  const [scanMode, setScanMode] = useState<ScanMode>(defaultMode);
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
  const [outReason, setOutReason] = useState<"sale" | "return" | "damage" | "other">("sale");

  const isUsed = condition !== "new";
  
  // Determine if size was auto-detected from barcode
  const sizeAutoDetected = !!(result.stockxVariantId && selectedVariant);
  const detectedSize = selectedVariant?.size ?? result.size;

  const handleSizeDropdownChange = async (variantId: string) => {
    const variant = result.variants.find((v) => v.id === variantId);
    if (variant) {
      setSelectedVariant(variant);
      setSelectedSize(variant.size);
      // Fetch market data for this variant
      if (result.stockxProductId && onMarketDataFetch) {
        const data = await onMarketDataFetch(result.stockxProductId, variant.id);
        setMarketData(data);
      }
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
    if (scanMode === "in") {
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
    } else {
      // Scan OUT - deduct from inventory
      setSubmitting(true);
      try {
        // Look up product by barcode to get productId, then adjust
        const lookupRes = await fetch(`/api/products?barcode=${encodeURIComponent(result.barcode)}`);
        const lookupData = await lookupRes.json();
        const product = lookupData.products?.[0];
        if (!product) throw new Error("Product not found in inventory");

        const reason = outReason === "sale" ? "sold_instore" : outReason === "return" ? "returned" : outReason === "damage" ? "damaged" : "adjustment";
        const res = await fetch("/api/admin/inventory/adjust", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            quantityChange: -1,
            reason,
            notes: `Scanned out: ${outReason}`,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to scan out");
        }
        toast.success(`${productName} scanned out (${outReason})`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to scan out product");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Sort variants by numeric size for dropdown
  const sortedVariants = [...result.variants].sort((a, b) => {
    const numA = parseFloat(a.size);
    const numB = parseFloat(b.size);
    if (isNaN(numA) || isNaN(numB)) return a.size.localeCompare(b.size);
    return numA - numB;
  });

  return (
    <div className="space-y-5">
      {/* Scan Mode Toggle - More prominent */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          onClick={() => setScanMode("in")}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all",
            scanMode === "in"
              ? "border-green-500 bg-green-500/10"
              : "border-border hover:border-muted-foreground"
          )}
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            scanMode === "in" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            <ArrowDownToLine className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className={cn(
              "font-bold text-lg",
              scanMode === "in" ? "text-green-600" : "text-foreground"
            )}>
              SCAN IN
            </p>
            <p className="text-xs text-muted-foreground">Add to inventory</p>
          </div>
          {scanMode === "in" && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </motion.button>

        <motion.button
          type="button"
          onClick={() => setScanMode("out")}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-5 transition-all",
            scanMode === "out"
              ? "border-red-500 bg-red-500/10"
              : "border-border hover:border-muted-foreground"
          )}
          whileTap={{ scale: 0.98 }}
        >
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            scanMode === "out" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"
          )}>
            <ArrowUpFromLine className="h-6 w-6" />
          </div>
          <div className="text-center">
            <p className={cn(
              "font-bold text-lg",
              scanMode === "out" ? "text-red-600" : "text-foreground"
            )}>
              SCAN OUT
            </p>
            <p className="text-xs text-muted-foreground">Deduct from inventory</p>
          </div>
          {scanMode === "out" && (
            <motion.div
              layoutId="mode-indicator"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <Check className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </motion.button>
      </div>

      {/* Product Journey Timeline */}
      <ProductJourney currentStep={scanMode === "in" ? "acquired" : "in_stock"} />

      {/* Scan OUT reason (when in out mode) */}
      <AnimatePresence mode="wait">
        {scanMode === "out" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Label>Reason for Scan Out</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { value: "sale", label: "Online Sale", icon: <Truck className="h-4 w-4" /> },
                { value: "instore", label: "In-Store", icon: <Store className="h-4 w-4" /> },
                { value: "return", label: "Return", icon: <ArrowDownToLine className="h-4 w-4" /> },
                { value: "damage", label: "Damaged", icon: <X className="h-4 w-4" /> },
              ].map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setOutReason(reason.value as typeof outReason)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 transition-colors",
                    outReason === reason.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-muted-foreground"
                  )}
                >
                  {reason.icon}
                  <span className="text-sm font-medium">{reason.label}</span>
                </button>
              ))}
            </div>
            
            {/* Clover POS note */}
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 flex items-start gap-3">
              <Store className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">In-Store Sales</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
                  In-store sales are processed through Clover POS. Use &quot;In-Store&quot; to manually sync inventory if needed.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Name (editable) */}
      <div className="space-y-1.5">
        <Label>Product Name</Label>
        <Input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      {/* Size Display - Clean auto-detected or dropdown fallback */}
      {sizeAutoDetected ? (
        // Auto-detected size - clean display, no picker
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
        // No auto-detect but variants available - show dropdown
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
        // No variants at all - manual input
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

      {/* Only show these fields for Scan IN */}
      {scanMode === "in" && (
        <>
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
                </button>
              ))}
            </div>
          </div>

          {/* Has Box - More visible toggle card */}
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

          {/* Image Upload - Only for Used condition */}
          {isUsed && (
            <div className="space-y-2">
              <Label>Upload Photos (required for used items)</Label>
              <ImageUpload images={images} onChange={setImages} />
            </div>
          )}

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
        </>
      )}

      {/* Submit */}
      <Button
        type="button"
        size="lg"
        className={cn(
          "w-full",
          scanMode === "out" && "bg-red-500 hover:bg-red-600"
        )}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : scanMode === "in" ? (
          <Plus className="mr-2 h-4 w-4" />
        ) : (
          <ArrowUpFromLine className="mr-2 h-4 w-4" />
        )}
        {scanMode === "in" ? "Add to Inventory" : "Scan Out Product"}
      </Button>
    </div>
  );
}
