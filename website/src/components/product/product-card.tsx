"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import {
  isNewDrop,
  discountPercentage,
  CONDITION_LABELS,
  formatCurrency,
} from "@/types/product";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartDrawerStore((s) => s.open);
  const wishlisted = isWishlisted(product.id);
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const soldOut = product.quantity <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openDrawer();
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl shadow-card transition-shadow hover:shadow-md">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-muted">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* SOLD OUT overlay */}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Sold Out
            </span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {newDrop && (
            <Badge className="bg-primary text-primary-foreground text-[10px]">
              NEW DROP
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="text-[10px]">-{discount}%</Badge>
          )}
        </div>

        {/* Wishlist button — show on hover */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-opacity",
            wishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          onClick={(e) => {
            e.preventDefault();
            toggleProduct(product.id);
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              wishlisted
                ? "fill-primary text-primary"
                : "text-muted-foreground"
            )}
          />
        </Button>

        {/* Quick-add button on hover (desktop) */}
        {!soldOut && (
          <Button
            size="sm"
            className="absolute bottom-2 left-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 hidden sm:flex"
            onClick={handleQuickAdd}
          >
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
            Add to Cart
          </Button>
        )}
      </Link>

      {/* Info — minimal */}
      <Link
        href={`/product/${product.id}`}
        className="flex flex-1 flex-col p-3"
      >
        <h3 className="line-clamp-1 text-sm font-semibold leading-tight">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm font-bold">
            {formatCurrency(product.price)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              product.condition === "new"
                ? "border-secured-condition-new text-secured-condition-new"
                : "border-secured-condition-used text-secured-condition-used"
            )}
          >
            {CONDITION_LABELS[product.condition]}
          </Badge>
        </div>
      </Link>
    </div>
  );
}
