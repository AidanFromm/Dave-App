export type ProductCondition = "new" | "used_like_new" | "used_good" | "used_fair";

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: "New",
  used_like_new: "Preowned",
  used_good: "Good",
  used_fair: "Fair",
};

// Sneaker-specific condition scale
export type VariantCondition = "DS" | "VNDS" | "Used-Excellent" | "Used-Good" | "Used-Fair";

export const VARIANT_CONDITION_LABELS: Record<VariantCondition, string> = {
  DS: "Deadstock (DS)",
  VNDS: "Very Near Deadstock",
  "Used-Excellent": "Used — Excellent",
  "Used-Good": "Used — Good",
  "Used-Fair": "Used — Fair",
};

export const VARIANT_CONDITIONS: VariantCondition[] = [
  "DS", "VNDS", "Used-Excellent", "Used-Good", "Used-Fair",
];

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  condition: VariantCondition;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost: number | null;
  quantity: number;
  clover_item_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  size: string | null;
  condition: ProductCondition;
  colorway: string | null;
  has_box: boolean;
  price: number;
  cost: number | null;
  compare_at_price: number | null;
  quantity: number;
  low_stock_threshold: number;
  images: string[];
  is_drop: boolean;
  drop_date: string | null;
  drop_price: number | null;
  drop_quantity: number | null;
  drop_starts_at: string | null;
  drop_ends_at: string | null;
  drop_sold_count: number;
  ebay_listing_id: string | null;
  whatnot_listing_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  inventory_location?: 'store' | 'warehouse';
  has_variants?: boolean;
  variants?: ProductVariant[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Computed helpers
export function isInStock(product: Product): boolean {
  return product.quantity > 0;
}

export function isLowStock(product: Product): boolean {
  return product.quantity > 0 && product.quantity <= product.low_stock_threshold;
}

export function isNewDrop(product: Product): boolean {
  if (!product.is_drop) return false;
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  return new Date(product.created_at) >= fiveDaysAgo;
}

export type DropStatus = "upcoming" | "live" | "ended" | "sold_out";

export function getDropStatus(product: Product): DropStatus | null {
  if (!product.is_drop) return null;
  const now = new Date();
  const startsAt = product.drop_starts_at ? new Date(product.drop_starts_at) : null;
  const endsAt = product.drop_ends_at ? new Date(product.drop_ends_at) : null;
  const dropQty = product.drop_quantity;
  const soldCount = product.drop_sold_count ?? 0;

  if (dropQty !== null && dropQty !== undefined && soldCount >= dropQty) return "sold_out";
  if (endsAt && now >= endsAt) return "ended";
  if (startsAt && now < startsAt) return "upcoming";
  return "live";
}

export function isActiveDrop(product: Product): boolean {
  return getDropStatus(product) === "live";
}

export function getDropDisplayPrice(product: Product): number {
  if (product.is_drop && product.drop_price !== null && product.drop_price !== undefined) {
    return product.drop_price;
  }
  return product.price;
}

export function getDropRemainingQuantity(product: Product): number | null {
  if (!product.is_drop || product.drop_quantity === null || product.drop_quantity === undefined) return null;
  return Math.max(0, product.drop_quantity - (product.drop_sold_count ?? 0));
}

export function primaryImage(product: Product): string | null {
  return product.images?.[0] ?? null;
}

export function discountPercentage(product: Product): number | null {
  if (!product.compare_at_price || product.compare_at_price <= product.price) return null;
  return Math.round(
    ((product.compare_at_price - product.price) / product.compare_at_price) * 100
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export type StockStatus = "in_stock" | "low_stock" | "sold_out";

export function getStockStatus(product: Product): StockStatus {
  if (product.quantity <= 0) return "sold_out";
  if (isLowStock(product)) return "low_stock";
  return "in_stock";
}
