import type { Product } from "./product";
import type { FulfillmentType, Address } from "./order";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant_id?: string | null;
  variant_size?: string | null;
  variant_condition?: string | null;
  variant_price?: number | null;
}

export interface CartState {
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  shippingAddress: Address | null;
  customerNotes: string;
}
