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
  productType: "sneaker" | "pokemon" | "pokemon_sealed";

  // Pokemon grading (optional)
  grading?: PokemonGradingData;

  // Sealed product fields (optional)
  sealedType?: SealedProductType;
  quantity?: number;
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

// ─── Pokemon TCG Types ───────────────────────────────────────

export interface PokemonCardSearchResult {
  id: string;
  name: string;
  number: string;
  rarity: string;
  supertype: string;
  subtypes: string[];
  imageSmall: string;
  imageLarge: string;
  setId: string;
  setName: string;
  setSeries: string;
  setSymbol: string;
  marketPrice: number | null;
  tcgplayerUrl: string | null;
}

export interface PokemonCardDetail {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  hp: string | null;
  types: string[];
  number: string;
  rarity: string;
  artist: string | null;
  imageSmall: string;
  imageLarge: string;
  set: {
    id: string;
    name: string;
    series: string;
    releaseDate: string;
    symbol: string;
    logo: string;
  };
  tcgplayerUrl: string | null;
  variantPrices: Record<
    string,
    { low: number | null; mid: number | null; high: number | null; market: number | null }
  >;
  regulationMark: string | null;
}

// Pokemon card condition labels (TCG standard)
export const POKEMON_CONDITION_MAP: Record<string, { label: string; dbValue: import("./product").ProductCondition }> = {
  near_mint: { label: "Near Mint", dbValue: "new" },
  lightly_played: { label: "Lightly Played", dbValue: "used_like_new" },
  moderately_played: { label: "Moderately Played", dbValue: "used_good" },
  heavily_played: { label: "Heavily Played / Damaged", dbValue: "used_fair" },
};

// ─── Pokemon Grading Types ──────────────────────────────────

export interface PokemonGradingData {
  conditionType: "raw" | "graded";
  // Raw fields
  rawCondition?: string; // NM, LP, MP, HP, DMG
  // Graded fields
  gradingCompany?: string; // psa, bgs, cgc, sgc, ace, tag
  grade?: number;
  isBlackLabel?: boolean;
  subgrades?: {
    centering?: number;
    corners?: number;
    edges?: number;
    surface?: number;
  };
}

// ─── Sealed Product Types ───────────────────────────────────

export type SealedProductType =
  | "booster_box"
  | "etb"
  | "booster_pack"
  | "collection_box"
  | "tin"
  | "other";

export const SEALED_PRODUCT_TYPES: { value: SealedProductType; label: string }[] = [
  { value: "booster_box", label: "Booster Box" },
  { value: "etb", label: "Elite Trainer Box (ETB)" },
  { value: "booster_pack", label: "Booster Pack" },
  { value: "collection_box", label: "Collection Box" },
  { value: "tin", label: "Tin" },
  { value: "other", label: "Other" },
];

export interface SealedProductFormData {
  productName: string;
  setSeries: string;
  sealedType: SealedProductType;
  condition: "sealed" | "opened";
  price: number;
  cost: number;
  quantity: number;
  images: string[];
}
