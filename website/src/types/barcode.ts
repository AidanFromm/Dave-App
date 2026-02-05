import type { ProductCondition } from "./product";

// Local barcode catalog record (Supabase)
export interface BarcodeCatalogEntry {
  id: string;
  barcode: string;
  barcode_type: "UPC" | "EAN" | "STYLE_ID" | "CUSTOM";
  stockx_product_id: string | null;
  stockx_variant_id: string | null;
  product_name: string;
  brand: string | null;
  colorway: string | null;
  style_id: string | null;
  size: string | null;
  retail_price: number | null;
  image_url: string | null;
  image_urls: string[];
  product_type: "sneaker" | "pokemon";
  scan_count: number;
  last_scanned_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// StockX product detail (from /v2/catalog/products/{id})
export interface StockXProductDetail {
  id: string;
  title: string;
  brand: string;
  colorway: string;
  styleId: string;
  description: string;
  retailPrice: number;
  imageUrl: string;
  imageUrls: string[];
  urlSlug: string;
  variants: StockXVariant[];
}

// Size variant with GTINs
export interface StockXVariant {
  id: string;
  size: string;
  gtins: string[];
}

// Market data for a specific variant
export interface StockXMarketData {
  lastSale: number | null;
  highestBid: number | null;
  lowestAsk: number | null;
  salesLast72Hours: number | null;
}

// Result from barcode lookup
export type ScanResultSource = "local_cache" | "stockx" | "manual";

export interface ScanResult {
  source: ScanResultSource;
  barcode: string;
  productName: string;
  brand: string | null;
  colorway: string | null;
  styleId: string | null;
  size: string | null;
  retailPrice: number | null;
  imageUrl: string | null;
  imageUrls: string[];
  stockxProductId: string | null;
  stockxVariantId: string | null;
  variants: StockXVariant[];
  marketData: StockXMarketData | null;
}

// Scan form submission data
export interface ScanFormData {
  // From scan result
  barcode: string;
  productName: string;
  brand: string | null;
  colorway: string | null;
  styleId: string | null;
  size: string | null;
  stockxProductId: string | null;
  stockxVariantId: string | null;

  // User input
  condition: ProductCondition;
  hasBox: boolean;
  cost: number;
  price: number;
  images: string[];

  // Metadata
  productType: "sneaker" | "pokemon";
}

// Session scan history entry
export interface ScanHistoryEntry {
  id: string;
  time: string;
  barcode: string;
  productName: string;
  size: string | null;
  condition: ProductCondition;
  price: number;
  status: "added" | "failed";
}

// Scan page state machine
export type ScanState =
  | "idle"
  | "scanning"
  | "looking_up"
  | "found"
  | "not_found"
  | "adding"
  | "added";
