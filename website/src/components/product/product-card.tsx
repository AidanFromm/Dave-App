"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import {
  isNewDrop,
  isActiveDrop,
  getDropStatus,
  getDropDisplayPrice,
  getDropRemainingQuantity,
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
  availableSizes?: string[];
}

export function ProductCard({ product, availableSizes }: ProductCardProps) {
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartDrawerStore((s) => s.open);
  const wishlisted = isWishlisted(product.id);
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const dropStatus = getDropStatus(product);
  const isDrop = product.is_drop;
  const dropDisplayPrice = getDropDisplayPrice(product);
  const dropRemaining = getDropRemainingQuantity(product);
  const soldOut = isDrop
    ? (dropStatus === "sold_out" || (dropRemaining !== null && dropRemaining <= 0))
    : product.quantity <= 0;
  const [isHovered, setIsHovered] = useState(false);

  const isSneaker = product.size && !product.name.toLowerCase().includes("pokemon");
  const isPokemon = product.brand?.toLowerCase() === "pokemon tcg" || 
    product.name.toLowerCase().includes("pokemon") ||
    product.tags?.some((t) => t.toLowerCase().includes("pokemon"));
  const isUsed = product.condition !== "new";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openDrawer();
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Container */}
      <Link 
        href={`/product/${product.id}`} 
        className="relative aspect-square overflow-hidden bg-surface-850"
      >
        {product.images?.[0] ? (
          <div className={cn(
            "relative h-full w-full overflow-hidden",
            isUsed && !isPokemon ? "" : "bg-white p-4"
          )}>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "transition-transform duration-300 group-hover:scale-[1.03]",
                isUsed && !isPokemon ? "object-cover" : "object-contain"
              )}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* SOLD OUT overlay */}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-950/70 backdrop-blur-sm">
            <span className="rounded-full bg-surface-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Sold Out
            </span>
          </div>
        )}

        {/* Discount badge — top left (only discount overlays the image) */}
        {discount && (
          <div className="absolute left-2 top-2 z-10">
            <span className="bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          </div>
        )}

        {/* Wishlist button — top right */}
        <motion.div
          initial={false}
          animate={{ opacity: wishlisted || isHovered ? 1 : 0 }}
          className="absolute right-2 top-2 z-10"
        >
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-900/80 backdrop-blur-sm transition-colors hover:bg-surface-900"
            onClick={(e) => {
              e.preventDefault();
              toggleProduct(product.id);
            }}
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                wishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              )}
            />
          </button>
        </motion.div>

        {/* Quick actions on hover */}
        <AnimatePresence>
          {isHovered && !soldOut && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 right-3 flex gap-2 z-10"
            >
              <Button
                size="icon"
                className="h-9 w-9 rounded-full shadow-lg bg-primary hover:bg-primary/90"
                onClick={handleQuickAdd}
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Product Info */}
      <Link
        href={`/product/${product.id}`}
        className="flex flex-1 flex-col p-3"
      >
        {/* Brand */}
        {product.brand && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {product.brand}
          </span>
        )}
        
        {/* Product Name */}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Size pills for sneakers */}
        {availableSizes && availableSizes.length > 1 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {availableSizes.slice(0, 3).map((size) => (
              <span key={size} className="text-[10px] px-1.5 py-0.5 bg-surface-800 rounded text-muted-foreground">
                {size}
              </span>
            ))}
            {availableSizes.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 bg-surface-800 rounded text-muted-foreground">
                +{availableSizes.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="mt-auto pt-2 flex items-baseline gap-2">
          <span className="text-base font-mono font-bold text-primary">
            {formatCurrency(isDrop ? dropDisplayPrice : product.price)}
          </span>
          {isDrop && product.drop_price != null && product.drop_price !== product.price ? (
            <span className="text-xs font-mono text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </span>
          ) : product.compare_at_price && product.compare_at_price > product.price ? (
            <span className="text-xs font-mono text-muted-foreground line-through">
              {formatCurrency(product.compare_at_price)}
            </span>
          ) : null}
        </div>

        {/* Drop quantity remaining */}
        {isDrop && dropRemaining !== null && dropRemaining > 0 && dropRemaining <= 10 && (
          <p className="text-[10px] font-semibold text-red-400 mt-0.5">
            Only {dropRemaining} left
          </p>
        )}

        {/* Tags — bottom */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {isDrop && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FB4F14]/15 text-[#FB4F14] uppercase tracking-wider">
              Limited
            </span>
          )}
          {isPokemon ? (
            <>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-500">
                Pokemon
              </span>
              {product.tags?.some((t) => t.toLowerCase().includes("graded")) ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                  {product.tags?.find((t) => /psa|bgs|cgc/i.test(t))?.toUpperCase() || "Graded"}
                </span>
              ) : product.tags?.some((t) => t.toLowerCase().includes("sealed")) ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
                  Sealed
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-700/50 text-muted-foreground">
                  Raw
                </span>
              )}
            </>
          ) : (
            <>
              {newDrop && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  New Arrival
                </span>
              )}
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  product.condition === "new"
                    ? "bg-green-500/10 text-green-500"
                    : "bg-blue-500/10 text-blue-500"
                )}
              >
                {CONDITION_LABELS[product.condition]}
              </span>
            </>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
