"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];
  addProduct: (id: string) => void;
  removeProduct: (id: string) => void;
  toggleProduct: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      addProduct: (id) => {
        set((state) => ({
          productIds: state.productIds.includes(id)
            ? state.productIds
            : [...state.productIds, id],
        }));
      },

      removeProduct: (id) => {
        set((state) => ({
          productIds: state.productIds.filter((pid) => pid !== id),
        }));
      },

      toggleProduct: (id) => {
        const { productIds } = get();
        if (productIds.includes(id)) {
          get().removeProduct(id);
        } else {
          get().addProduct(id);
        }
      },

      isWishlisted: (id) => get().productIds.includes(id),

      clearWishlist: () => set({ productIds: [] }),
    }),
    {
      name: "secured-wishlist",
    }
  )
);
