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
}

interface CartStore {
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  shippingAddress: Address | null;
  customerNotes: string;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { id: crypto.randomUUID(), product, quantity },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
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
          (sum, item) => sum + item.product.price * item.quantity,
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
        return get().items.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          size: item.product.size,
          quantity: item.quantity,
          price: item.product.price,
          total: item.product.price * item.quantity,
        }));
      },
    }),
    {
      name: "secured-cart",
    }
  )
);
