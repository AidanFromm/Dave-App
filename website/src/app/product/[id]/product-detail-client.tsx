"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { useWishlistStore } from "@/stores/wishlist-store";
import type { Product } from "@/types/product";
import {
  CONDITION_LABELS,
  formatCurrency,
  isNewDrop,
  discountPercentage,
  getStockStatus,
} from "@/types/product";
import type { SizeVariant } from "@/actions/products";
import {
  Package,
  Box,
  Tag,
  Truck,
  Heart,
  Shield,
  RotateCcw,
  CreditCard,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

interface MergedSize {
  size: string | null;
  price: number;
  quantity: number;
  condition: string;
  /** All variant IDs that share this size */
  variantIds: string[];
  /** The "canonical" variant id to use for URL / cart */
  id: string;
}

export function ProductDetailClient({ product: initialProduct, sizeVariants = [] }: { product: Product; sizeVariants?: SizeVariant[] }) {
  // Lift product state so we can swap on size click
  const [activeProduct, setActiveProduct] = useState(initialProduct);

  const product = activeProduct;
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const stockStatus = getStockStatus(product);
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);
  const [showDetails, setShowDetails] = useState(true);

  // Deduplicate sizes: merge variants with same size
  const mergedSizes = useMemo<MergedSize[]>(() => {
    const map = new Map<string, MergedSize>();
    for (const v of sizeVariants) {
      const key = v.size ?? "__none__";
      const existing = map.get(key);
      if (existing) {
        existing.quantity += v.quantity;
        existing.variantIds.push(v.id);
        // Keep lower price if they differ
        if (v.price < existing.price) {
          existing.price = v.price;
          existing.id = v.id;
        }
      } else {
        map.set(key, {
          size: v.size,
          price: v.price,
          quantity: v.quantity,
          condition: v.condition,
          variantIds: [v.id],
          id: v.id,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const numA = parseFloat(a.size ?? "0");
      const numB = parseFloat(b.size ?? "0");
      return numA - numB;
    });
  }, [sizeVariants]);

  // Handle size click — update product state client-side
  const handleSizeClick = useCallback((merged: MergedSize) => {
    if (merged.quantity <= 0) return;
    // Update the active product with variant data
    setActiveProduct((prev) => ({
      ...prev,
      id: merged.id,
      size: merged.size,
      price: merged.price,
      quantity: merged.quantity,
      condition: merged.condition as Product["condition"],
    }));
    // Update URL without reload
    window.history.replaceState(null, "", `/product/${merged.id}`);
  }, []);

  const handleWishlist = () => {
    toggleProduct(product.id);
    toast.success(
      wishlisted
        ? `${product.name} removed from wishlist`
        : `${product.name} added to wishlist`
    );
  };

  const features = [
    { icon: <Shield className="h-4 w-4" />, text: "100% Authentic Guaranteed" },
    { icon: <Truck className="h-4 w-4" />, text: "Free Shipping Over $150" },
    { icon: <RotateCcw className="h-4 w-4" />, text: "Easy Returns" },
    { icon: <CreditCard className="h-4 w-4" />, text: "Secure Checkout" },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10"
    >
      {/* Breadcrumb */}
      <motion.nav variants={fadeIn} className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Shop</Link>
        <ChevronRight className="h-4 w-4" />
        {product.brand && (
          <>
            <span className="capitalize">{product.brand}</span>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </motion.nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <motion.div variants={fadeIn}>
          <ProductGallery images={product.images ?? []} name={product.name} />
        </motion.div>

        {/* Product Info */}
        <motion.div 
          variants={staggerContainer}
          className="flex flex-col lg:sticky lg:top-20 lg:self-start"
        >
          {/* Brand */}
          {product.brand && (
            <motion.p 
              variants={fadeIn}
              className="text-sm font-medium uppercase tracking-widest text-primary"
            >
              {product.brand}
            </motion.p>
          )}

          {/* Name */}
          <motion.h1 
            variants={fadeIn}
            className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl leading-tight tracking-tight"
          >
            {product.name}
          </motion.h1>

          {/* Badges */}
          <motion.div variants={fadeIn} className="mt-4 flex flex-wrap gap-2">
            {newDrop && (
              <Badge className="bg-gradient-to-r from-primary to-orange-500 text-white border-0 gap-1">
                <Sparkles className="h-3 w-3" />
                NEW DROP
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "font-medium",
                product.condition === "new"
                  ? "border-green-500 text-green-600 bg-green-500/10"
                  : "border-amber-500 text-amber-600 bg-amber-500/10"
              )}
            >
              {CONDITION_LABELS[product.condition]}
            </Badge>
            {stockStatus === "low_stock" && (
              <Badge className="bg-amber-500/90 text-white border-0 font-medium">
                ⚡ LOW STOCK
              </Badge>
            )}
            {stockStatus === "sold_out" && (
              <Badge variant="secondary" className="font-medium">SOLD OUT</Badge>
            )}
          </motion.div>

          {/* Price */}
          <motion.div variants={fadeIn} className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(product.compare_at_price)}
                </span>
                {discount && (
                  <Badge variant="destructive" className="font-bold">
                    SAVE {discount}%
                  </Badge>
                )}
              </>
            )}
          </motion.div>

          <motion.div variants={fadeIn}>
            <Separator className="my-6" />
          </motion.div>

          {/* Key Details */}
          <motion.div variants={fadeIn} className="grid grid-cols-2 gap-3">
            {product.size && (
              <div className="rounded-xl bg-muted/40 p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Size</span>
                <p className="mt-1 text-lg font-bold">{product.size}</p>
              </div>
            )}
            {product.colorway && (
              <div className="rounded-xl bg-muted/40 p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Colorway</span>
                <p className="mt-1 text-sm font-semibold line-clamp-1">{product.colorway}</p>
              </div>
            )}
            <div className="rounded-xl bg-muted/40 p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Box</span>
              <p className="mt-1 text-sm font-semibold">
                {product.has_box ? "✓ Included" : "No Box"}
              </p>
            </div>
            {product.sku && (
              <div className="rounded-xl bg-muted/40 p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">SKU</span>
                <p className="mt-1 text-sm font-mono">{product.sku}</p>
              </div>
            )}
          </motion.div>

          {/* Available Sizes — client-side switching, deduplicated */}
          {mergedSizes.length > 1 && (
            <motion.div variants={fadeIn} className="mt-6">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Available Sizes</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {mergedSizes.map((m) => {
                  const isActive = m.variantIds.includes(product.id);
                  const isSoldOut = m.quantity <= 0;
                  return (
                    <button
                      key={m.size ?? m.id}
                      onClick={() => handleSizeClick(m)}
                      disabled={isSoldOut}
                      aria-label={`Size ${m.size}${isSoldOut ? ", sold out" : `, ${formatCurrency(m.price)}, ${m.quantity} left`}`}
                      aria-pressed={m.variantIds.includes(product.id)}
                      className={cn(
                        "flex flex-col items-center rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all min-w-[60px] cursor-pointer",
                        isActive
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : isSoldOut
                          ? "border-border bg-muted/50 text-muted-foreground opacity-40 cursor-not-allowed"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <span className="font-bold">{m.size}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatCurrency(m.price)}
                      </span>
                      <span className={cn(
                        "text-[10px] mt-0.5",
                        isSoldOut ? "text-red-400" : m.quantity <= 3 ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {isSoldOut ? "Sold Out" : `${m.quantity} left`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={fadeIn} className="mt-8 flex gap-3">
            <div className="flex-1">
              <AddToCartButton product={product} />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-12 p-0"
                onClick={handleWishlist}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-all",
                    wishlisted && "fill-red-500 text-red-500 scale-110"
                  )}
                />
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust Badges */}
          <motion.div 
            variants={fadeIn}
            className="mt-8 grid grid-cols-2 gap-3"
          >
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Description Accordion */}
          {product.description && (
            <motion.div variants={fadeIn} className="mt-8">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between rounded-xl bg-muted/40 p-4 text-left hover:bg-muted/60 transition-colors"
              >
                <span className="font-semibold">Product Details</span>
                <motion.div
                  animate={{ rotate: showDetails ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </motion.div>
              </button>
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="p-4 text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <motion.div variants={fadeIn} className="mt-5 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
