export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type SalesChannel = "pos" | "ios" | "web" | "ebay" | "whatnot";

export type FulfillmentType = "ship" | "pickup";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "orange",
  paid: "blue",
  processing: "purple",
  shipped: "indigo",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
};

export const SALES_CHANNEL_LABELS: Record<SalesChannel, string> = {
  pos: "In-Store",
  ios: "iOS App",
  web: "Website",
  ebay: "eBay",
  whatnot: "Whatnot",
};

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  ship: "Shipping",
  pickup: "Store Pickup",
};

export interface OrderItem {
  product_id: string;
  name: string;
  sku: string | null;
  size: string | null;
  quantity: number;
  price: number;
  total: number;
}

export interface Address {
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_email: string;
  channel: SalesChannel;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  shipping_address: Address | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  stripe_payment_id: string | null;
  stripe_payment_status: string | null;
  customer_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}
