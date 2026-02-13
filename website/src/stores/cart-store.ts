"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import type { FulfillmentType, Address, OrderItem } from "@/types/order";
import { TAX_RATE, calculateShipping } from "@/lib/constants";

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  variant_id?: string | null;
  variant_size?: string | null;
  variant_condition?: string | null;
  variant_price?: number | null;
}

interface CartStore {
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  shippingAddress: Address | null;
  customerNotes: string;

  // Actions
  addItem: (product: Product, quantity?: number, variant?: { id: string; size?: string | null; condition?: string | null; price?: number | null } | null) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setShippingAddress: (address: Address | null) => void;
  setCustomerNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed-style getters
  getSubtotal: () => number;
  getTax: () => number;
  getShippingCost: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  toOrderItems: () => OrderItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      fulfillmentType: "ship",
      shippingAddress: null,
      customerNotes: "",

      addItem: (product, quantity = 1, variant = null) => {
        set((state) => {
          // Match by variant_id if present, else by product.id
          const matchKey = variant?.id ?? product.id;
          const existing = state.items.find(
            (item) => (item.variant_id ?? item.product.id) === matchKey
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                (item.variant_id ?? item.product.id) === matchKey
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: crypto.randomUUID(),
                product,
                quantity,
                variant_id: variant?.id ?? null,
                variant_size: variant?.size ?? null,
                variant_condition: variant?.condition ?? null,
                variant_price: variant?.price ?? null,
              },
            ],
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => {
            // Support both cart item id and product/variant id for backward compat
            if (item.id === cartItemId) return false;
            if (item.variant_id === cartItemId) return false;
            if (item.product.id === cartItemId) return false;
            return true;
          }),
        }));
      },

      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id === cartItemId || item.variant_id === cartItemId || item.product.id === cartItemId) {
              return { ...item, quantity };
            }
            return item;
          }),
        }));
      },

      setFulfillmentType: (type) => set({ fulfillmentType: type }),
      setShippingAddress: (address) => set({ shippingAddress: address }),
      setCustomerNotes: (notes) => set({ customerNotes: notes }),

      clearCart: () =>
        set({
          items: [],
          shippingAddress: null,
          customerNotes: "",
        }),

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.variant_price ?? item.product.price) * item.quantity,
          0
        );
      },

      getTax: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * TAX_RATE * 100) / 100;
      },

      getShippingCost: () => {
        return calculateShipping(get().getSubtotal(), get().fulfillmentType);
      },

      getTotal: () => {
        return get().getSubtotal() + get().getTax() + get().getShippingCost();
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      toOrderItems: () => {
        return get().items.map((item) => {
          const price = item.variant_price ?? item.product.price;
          return {
            product_id: item.product.id,
            variant_id: item.variant_id ?? null,
            name: item.product.name,
            sku: item.product.sku,
            size: item.variant_size ?? item.product.size,
            condition: item.variant_condition ?? null,
            quantity: item.quantity,
            price,
            total: price * item.quantity,
          };
        });
      },
    }),
    {
      name: "secured-cart",
    }
  )
);
