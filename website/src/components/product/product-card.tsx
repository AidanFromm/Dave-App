"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";
import {
  isNewDrop,
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
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:shadow-xl hover:shadow-black/8 ring-1 ring-neutral-200/80 hover:ring-neutral-300/80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Image Container */}
      <Link 
        href={`/product/${product.id}`} 
        className="relative aspect-[4/3.5] overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100"
      >
        {product.images?.[0] ? (
          <div className="relative h-full w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "transition-transform duration-500 ease-out group-hover:scale-105",
                isUsed && !isPokemon ? "object-cover" : "object-contain p-4 sm:p-5"
              )}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-neutral-50 to-neutral-100">
            <Package className="h-10 w-10 text-neutral-300" strokeWidth={1.5} />
            <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-300">
              Photo Coming Soon
            </span>
          </div>
        )}

        {/* SOLD OUT overlay */}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <div className="rounded-lg bg-neutral-900 px-4 py-2 shadow-lg">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white">
                Sold Out
              </span>
            </div>
          </div>
        )}

        {/* Top-left badges stack */}
        <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          {newDrop && (
            <span className="bg-[#FB4F14] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              New
            </span>
          )}
          {isDrop && (
            <span className="bg-[#002244] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
              Limited
            </span>
          )}
          {discount && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
          {product.inventory_location === "warehouse" && (
            <span className="bg-[#002244]/80 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm backdrop-blur-sm">
              Ships Direct
            </span>
          )}
        </div>

        {/* Wishlist button -- top right */}
        <motion.div
          initial={false}
          animate={{ opacity: wishlisted || isHovered ? 1 : 0 }}
          className="absolute right-2.5 top-2.5 z-10"
        >
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all hover:scale-110 hover:shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              toggleProduct(product.id);
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all",
                wishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-neutral-400"
              )}
            />
          </button>
        </motion.div>

        {/* Quick add button on hover */}
        <AnimatePresence>
          {isHovered && !soldOut && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-3 right-3 z-10"
            >
              <Button
                className="w-full h-10 rounded-xl shadow-lg bg-[#002244] hover:bg-[#002244]/90 text-white text-xs font-bold uppercase tracking-wider gap-2"
                onClick={handleQuickAdd}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add to Cart
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drop quantity remaining */}
        {isDrop && dropRemaining !== null && dropRemaining > 0 && dropRemaining <= 10 && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
              Only {dropRemaining} left
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <Link
        href={`/product/${product.id}`}
        className="flex flex-1 flex-col p-3 sm:p-4 bg-white"
      >
        {/* Brand */}
        {product.brand && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
            {product.brand}
          </span>
        )}
        
        {/* Product Name */}
        <h3 className="mt-1 line-clamp-2 text-[13px] sm:text-sm font-semibold leading-snug text-neutral-900 group-hover:text-[#FB4F14] transition-colors duration-200">
          {product.name}
        </h3>

        {/* Size pills for sneakers */}
        {availableSizes && availableSizes.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {availableSizes.slice(0, 4).map((size) => (
              <span key={size} className="text-[10px] px-2 py-0.5 bg-neutral-100 rounded-md text-neutral-500 font-medium ring-1 ring-neutral-200/60">
                {size}
              </span>
            ))}
            {availableSizes.length > 4 && (
              <span className="text-[10px] px-2 py-0.5 bg-neutral-100 rounded-md text-neutral-400 font-medium ring-1 ring-neutral-200/60">
                +{availableSizes.length - 4}
              </span>
            )}
          </div>
        )}
        
        {/* Price + Condition row */}
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-neutral-900">
              {formatCurrency(isDrop ? dropDisplayPrice : product.price)}
            </span>
            {isDrop && product.drop_price != null && product.drop_price !== product.price ? (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatCurrency(product.price)}
              </span>
            ) : product.compare_at_price && product.compare_at_price > product.price ? (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            ) : null}
          </div>
          
          {/* Condition badge */}
          {isPokemon ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              {product.tags?.some((t) => t.toLowerCase().includes("graded"))
                ? (product.tags?.find((t) => /psa|bgs|cgc/i.test(t))?.toUpperCase() || "Graded")
                : product.tags?.some((t) => t.toLowerCase().includes("sealed"))
                ? "Sealed"
                : "Raw"}
            </span>
          ) : (
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 shrink-0",
                product.condition === "new"
                  ? "bg-emerald-50 text-emerald-600 ring-emerald-200/60"
                  : "bg-sky-50 text-sky-600 ring-sky-200/60"
              )}
            >
              {CONDITION_LABELS[product.condition]}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
