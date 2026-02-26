"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerInput } from "@/components/admin/barcode-scanner-input";
import { ScanResultCard } from "@/components/admin/scan-result-card";
import { ScanForm } from "@/components/admin/scan-form";
import { StockXSearchModal } from "@/components/admin/stockx-search-modal";
import { ScanHistoryTable } from "@/components/admin/scan-history-table";
import { PokemonCardSearch } from "@/components/admin/pokemon-card-search";
import { PokemonScanForm } from "@/components/admin/pokemon-scan-form";
import { SealedProductForm } from "@/components/admin/sealed-product-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { MarketDataPanel } from "@/components/admin/market-data-panel";
import { lookupBarcode, updateScanCount } from "@/actions/barcode";
import { addScannedProductToInventory } from "@/actions/scan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ScanBarcode,
  Sparkles,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Loader2,
  Volume2,
  VolumeX,
  Package,
  ChevronDown,
  Upload,
  ImageOff,
  Building2,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useScanSound } from "@/hooks/use-scan-sound";
import type {
  ScanResult,
  ScanState,
  ScanHistoryEntry,
  ScanFormData,
  StockXMarketData,
  StockXVariant,
  PokemonCardSearchResult,
} from "@/types/barcode";
import type { ProductCondition } from "@/types/product";

// ─── Types ───────────────────────────────────────────────────

type ScanPhase = "scanning" | "pricing";
type PaymentMethod = "none" | "cash" | "zelle" | "store_credit";

interface ScannedItem {
  id: string;
  barcode: string;
  result: ScanResult;
  quantity: number;
  // Pricing fields (filled in pricing phase)
  condition: ProductCondition;
  hasBox: boolean;
  cost: string;
  price: string;
  images: string[];
  selectedVariant: StockXVariant | null;
  selectedSize: string;
  marketData: StockXMarketData | null;
  expanded: boolean;
}

interface SavedSession {
  items: ScannedItem[];
  phase: ScanPhase;
  timestamp: string;
  sellerName?: string;
  paymentMethod?: PaymentMethod;
}

const SESSION_KEY = "dave-scan-session";

// ─── Product Image with Error Fallback ────────────────────────

function ProductImage({ 
  src, 
  alt, 
  className, 
  size = "md",
  onUploadFallback,
}: { 
  src?: string | null; 
  alt?: string; 
  className?: string;
  size?: "sm" | "md" | "lg";
  onUploadFallback?: () => void;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sizeClasses = {
    sm: "h-14 w-14",
    md: "h-20 w-20",
    lg: "h-32 w-32",
  };

  if (!src || error) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50",
          sizeClasses[size],
          onUploadFallback && "cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors",
          className
        )}
        onClick={onUploadFallback}
      >
        {onUploadFallback ? (
          <>
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground mt-0.5">Upload</span>
          </>
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border bg-white", sizeClasses[size], className)}>
      <img
        src={src}
        alt={alt || "Product"}
        className={cn("h-full w-full object-contain p-1", !loaded && "opacity-0")}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function ScanPage() {
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [manualLookupMode, setManualLookupMode] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState("");
  const [selectedPokemonCard, setSelectedPokemonCard] = useState<PokemonCardSearchResult | null>(null);
  const [pokemonSubMode, setPokemonSubMode] = useState<"cards" | "sealed">("cards");
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState({ current: 0, total: 0 });
  const [sellerName, setSellerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("none");
  const [inventoryLocation, setInventoryLocation] = useState<"store" | "warehouse">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("dave-scan-location") as "store" | "warehouse") || "store";
    }
    return "store";
  });

  const { playTone, setEnabled: setSoundEnabledHook } = useScanSound();

  // Persist inventory location toggle
  useEffect(() => {
    localStorage.setItem("dave-scan-location", inventoryLocation);
  }, [inventoryLocation]);

  // ─── Session Persistence ─────────────────────────────────

  // Load saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed: SavedSession = JSON.parse(saved);
        if (parsed.items && parsed.items.length > 0) {
          setSavedSession(parsed);
          setShowResumeDialog(true);
        }
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Save session whenever items change
  useEffect(() => {
    if (items.length > 0) {
      const session: SavedSession = {
        items,
        phase,
        timestamp: new Date().toISOString(),
        sellerName,
        paymentMethod,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [items, phase, sellerName, paymentMethod]);

  const handleResumeSession = () => {
    if (savedSession) {
      setItems(savedSession.items);
      setPhase(savedSession.phase);
      if (savedSession.sellerName) setSellerName(savedSession.sellerName);
      if (savedSession.paymentMethod) setPaymentMethod(savedSession.paymentMethod);
    }
    setShowResumeDialog(false);
    setSavedSession(null);
  };

  const handleStartFresh = () => {
    localStorage.removeItem(SESSION_KEY);
    setShowResumeDialog(false);
    setSavedSession(null);
  };

  // ─── Sound Toggle ────────────────────────────────────────

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setSoundEnabledHook(next);
  };

  // ─── StockX Lookup ───────────────────────────────────────

  const performLookup = useCallback(async (barcode: string): Promise<ScanResult | null> => {
    try {
      const cached = await lookupBarcode(barcode);
      if (cached) {
        await updateScanCount(barcode);
        const result: ScanResult = {
          source: "local_cache",
          barcode,
          productName: cached.product_name,
          brand: cached.brand,
          colorway: cached.colorway,
          styleId: cached.style_id,
          size: cached.size,
          retailPrice: cached.retail_price,
          imageUrl: cached.image_url,
          imageUrls: cached.image_urls ?? [],
          stockxProductId: cached.stockx_product_id,
          stockxVariantId: cached.stockx_variant_id,
          variants: [],
          marketData: null,
        };
        if (cached.stockx_product_id) {
          try {
            const productRes = await fetch(`/api/stockx/product/${cached.stockx_product_id}`);
            if (productRes.ok) {
              const productData = await productRes.json();
              result.variants = productData.variants ?? [];
              // Update both imageUrl and imageUrls from fresh StockX data
              if (productData.imageUrls?.length > 0) {
                result.imageUrls = productData.imageUrls;
                result.imageUrl = productData.imageUrl || productData.imageUrls[0];
              } else if (productData.imageUrl) {
                result.imageUrl = productData.imageUrl;
              }
              if (cached.stockx_variant_id) {
                try {
                  const mdRes = await fetch(`/api/stockx/market-data/${cached.stockx_product_id}/${cached.stockx_variant_id}`);
                  if (mdRes.ok) result.marketData = await mdRes.json();
                } catch {}
              }
            }
          } catch {}
        }
        return result;
      }

      const searchRes = await fetch(`/api/stockx/search?q=${encodeURIComponent(barcode)}`);
      const searchData = await searchRes.json();
      const products = searchData.products ?? [];
      if (products.length > 0) {
        const match = products[0];
        const productRes = await fetch(`/api/stockx/product/${match.id}`);
        if (productRes.ok) {
          const productData = await productRes.json();
          let matchedVariant: StockXVariant | null = null;
          for (const v of productData.variants ?? []) {
            if (v.gtins?.includes(barcode)) { matchedVariant = v; break; }
          }
          let marketData: StockXMarketData | null = null;
          if (matchedVariant) {
            try {
              const mdRes = await fetch(`/api/stockx/market-data/${match.id}/${matchedVariant.id}`);
              if (mdRes.ok) marketData = await mdRes.json();
            } catch {}
          }
          return {
            source: "stockx",
            barcode,
            productName: productData.title || productData.name || match.name || "Unknown Product",
            brand: productData.brand || match.brand,
            colorway: productData.colorway || match.colorway,
            styleId: productData.styleId || productData.sku || match.sku,
            size: matchedVariant?.size ?? null,
            retailPrice: productData.retailPrice ?? match.retailPrice,
            imageUrl: productData.imageUrl || match.imageUrl,
            imageUrls: productData.imageUrls?.length > 0 ? productData.imageUrls : (match.imageUrl ? [match.imageUrl] : []),
            stockxProductId: match.id,
            stockxVariantId: matchedVariant?.id ?? null,
            variants: productData.variants ?? [],
            marketData,
          };
        }
      }
      // StockX didn't find it - try UPC lookup as fallback for images/product info
      if (/^\d{12,13}$/.test(barcode)) {
        try {
          const upcRes = await fetch(`/api/upc-lookup?upc=${encodeURIComponent(barcode)}`);
          if (upcRes.ok) {
            const upcData = await upcRes.json();
            if (upcData.title) {
              return {
                source: "stockx" as const,
                barcode,
                productName: upcData.title,
                brand: upcData.brand || null,
                colorway: null,
                styleId: null,
                size: null,
                retailPrice: null,
                imageUrl: upcData.images?.[0] || null,
                imageUrls: upcData.images || [],
                stockxProductId: null,
                stockxVariantId: null,
                variants: [],
                marketData: null,
              };
            }
          }
        } catch {}
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ─── Scan Handler ────────────────────────────────────────

  const handleScan = useCallback(async (barcode: string) => {
    // Check if same barcode already scanned — increment quantity
    const existing = items.find((i) => i.barcode === barcode);
    if (existing) {
      setItems((prev) =>
        prev.map((i) => (i.barcode === barcode ? { ...i, quantity: i.quantity + 1 } : i))
      );
      playTone("duplicate");
      toast.success(`+1 ${existing.result.productName || barcode}`, {
        description: `Total: ${existing.quantity + 1}`,
        duration: 1500,
      });
      return;
    }

    setScanState("looking_up");
    setPendingBarcode(barcode);

    const result = await performLookup(barcode);

    if (result) {
      const defaultVariant = result.stockxVariantId
        ? result.variants.find((v) => v.id === result.stockxVariantId) ?? null
        : null;

      const newItem: ScannedItem = {
        id: crypto.randomUUID(),
        barcode,
        result,
        quantity: 1,
        condition: "new",
        hasBox: true,
        cost: "",
        price: "",
        images: result.imageUrls?.length > 0 ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : []),
        selectedVariant: defaultVariant,
        selectedSize: defaultVariant?.size ?? result.size ?? "",
        marketData: result.marketData,
        expanded: false,
      };

      setItems((prev) => [...prev, newItem]);
      setScanState("idle");
      playTone("success");
      toast.success(result.productName, {
        description: result.size ? `Size ${result.size}` : "Added to scan list",
        duration: 2000,
      });
    } else {
      setScanState("not_found");
      playTone("unknown");
      // Auto-open StockX search modal
      setSearchModalOpen(true);
    }
  }, [items, performLookup, playTone]);

  // ─── StockX Modal Handlers ───────────────────────────────

  const handleStockXSelect = async (product: {
    id: string; name: string; brand: string; colorway: string; styleId: string; retailPrice: number; imageUrl: string;
  }, manualSize?: string) => {
    setSearchModalOpen(false);
    const isManual = manualLookupMode;
    setManualLookupMode(false);
    const barcode = isManual ? `MANUAL-${Date.now()}` : pendingBarcode;
    setScanState("looking_up");
    try {
      const productRes = await fetch(`/api/stockx/product/${product.id}`);
      if (productRes.ok) {
        const productData = await productRes.json();
        const result: ScanResult = {
          source: "stockx",
          barcode,
          productName: productData.title,
          brand: productData.brand,
          colorway: productData.colorway,
          styleId: productData.styleId,
          size: null,
          retailPrice: productData.retailPrice,
          imageUrl: productData.imageUrl,
          imageUrls: productData.imageUrls ?? [],
          stockxProductId: product.id,
          stockxVariantId: null,
          variants: productData.variants ?? [],
          marketData: null,
        };
        // Try to match variant by size if provided
        let matchedVariant = null;
        let matchedMarketData = null;
        if (manualSize && result.variants.length > 0) {
          matchedVariant = result.variants.find((v) => v.size === manualSize) ?? null;
          if (matchedVariant && result.stockxProductId) {
            try {
              const mdRes = await fetch(`/api/stockx/market-data/${result.stockxProductId}/${matchedVariant.id}`);
              if (mdRes.ok) matchedMarketData = await mdRes.json();
            } catch {}
          }
        }
        setItems((prev) => [...prev, {
          id: crypto.randomUUID(), barcode, result, quantity: 1,
          condition: "new", hasBox: true, cost: "", price: "",
          images: result.imageUrls?.length > 0 ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : []),
          selectedVariant: matchedVariant, selectedSize: manualSize || "",
          marketData: matchedMarketData, expanded: false,
        }]);
        setScanState("idle");
        playTone("success");
        return;
      }
    } catch {}
    // Fallback
    const result: ScanResult = {
      source: "stockx", barcode, productName: product.name,
      brand: product.brand, colorway: product.colorway, styleId: product.styleId,
      size: null, retailPrice: product.retailPrice, imageUrl: product.imageUrl,
      imageUrls: product.imageUrl ? [product.imageUrl] : [], stockxProductId: product.id,
      stockxVariantId: null, variants: [], marketData: null,
    };
    setItems((prev) => [...prev, {
      id: crypto.randomUUID(), barcode, result, quantity: 1,
      condition: "new", hasBox: true, cost: "", price: "",
      images: result.imageUrls?.length > 0 ? result.imageUrls : (result.imageUrl ? [result.imageUrl] : []),
      selectedVariant: null, selectedSize: manualSize || "",
      marketData: null, expanded: false,
    }]);
    setScanState("idle");
  };

  // Manual entry removed — barcode must resolve via DB or StockX search

  // ─── Item CRUD ───────────────────────────────────────────

  const updateItem = useCallback((id: string, updates: Partial<ScannedItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const adjustQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      })
    );
  }, []);

  // ─── Fetch Market Data ──────────────────────────────────

  const fetchMarketData = async (productId: string, variantId: string): Promise<StockXMarketData | null> => {
    try {
      const res = await fetch(`/api/stockx/market-data/${productId}/${variantId}`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  };

  // ─── History Entry ──────────────────────────────────────

  const addHistoryEntry = (data: ScanFormData, status: "added" | "failed") => {
    setScanHistory((prev) => [{
      id: crypto.randomUUID(), time: new Date().toISOString(),
      barcode: data.barcode, productName: data.productName,
      size: data.size, condition: data.condition, price: data.price, status,
    }, ...prev]);
  };

  // ─── Submit All ─────────────────────────────────────────

  const handleSubmitAll = async () => {
    // Validate all items have prices
    const invalid = items.find((i) => {
      const p = parseFloat(i.price);
      return isNaN(p) || p <= 0;
    });
    if (invalid) {
      toast.error("All items need a selling price", {
        description: `${invalid.result.productName || invalid.barcode} is missing a price`,
      });
      // Expand the invalid item
      updateItem(invalid.id, { expanded: true });
      return;
    }

    setSubmitting(true);
    setSubmitProgress({ current: 0, total: items.length });

    let successCount = 0;
    let failCount = 0;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      setSubmitProgress({ current: idx + 1, total: items.length });

      // Submit once per quantity unit
      for (let q = 0; q < item.quantity; q++) {
        const data: ScanFormData = {
          barcode: item.barcode,
          productName: item.result.productName || "Unknown Product",
          brand: item.result.brand,
          colorway: item.result.colorway,
          styleId: item.result.styleId,
          size: item.selectedSize || item.result.size || null,
          stockxProductId: item.result.stockxProductId,
          stockxVariantId: item.selectedVariant?.id ?? item.result.stockxVariantId,
          condition: item.condition,
          hasBox: item.hasBox,
          cost: parseFloat(item.cost) || 0,
          price: parseFloat(item.price),
          images: item.images,
          productType: "sneaker",
          inventoryLocation: inventoryLocation,
        };

        const result = await addScannedProductToInventory(data);
        if (result.error) {
          failCount++;
          addHistoryEntry(data, "failed");
          toast.error(`Failed: ${data.productName}`, { description: result.error });
        } else {
          successCount++;
          addHistoryEntry(data, "added");
        }
      }
    }

    setSubmitting(false);

    if (failCount === 0) {
      playTone("submit");
      toast.success(`All ${successCount} item(s) added to inventory!`);
      setItems([]);
      setPhase("scanning");
      setSellerName("");
      setPaymentMethod("none");
      localStorage.removeItem(SESSION_KEY);
    } else {
      toast.warning(`${successCount} added, ${failCount} failed`);
    }
  };

  // ─── Pokemon Handler ────────────────────────────────────

  const handlePokemonAddToInventory = async (data: ScanFormData) => {
    const result = await addScannedProductToInventory(data);
    if (result.error) {
      toast.error(result.error);
      addHistoryEntry(data, "failed");
      return;
    }
    toast.success(`${data.productName} added to inventory!`);
    addHistoryEntry(data, "added");
    setSelectedPokemonCard(null);
  };

  // ─── Size change with market data fetch ─────────────────

  const handleSizeChange = async (itemId: string, variantId: string, item: ScannedItem) => {
    const variant = item.result.variants.find((v) => v.id === variantId);
    if (!variant) return;
    const updates: Partial<ScannedItem> = { selectedVariant: variant, selectedSize: variant.size };
    if (item.result.stockxProductId) {
      const md = await fetchMarketData(item.result.stockxProductId, variant.id);
      updates.marketData = md;
    }
    updateItem(itemId, updates);
  };

  // ─── Derived ────────────────────────────────────────────

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const canProceedToPricing = items.length > 0;

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Resume Session Dialog */}
      {showResumeDialog && savedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold">Resume Session?</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              You have <span className="font-bold text-foreground">{savedSession.items.length}</span> item
              {savedSession.items.length !== 1 ? "s" : ""} ({savedSession.items.reduce((s, i) => s + i.quantity, 0)} units) from a previous session.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleResumeSession} className="flex-1">Resume</Button>
              <Button onClick={handleStartFresh} variant="outline" className="flex-1">Start Fresh</Button>
            </div>
          </div>
        </div>
      )}

      <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scan In</h1>
          <p className="text-base text-muted-foreground">
            {phase === "scanning"
              ? "Scan barcodes to build your list, then move to pricing"
              : "Set condition and pricing for each item"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSound} className="h-9 w-9">
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      {/* Inventory Location Toggle */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Scanning to:</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setInventoryLocation("store")}
            className={cn(
              "flex flex-1 items-center justify-center gap-3 rounded-xl border-2 px-6 py-4 text-lg font-bold transition-all",
              inventoryLocation === "store"
                ? "border-[#002244] bg-[#002244] text-white shadow-lg"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30"
            )}
          >
            <Building2 className="h-6 w-6" />
            Store
          </button>
          <button
            type="button"
            onClick={() => setInventoryLocation("warehouse")}
            className={cn(
              "flex flex-1 items-center justify-center gap-3 rounded-xl border-2 px-6 py-4 text-lg font-bold transition-all",
              inventoryLocation === "warehouse"
                ? "border-[#002244] bg-[#002244] text-white shadow-lg"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30"
            )}
          >
            <Warehouse className="h-6 w-6" />
            Warehouse
          </button>
        </div>
      </div>

      <Tabs defaultValue="sneakers">
        <TabsList>
          <TabsTrigger value="sneakers">
            <ScanBarcode className="mr-1.5 h-4 w-4" />
            Sneakers
          </TabsTrigger>
          <TabsTrigger value="pokemon">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Pokemon TCG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sneakers" className="mt-4 space-y-6">
          {/* Phase Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPhase("scanning")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                phase === "scanning"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <ScanBarcode className="h-4 w-4" />
              1. Scanning
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-white/20 text-xs">
                  {totalItems}
                </Badge>
              )}
            </button>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={() => items.length > 0 && setPhase("pricing")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                phase === "pricing"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
                items.length === 0 && "cursor-not-allowed opacity-50"
              )}
            >
              <span className="text-base">$</span>
              2. Pricing
            </button>
          </div>

          {/* ─── SCANNING PHASE ─── */}
          {phase === "scanning" && (
            <>
              <BarcodeScannerInput
                onScan={handleScan}
                onManualLookup={() => {
                  setManualLookupMode(true);
                  setPendingBarcode("");
                  setSearchModalOpen(true);
                }}
                loading={scanState === "looking_up"}
              />

              {/* Not found state — StockX modal auto-opens, this is just a subtle indicator */}
              {scanState === "not_found" && !searchModalOpen && (
                <div className="rounded-lg border border-border bg-muted/50 p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Barcode <span className="font-mono font-medium">{pendingBarcode}</span> not in database
                  </p>
                </div>
              )}

              {/* Scanned Items List */}
              {items.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      Scanned Items ({items.length} product{items.length !== 1 ? "s" : ""}, {totalItems} unit{totalItems !== 1 ? "s" : ""})
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        setItems([]);
                        localStorage.removeItem(SESSION_KEY);
                      }}
                    >
                      Clear All
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30"
                      >
                        {/* Thumbnail */}
                        <ProductImage src={item.result.imageUrl || item.result.imageUrls?.[0]} size="md" />

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold">
                            {item.result.productName || "Unknown Product"}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {item.result.size && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Size {item.result.size}
                              </Badge>
                            )}
                            <span className="font-mono">{item.barcode.startsWith("MANUAL-") ? (item.result.styleId || "Manual") : item.barcode}</span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => adjustQuantity(item.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="flex h-7 w-8 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                            {item.quantity}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => adjustQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Continue to Pricing Button */}
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setPhase("pricing")}
                    disabled={!canProceedToPricing}
                  >
                    Continue to Pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {items.length === 0 && scanState === "idle" && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
                  <ScanBarcode className="mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Scan a barcode to get started
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Items will appear here as you scan
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── PRICING PHASE ─── */}
          {phase === "pricing" && (
            <>
              {/* Back to scanning */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPhase("scanning")}
                className="mb-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Scanning
              </Button>

              <div className="space-y-3">
                {items.map((item) => {
                  const isUsed = item.condition !== "new";
                  const isFromSource = item.result.source !== "manual";
                  const sortedVariants = [...item.result.variants].sort((a, b) => {
                    const numA = parseFloat(a.size);
                    const numB = parseFloat(b.size);
                    if (isNaN(numA) || isNaN(numB)) return a.size.localeCompare(b.size);
                    return numA - numB;
                  });

                  return (
                    <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
                      {/* Collapsed Header */}
                      <div
                        className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                        onClick={() => updateItem(item.id, { expanded: !item.expanded })}
                      >
                        <ProductImage src={item.result.imageUrl || item.result.imageUrls?.[0]} size="lg" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-bold">
                            {item.result.productName || "Unknown Product"}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {(item.selectedSize || item.result.size) && (
                              <span>Size {item.selectedSize || item.result.size}</span>
                            )}
                            <span>×{item.quantity}</span>
                            {item.price && (
                              <Badge variant="secondary" className="text-[10px]">
                                ${item.price}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="flex items-center gap-2">
                          {parseFloat(item.price) > 0 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20">
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/20">
                              <span className="text-xs font-bold text-yellow-600">$</span>
                            </div>
                          )}
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              item.expanded && "rotate-180"
                            )}
                          />
                        </div>
                      </div>

                      {/* Expanded Pricing Form */}
                      {item.expanded && (
                        <div className="border-t border-border p-6 space-y-5">
                          {/* Product Name (locked for StockX items) */}
                          {item.result.source === "manual" && (
                            <div className="space-y-1.5">
                              <Label>Product Name</Label>
                              <Input
                                value={item.result.productName}
                                onChange={(e) => {
                                  const newResult = { ...item.result, productName: e.target.value };
                                  updateItem(item.id, { result: newResult });
                                }}
                              />
                            </div>
                          )}

                          {/* Size */}
                          {item.selectedVariant && item.result.stockxVariantId ? (
                            <div className="space-y-1.5">
                              <Label className="flex items-center gap-2">
                                Size
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
                                  <Check className="h-3 w-3" /> Auto-detected
                                </span>
                              </Label>
                              <div className="flex h-10 items-center rounded-lg border border-green-500/30 bg-green-500/5 px-4 font-semibold text-green-700">
                                {item.selectedSize}
                              </div>
                            </div>
                          ) : sortedVariants.length > 0 ? (
                            <div className="space-y-1.5">
                              <Label>Size <span className="text-xs font-normal text-amber-600">(Select size)</span></Label>
                              <div className="relative">
                                <select
                                  value={item.selectedVariant?.id ?? ""}
                                  onChange={(e) => handleSizeChange(item.id, e.target.value, item)}
                                  className="h-10 w-full appearance-none rounded-lg border border-border bg-card px-4 pr-10 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                  <option value="">Select a size...</option>
                                  {sortedVariants.map((v) => (
                                    <option key={v.id} value={v.id}>{v.size}</option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label>Size</Label>
                              <Input
                                value={item.selectedSize}
                                onChange={(e) => updateItem(item.id, { selectedSize: e.target.value })}
                                placeholder="e.g. 10, 10.5"
                              />
                            </div>
                          )}

                          {/* Condition & Images Section */}
                          <div className="rounded-xl border-2 border-border overflow-hidden">
                            {/* Condition Toggle Header */}
                            <div
                              onClick={() => {
                                const newCondition: ProductCondition = item.condition === "new" ? "used_like_new" : "new";
                                const updates: Partial<ScannedItem> = { condition: newCondition };
                                if (newCondition === "new") {
                                  updates.hasBox = true;
                                  const stockImages = item.result.imageUrls?.length > 0 
                                    ? item.result.imageUrls 
                                    : (item.result.imageUrl ? [item.result.imageUrl] : []);
                                  if (stockImages.length > 0) updates.images = stockImages;
                                } else {
                                  if (item.result.source !== "manual") updates.images = [];
                                }
                                updateItem(item.id, updates);
                              }}
                              className={cn(
                                "flex cursor-pointer items-center justify-between px-4 py-3 transition-all",
                                item.condition === "new" 
                                  ? "bg-gradient-to-r from-green-500/10 to-green-500/5" 
                                  : "bg-gradient-to-r from-amber-500/10 to-amber-500/5"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full text-white",
                                  item.condition === "new" ? "bg-green-500" : "bg-amber-500"
                                )}>
                                  {item.condition === "new" ? <Sparkles className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-semibold">{item.condition === "new" ? "New Condition" : "Used Condition"}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.condition === "new" ? "Stock images will be used" : "Upload your own photos"}
                                  </p>
                                </div>
                              </div>
                              <div className={cn("flex h-7 w-12 items-center rounded-full px-0.5 transition-colors shadow-inner", item.condition === "new" ? "bg-green-500" : "bg-amber-500")}>
                                <div className={cn("h-6 w-6 rounded-full bg-white shadow-md transition-transform", item.condition === "new" ? "translate-x-0" : "translate-x-5")} />
                              </div>
                            </div>
                            
                            {/* Images Section */}
                            <div className="p-4 bg-muted/20">
                              {item.condition === "new" ? (
                                /* Stock Images for New */
                                (item.result.imageUrls?.length > 0 || item.result.imageUrl) ? (
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {(item.result.imageUrls?.length > 0 ? item.result.imageUrls : [item.result.imageUrl]).slice(0, 4).map((url, idx) => (
                                      <div key={idx} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1">
                                        <img src={url!} alt="" className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground text-center py-4">No stock images available</p>
                                )
                              ) : (
                                /* Upload Section for Used */
                                <div className="space-y-3">
                                  <ImageUpload images={item.images} onChange={(imgs) => updateItem(item.id, { images: imgs })} maxImages={5} />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Has Box Toggle — only for Used */}
                          {isUsed && (
                            <div
                              onClick={() => updateItem(item.id, { hasBox: !item.hasBox })}
                              className={cn(
                                "flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-all",
                                item.hasBox ? "border-green-500 bg-green-500/10" : "border-red-500/50 bg-red-500/5"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", item.hasBox ? "bg-green-500 text-white" : "bg-red-500/20 text-red-500")}>
                                  {item.hasBox ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                </div>
                                <div>
                                  <p className="font-semibold">Has Box</p>
                                  <p className="text-xs text-muted-foreground">{item.hasBox ? "Original box included" : "No box"}</p>
                                </div>
                              </div>
                              <div className={cn("flex h-6 w-11 items-center rounded-full px-0.5 transition-colors", item.hasBox ? "bg-green-500" : "bg-muted")}>
                                <div className={cn("h-5 w-5 rounded-full bg-white shadow-sm transition-transform", item.hasBox ? "translate-x-5" : "translate-x-0")} />
                              </div>
                            </div>
                          )}

                          {/* Market Data */}
                          {item.marketData && (
                            <MarketDataPanel
                              data={item.marketData}
                              onSuggestPrice={(p) => updateItem(item.id, { price: String(p) })}
                            />
                          )}

                          {/* Pricing */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-base">Cost (what you paid)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.cost}
                                onChange={(e) => updateItem(item.id, { cost: e.target.value })}
                                className="text-xl h-14"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-base">Selling Price *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, { price: e.target.value })}
                                className="text-xl h-14 font-semibold"
                              />
                            </div>
                          </div>

                          {/* Delete item */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Item
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Purchase Info (optional — for walk-in buys) */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Buying from someone?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    If you are buying these from a walk-in customer, fill in the details below. Leave blank for regular restocks.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Seller Name</Label>
                    <Input
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Who are you buying from?"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Method</Label>
                    <div className="flex gap-2">
                      {([
                        { value: "none" as PaymentMethod, label: "N/A" },
                        { value: "cash" as PaymentMethod, label: "Cash" },
                        { value: "zelle" as PaymentMethod, label: "Zelle" },
                        { value: "store_credit" as PaymentMethod, label: "Store Credit" },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPaymentMethod(opt.value)}
                          className={cn(
                            "flex-1 rounded-lg border-2 px-2 py-2.5 text-xs font-medium transition-all",
                            paymentMethod === opt.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-muted-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit All Button */}
              <div className="pt-4">
                {submitting ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Adding item {submitProgress.current} of {submitProgress.total}...
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(submitProgress.current / submitProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <Button size="lg" className="w-full" onClick={handleSubmitAll}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add All to Inventory ({totalItems} item{totalItems !== 1 ? "s" : ""})
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Session History */}
          {scanHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Session History</h2>
              <ScanHistoryTable entries={scanHistory} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="pokemon" className="mt-4 space-y-6">
          {/* Sub-toggle: Cards vs Sealed */}
          <div className="flex gap-2">
            <button
              onClick={() => setPokemonSubMode("cards")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pokemonSubMode === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Sparkles className="inline mr-1.5 h-3.5 w-3.5" />
              Cards
            </button>
            <button
              onClick={() => setPokemonSubMode("sealed")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                pokemonSubMode === "sealed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Package className="inline mr-1.5 h-3.5 w-3.5" />
              Sealed Product
            </button>
          </div>

          {pokemonSubMode === "cards" ? (
            selectedPokemonCard ? (
              <PokemonScanForm
                card={selectedPokemonCard}
                onSubmit={handlePokemonAddToInventory}
                onBack={() => setSelectedPokemonCard(null)}
              />
            ) : (
              <PokemonCardSearch onSelect={setSelectedPokemonCard} />
            )
          ) : (
            <SealedProductForm
              onSubmit={handlePokemonAddToInventory}
              onBack={() => {}}
            />
          )}
          {scanHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Session History</h2>
              <ScanHistoryTable entries={scanHistory} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* StockX Search Modal */}
      </>
      <StockXSearchModal
        open={searchModalOpen}
        onClose={() => { setSearchModalOpen(false); setManualLookupMode(false); }}
        onSelect={handleStockXSelect}
        initialQuery={manualLookupMode ? "" : pendingBarcode}
        showSizeField={manualLookupMode}
      />
    </div>
  );
}
