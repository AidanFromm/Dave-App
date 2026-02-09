export type ProductCondition = "new" | "used";

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  new: "New",
  used: "Used",
};

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
  ebay_listing_id: string | null;
  whatnot_listing_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
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
