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
  const [isHovered, setIsHovered] = useState(false);

  // Check if this is a sneaker (has size and no "pokemon" in name/tags)
  const isSneaker = product.size && !product.name.toLowerCase().includes("pokemon");

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    openDrawer();
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-card transition-shadow hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Container */}
      <Link 
        href={`/product/${product.id}`} 
        className="relative aspect-square overflow-hidden bg-muted"
      >
        {product.images?.[0] ? (
          <div className="relative h-full w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* SOLD OUT overlay */}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <span className="rounded-full bg-muted px-4 py-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Sold Out
            </span>
          </div>
        )}

        {/* Badges - top left */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {newDrop && (
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold shadow-md">
              🔥 NEW DROP
            </Badge>
          )}
          {discount && (
            <Badge variant="destructive" className="text-[10px] font-bold shadow-md">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Wishlist button - top right */}
        <motion.div
          initial={false}
          animate={{ opacity: wishlisted || isHovered ? 1 : 0 }}
          className="absolute right-3 top-3"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/90 shadow-md backdrop-blur-sm hover:bg-background"
            onClick={(e) => {
              e.preventDefault();
              toggleProduct(product.id);
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                wishlisted
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground"
              )}
            />
          </Button>
        </motion.div>

        {/* Size preview for sneakers - bottom left on hover */}
        <AnimatePresence>
          {isHovered && isSneaker && product.size && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-3"
            >
              <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
                <span className="text-xs text-muted-foreground">Size</span>
                <span className="text-sm font-bold">{product.size}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions on hover - bottom right */}
        <AnimatePresence>
          {isHovered && !soldOut && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 right-3 flex gap-2"
            >
              <Button
                size="icon"
                className="h-9 w-9 rounded-full shadow-lg"
                onClick={handleQuickAdd}
              >
                <ShoppingBag className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full shadow-lg"
                asChild
              >
                <Link href={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Product Info */}
      <Link
        href={`/product/${product.id}`}
        className="flex flex-1 flex-col p-4"
      >
        {/* Brand */}
        {product.brand && (
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </span>
        )}
        
        {/* Product Name */}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        {/* Price and Condition */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price)}
              </span>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 font-medium",
              product.condition === "new"
                ? "border-secured-condition-new text-secured-condition-new bg-secured-condition-new/10"
                : "border-secured-condition-used text-secured-condition-used bg-secured-condition-used/10"
            )}
          >
            {CONDITION_LABELS[product.condition]}
          </Badge>
        </div>
      </Link>
    </motion.div>
  );
}
