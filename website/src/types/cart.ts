import type { Product } from "./product";
import type { FulfillmentType, Address } from "./order";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  shippingAddress: Address | null;
  customerNotes: string;
}
