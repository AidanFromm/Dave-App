"use client";

import { useState } from "react";
import Link from "next/link";
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

export function ProductDetailClient({ product }: { product: Product }) {
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const stockStatus = getStockStatus(product);
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);
  const [showDetails, setShowDetails] = useState(true);

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
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Breadcrumb */}
      <motion.nav variants={fadeIn} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
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

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
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
            className="mt-1 text-2xl font-bold sm:text-3xl lg:text-4xl leading-tight"
          >
            {product.name}
          </motion.h1>

          {/* Badges */}
          <motion.div variants={fadeIn} className="mt-3 flex flex-wrap gap-2">
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
              <Badge className="bg-amber-500 text-white border-0 animate-pulse">
                ⚡ LOW STOCK
              </Badge>
            )}
            {stockStatus === "sold_out" && (
              <Badge variant="secondary" className="font-medium">SOLD OUT</Badge>
            )}
          </motion.div>

          {/* Price */}
          <motion.div variants={fadeIn} className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">
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
            <Separator className="my-5" />
          </motion.div>

          {/* Key Details */}
          <motion.div variants={fadeIn} className="grid grid-cols-2 gap-4">
            {product.size && (
              <div className="rounded-xl bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Size</span>
                <p className="mt-1 text-lg font-bold">{product.size}</p>
              </div>
            )}
            {product.colorway && (
              <div className="rounded-xl bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Colorway</span>
                <p className="mt-1 text-sm font-semibold line-clamp-1">{product.colorway}</p>
              </div>
            )}
            <div className="rounded-xl bg-muted/50 p-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Box</span>
              <p className="mt-1 text-sm font-semibold">
                {product.has_box ? "✓ Included" : "No Box"}
              </p>
            </div>
            {product.sku && (
              <div className="rounded-xl bg-muted/50 p-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">SKU</span>
                <p className="mt-1 text-sm font-mono">{product.sku}</p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div variants={fadeIn} className="mt-6 flex gap-3">
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
            className="mt-6 grid grid-cols-2 gap-3"
          >
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Description Accordion */}
          {product.description && (
            <motion.div variants={fadeIn} className="mt-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between rounded-xl bg-muted/50 p-4 text-left"
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
            <motion.div variants={fadeIn} className="mt-4 flex flex-wrap gap-2">
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
