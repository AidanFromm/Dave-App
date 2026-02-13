"use client";

import { useCartSync } from "@/hooks/use-cart-sync";

export function CartSyncProvider() {
  useCartSync();
  return null;
}
