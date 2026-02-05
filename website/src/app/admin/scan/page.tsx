"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarcodeScannerInput } from "@/components/admin/barcode-scanner-input";
import { ScanResultCard } from "@/components/admin/scan-result-card";
import { ScanForm } from "@/components/admin/scan-form";
import { StockXSearchModal } from "@/components/admin/stockx-search-modal";
import { ScanHistoryTable } from "@/components/admin/scan-history-table";
import { lookupBarcode, updateScanCount } from "@/actions/barcode";
import { addScannedProductToInventory } from "@/actions/scan";
import { Button } from "@/components/ui/button";
import { Search, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import type {
  ScanResult,
  ScanState,
  ScanHistoryEntry,
  ScanFormData,
  StockXMarketData,
  StockXVariant,
} from "@/types/barcode";

export default function ScanPage() {
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [pendingBarcode, setPendingBarcode] = useState("");

  const handleScan = useCallback(async (barcode: string) => {
    setScanState("looking_up");
    setPendingBarcode(barcode);

    try {
      // Step 1: Check local DB
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

        // If we have stockx IDs, fetch variants + market data
        if (cached.stockx_product_id) {
          try {
            const productRes = await fetch(
              `/api/stockx/product/${cached.stockx_product_id}`
            );
            if (productRes.ok) {
              const productData = await productRes.json();
              result.variants = productData.variants ?? [];
              result.imageUrls =
                productData.imageUrls?.length > 0
                  ? productData.imageUrls
                  : result.imageUrls;

              // Find matched variant and fetch market data
              if (cached.stockx_variant_id) {
                try {
                  const mdRes = await fetch(
                    `/api/stockx/market-data/${cached.stockx_product_id}/${cached.stockx_variant_id}`
                  );
                  if (mdRes.ok) {
                    result.marketData = await mdRes.json();
                  }
                } catch {}
              }
            }
          } catch {}
        }

        setScanResult(result);
        setScanState("found");
        return;
      }

      // Step 2: Search StockX with barcode
      const searchRes = await fetch(
        `/api/stockx/search?q=${encodeURIComponent(barcode)}`
      );
      const searchData = await searchRes.json();
      const products = searchData.products ?? [];

      if (products.length > 0) {
        const match = products[0];
        // Fetch full product details
        const productRes = await fetch(`/api/stockx/product/${match.id}`);
        if (productRes.ok) {
          const productData = await productRes.json();

          // Try to match variant by GTIN
          let matchedVariant: StockXVariant | null = null;
          for (const v of productData.variants ?? []) {
            if (v.gtins?.includes(barcode)) {
              matchedVariant = v;
              break;
            }
          }

          let marketData: StockXMarketData | null = null;
          if (matchedVariant) {
            try {
              const mdRes = await fetch(
                `/api/stockx/market-data/${match.id}/${matchedVariant.id}`
              );
              if (mdRes.ok) marketData = await mdRes.json();
            } catch {}
          }

          const result: ScanResult = {
            source: "stockx",
            barcode,
            productName: productData.title,
            brand: productData.brand,
            colorway: productData.colorway,
            styleId: productData.styleId,
            size: matchedVariant?.size ?? null,
            retailPrice: productData.retailPrice,
            imageUrl: productData.imageUrl,
            imageUrls: productData.imageUrls ?? [],
            stockxProductId: match.id,
            stockxVariantId: matchedVariant?.id ?? null,
            variants: productData.variants ?? [],
            marketData,
          };

          setScanResult(result);
          setScanState("found");
          return;
        }
      }

      // Step 3: Not found — show manual search
      setScanState("not_found");
    } catch {
      toast.error("Lookup failed");
      setScanState("not_found");
    }
  }, []);

  const handleStockXSelect = async (product: {
    id: string;
    name: string;
    brand: string;
    colorway: string;
    styleId: string;
    retailPrice: number;
    imageUrl: string;
  }) => {
    setSearchModalOpen(false);
    setScanState("looking_up");

    try {
      const productRes = await fetch(`/api/stockx/product/${product.id}`);
      if (productRes.ok) {
        const productData = await productRes.json();

        const result: ScanResult = {
          source: "stockx",
          barcode: pendingBarcode,
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

        setScanResult(result);
        setScanState("found");
        return;
      }
    } catch {}

    // Fallback: use search result data
    const result: ScanResult = {
      source: "stockx",
      barcode: pendingBarcode,
      productName: product.name,
      brand: product.brand,
      colorway: product.colorway,
      styleId: product.styleId,
      size: null,
      retailPrice: product.retailPrice,
      imageUrl: product.imageUrl,
      imageUrls: product.imageUrl ? [product.imageUrl] : [],
      stockxProductId: product.id,
      stockxVariantId: null,
      variants: [],
      marketData: null,
    };

    setScanResult(result);
    setScanState("found");
  };

  const handleManualEntry = () => {
    setSearchModalOpen(false);
    const result: ScanResult = {
      source: "manual",
      barcode: pendingBarcode,
      productName: "",
      brand: null,
      colorway: null,
      styleId: null,
      size: null,
      retailPrice: null,
      imageUrl: null,
      imageUrls: [],
      stockxProductId: null,
      stockxVariantId: null,
      variants: [],
      marketData: null,
    };
    setScanResult(result);
    setScanState("found");
  };

  const handleAddToInventory = async (data: ScanFormData) => {
    setScanState("adding");
    const result = await addScannedProductToInventory(data);

    if (result.error) {
      toast.error(result.error);
      setScanState("found");
      setScanHistory((prev) => [
        {
          id: crypto.randomUUID(),
          time: new Date().toISOString(),
          barcode: data.barcode,
          productName: data.productName,
          size: data.size,
          condition: data.condition,
          price: data.price,
          status: "failed",
        },
        ...prev,
      ]);
      return;
    }

    toast.success(`${data.productName} added to inventory!`);
    setScanHistory((prev) => [
      {
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        barcode: data.barcode,
        productName: data.productName,
        size: data.size,
        condition: data.condition,
        price: data.price,
        status: "added",
      },
      ...prev,
    ]);

    // Reset for next scan
    setScanResult(null);
    setScanState("idle");
  };

  const fetchMarketData = async (
    productId: string,
    variantId: string
  ): Promise<StockXMarketData | null> => {
    try {
      const res = await fetch(
        `/api/stockx/market-data/${productId}/${variantId}`
      );
      if (res.ok) return await res.json();
    } catch {}
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan In</h1>
        <p className="text-sm text-muted-foreground">
          Scan a barcode to look up and add products to inventory
        </p>
      </div>

      <Tabs defaultValue="sneakers">
        <TabsList>
          <TabsTrigger value="sneakers">
            <ScanBarcode className="mr-1.5 h-4 w-4" />
            Sneakers
          </TabsTrigger>
          <TabsTrigger value="pokemon" disabled>
            Pokemon (Coming Soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sneakers" className="mt-4 space-y-6">
          {/* Scanner input — always visible */}
          <BarcodeScannerInput
            onScan={handleScan}
            loading={scanState === "looking_up"}
          />

          {/* Not found state */}
          {scanState === "not_found" && (
            <div className="rounded-lg border border-dashed border-yellow-500/50 bg-yellow-500/5 p-4">
              <p className="font-medium">
                Barcode not found: {pendingBarcode}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try searching StockX manually or enter product details.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search StockX
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualEntry}
                >
                  Manual Entry
                </Button>
              </div>
            </div>
          )}

          {/* Result + Form */}
          {scanState === "found" && scanResult && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <ScanResultCard result={scanResult} />
              </div>
              <div>
                <ScanForm
                  result={scanResult}
                  onSubmit={handleAddToInventory}
                  onMarketDataFetch={fetchMarketData}
                />
              </div>
            </div>
          )}

          {/* Adding state */}
          {scanState === "adding" && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Adding to inventory...
                </p>
              </div>
            </div>
          )}

          {/* Session History */}
          <div className="space-y-3">
            <h2 className="font-semibold">Session History</h2>
            <ScanHistoryTable entries={scanHistory} />
          </div>
        </TabsContent>

        <TabsContent value="pokemon">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-lg font-medium">Pokemon TCG</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Coming soon. Pokemon TCG API integration is in development.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* StockX Search Modal */}
      <StockXSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleStockXSelect}
        initialQuery={pendingBarcode}
      />
    </div>
  );
}
