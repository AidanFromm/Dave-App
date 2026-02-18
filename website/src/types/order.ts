export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export type PickupStatus = "pending" | "ready" | "picked_up";

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
  partially_refunded: "Partially Refunded",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "orange",
  paid: "blue",
  processing: "purple",
  shipped: "indigo",
  delivered: "green",
  cancelled: "red",
  refunded: "gray",
  partially_refunded: "amber",
};

export const PICKUP_STATUS_LABELS: Record<PickupStatus, string> = {
  pending: "Pending",
  ready: "Ready for Pickup",
  picked_up: "Picked Up",
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
  variant_id?: string | null;
  name: string;
  sku: string | null;
  size: string | null;
  condition?: string | null;
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
  sales_channel: SalesChannel;
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
  delivery_method: "shipping" | "pickup";
  pickup_status: PickupStatus | null;
  pickup_code: string | null;
  refund_amount: number | null;
  refund_reason: string | null;
  created_at: string;
  updated_at: string;
}
