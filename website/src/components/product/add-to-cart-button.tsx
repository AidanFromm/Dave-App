"use client";

import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import type { Product } from "@/types/product";
import { formatCurrency } from "@/types/product";
import { toast } from "sonner";

interface AddToCartButtonProps {
  product: Product;
  disabled?: boolean;
  variant?: { id: string; size?: string | null; condition?: string | null; price?: number | null } | null;
}

export function AddToCartButton({ product, disabled, variant }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartDrawerStore((s) => s.open);
  const [added, setAdded] = useState(false);

  const effectiveQty = variant ? (product.quantity > 0 ? product.quantity : 0) : product.quantity;
  const displayPrice = variant?.price ?? product.price;

  const handleAdd = () => {
    addItem(product, 1, variant ?? null);
    setAdded(true);
    openDrawer();
    const sizePart = variant?.size ? ` (Size ${variant.size})` : "";
    toast.success(`${product.name}${sizePart} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      size="lg"
      className="w-full h-13 text-sm font-semibold uppercase tracking-wider"
      disabled={disabled || effectiveQty <= 0}
      onClick={handleAdd}
    >
      {effectiveQty <= 0 ? (
        "Sold Out"
      ) : added ? (
        <>
          <Check className="mr-2 h-4 w-4" /> Added to Cart!
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart — {formatCurrency(displayPrice)}
        </>
      )}
    </Button>
  );
}
