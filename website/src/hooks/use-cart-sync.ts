"use client";

import { useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useAuth } from "@/hooks/use-auth";
import { syncAbandonedCart } from "@/actions/abandoned-carts";

/**
 * Syncs cart state to Supabase abandoned_carts table for logged-in users.
 * Debounces to avoid excessive writes.
 */
export function useCartSync() {
  const items = useCartStore((s) => s.items);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || items.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const serialized = items.map((item) => ({
        name: item.product.name,
        price: item.variant_price ?? item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || null,
        size: item.variant_size || item.product.size || null,
        product_id: item.product.id,
        variant_id: item.variant_id || null,
      }));
      syncAbandonedCart(serialized, getSubtotal()).catch(() => {
        // Silent fail - non-critical
      });
    }, 5000); // 5 second debounce

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, user, getSubtotal]);
}
