// Business logic constants — must match iOS app
export const TAX_RATE = 0.07; // 7% Florida sales tax
export const STANDARD_SHIPPING = 10.0;
export const FREE_SHIPPING_THRESHOLD = 150.0;
export const NEW_DROP_DAYS = 5;
export const ORDER_PREFIX = "SEC";

// StockX OAuth
export const STOCKX_AUTH_URL = "https://accounts.stockx.com/authorize";
export const STOCKX_TOKEN_URL = "https://accounts.stockx.com/oauth/token";
export const STOCKX_API_BASE = "https://api.stockx.com";
export const STOCKX_AUDIENCE = "gateway.stockx.com";
export const STOCKX_REDIRECT_URI = "https://securedtampa.com/stockx/callback";

// Shipping
export function calculateShipping(
  subtotal: number,
  fulfillmentType: "ship" | "pickup"
): number {
  if (fulfillmentType === "pickup") return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}

// Tax
export function calculateTax(subtotal: number): number {
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

// Order number
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `${ORDER_PREFIX}-${yy}${mm}${dd}-${rand}`;
}
