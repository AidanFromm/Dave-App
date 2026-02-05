"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import {
  isNewDrop,
  isLowStock,
  discountPercentage,
  CONDITION_LABELS,
  formatCurrency,
} from "@/types/product";
import { useWishlistStore } from "@/stores/wishlist-store";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const lowStock = isLowStock(product);
  const soldOut = product.quantity <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg">
      {/* Image */}
      <Link href={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-muted">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {newDrop && (
            <Badge className="bg-primary text-primary-foreground">
              NEW DROP
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive">-{discount}%</Badge>
          )}
          {soldOut && (
            <Badge variant="secondary" className="bg-muted-foreground text-white">
              SOLD OUT
            </Badge>
          )}
          {lowStock && !soldOut && (
            <Badge className="bg-secured-warning text-white">LOW STOCK</Badge>
          )}
        </div>

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
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
      </Link>

      {/* Info */}
      <Link
        href={`/product/${product.id}`}
        className="flex flex-1 flex-col p-3"
      >
        {product.brand && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {product.brand}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-tight">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-1">
          {product.size && (
            <span className="text-xs text-muted-foreground">
              Size {product.size}
            </span>
          )}
          {product.size && (
            <span className="text-xs text-muted-foreground">·</span>
          )}
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
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold">
            {formatCurrency(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.compare_at_price)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
