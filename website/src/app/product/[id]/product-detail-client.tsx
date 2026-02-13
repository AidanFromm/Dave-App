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
import type { ProductVariant, VariantCondition } from "@/types/product";
import { VARIANT_CONDITION_LABELS } from "@/types/product";
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
  variantIds: string[];
  id: string;
}

type InfoTab = "details" | "shipping" | "returns";

export function ProductDetailClient({ product: initialProduct, sizeVariants = [], dbVariants = [], category, relatedProducts = [] }: { product: Product; sizeVariants?: (SizeVariant & { variantCondition?: string })[]; dbVariants?: ProductVariant[]; category?: { id: string; name: string; slug: string } | null; relatedProducts?: Product[] }) {
  const [activeProduct, setActiveProduct] = useState(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InfoTab>("details");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const product = activeProduct;
  const hasDbVariants = dbVariants.length > 0;

  const isPokemon = product.brand?.toLowerCase() === "pokemon tcg" ||
    product.name.toLowerCase().includes("pokemon") ||
    product.tags?.some((t) => t.toLowerCase().includes("pokemon"));
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const stockStatus = getStockStatus(product);
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  // Deduplicate sizes
  const mergedSizes = useMemo<MergedSize[]>(() => {
    const map = new Map<string, MergedSize>();
    for (const v of sizeVariants) {
      const key = v.size ?? "__none__";
      const existing = map.get(key);
      if (existing) {
        existing.quantity += v.quantity;
        existing.variantIds.push(v.id);
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

  const handleSizeClick = useCallback((merged: MergedSize) => {
    if (merged.quantity <= 0) return;
    if (hasDbVariants) {
      const dbV = dbVariants.find((v) => v.id === merged.id);
      if (dbV) setSelectedVariant(dbV);
    }
    setActiveProduct((prev) => ({
      ...prev,
      size: merged.size,
      price: merged.price,
      quantity: merged.quantity,
      condition: merged.condition as Product["condition"],
    }));
    if (!hasDbVariants) {
      window.history.replaceState(null, "", `/product/${merged.id}`);
      setActiveProduct((prev) => ({ ...prev, id: merged.id }));
    }
  }, [hasDbVariants, dbVariants]);

  const handleWishlist = () => {
    toggleProduct(product.id);
    toast.success(
      wishlisted
        ? `${product.name} removed from wishlist`
        : `${product.name} added to wishlist`
    );
  };

  const features = [
    { icon: <Shield className="h-4 w-4" />, text: "100% Authentic" },
    { icon: <Truck className="h-4 w-4" />, text: "Free Over $150" },
    { icon: <RotateCcw className="h-4 w-4" />, text: "Easy Returns" },
    { icon: <CreditCard className="h-4 w-4" />, text: "Secure Pay" },
  ];

  const TABS: { key: InfoTab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "shipping", label: "Shipping" },
    { key: "returns", label: "Returns" },
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
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        {category ? (
          <>
            <Link href={`/?category=${category.slug}`} className="hover:text-foreground transition-colors capitalize">
              {category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        ) : product.brand ? (
          <>
            <span className="capitalize">{product.brand}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </>
        ) : null}
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
              className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
            >
              {product.brand}
            </motion.p>
          )}

          {/* Name */}
          <motion.h1 
            variants={fadeIn}
            className="mt-2 font-display text-2xl font-bold uppercase sm:text-3xl lg:text-4xl leading-tight tracking-tight"
          >
            {product.name}
          </motion.h1>

          {/* Badges */}
          <motion.div variants={fadeIn} className="mt-3 flex flex-wrap gap-2">
            {newDrop && (
              <span className="inline-flex items-center gap-1 bg-primary text-white text-xs font-bold uppercase px-2.5 py-1 rounded">
                <Sparkles className="h-3 w-3" />
                NEW DROP
              </span>
            )}
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded",
                product.condition === "new"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-amber-500/10 text-amber-500"
              )}
            >
              {CONDITION_LABELS[product.condition]}
            </span>
            {stockStatus === "low_stock" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-500">
                ⚡ LOW STOCK
              </span>
            )}
            {stockStatus === "sold_out" && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-800 text-muted-foreground">
                SOLD OUT
              </span>
            )}
          </motion.div>

          {/* Price */}
          <motion.div variants={fadeIn} className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-mono font-bold text-primary tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="text-lg font-mono text-muted-foreground line-through">
                  {formatCurrency(product.compare_at_price)}
                </span>
                {discount && (
                  <span className="text-xs font-bold bg-destructive text-white px-2 py-0.5 rounded">
                    SAVE {discount}%
                  </span>
                )}
              </>
            )}
          </motion.div>

          <motion.div variants={fadeIn}>
            <Separator className="my-6 bg-border/50" />
          </motion.div>

          {/* Available Sizes */}
          {mergedSizes.length > 1 && (
            <motion.div variants={fadeIn} className="mb-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Select Size</span>
                {!isPokemon && (
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-medium text-primary hover:underline transition-colors"
                  >
                    Size Guide
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {mergedSizes.map((m) => {
                  const isActive = m.variantIds.includes(product.id);
                  const isSoldOut = m.quantity <= 0;
                  return (
                    <button
                      key={m.size ?? m.id}
                      onClick={() => handleSizeClick(m)}
                      disabled={isSoldOut}
                      aria-label={`Size ${m.size}${isSoldOut ? ", sold out" : `, ${formatCurrency(m.price)}`}`}
                      aria-pressed={m.variantIds.includes(product.id)}
                      className={cn(
                        "flex flex-col items-center rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : isSoldOut
                          ? "border-border bg-surface-800/30 text-muted-foreground opacity-40 cursor-not-allowed line-through"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <span className="font-bold">{m.size}</span>
                      <span className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {formatCurrency(m.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Key details row */}
          <motion.div variants={fadeIn} className="grid grid-cols-2 gap-2 mb-6">
            {product.size && mergedSizes.length <= 1 && (
              <div className="rounded-xl bg-surface-800/30 border border-border/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Size</span>
                <p className="mt-0.5 text-sm font-bold">{product.size}</p>
              </div>
            )}
            {product.colorway && (
              <div className="rounded-xl bg-surface-800/30 border border-border/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Colorway</span>
                <p className="mt-0.5 text-sm font-semibold line-clamp-1">{product.colorway}</p>
              </div>
            )}
            <div className="rounded-xl bg-surface-800/30 border border-border/50 p-3">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Box</span>
              <p className="mt-0.5 text-sm font-semibold">
                {product.has_box ? "✓ Included" : "No Box"}
              </p>
            </div>
            {product.sku && (
              <div className="rounded-xl bg-surface-800/30 border border-border/50 p-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">SKU</span>
                <p className="mt-0.5 text-xs font-mono text-muted-foreground">{product.sku}</p>
              </div>
            )}
          </motion.div>

          {/* Condition Selector for DB Variants */}
          {hasDbVariants && selectedVariant && (
            <motion.div variants={fadeIn} className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Condition</span>
              <div className="mt-2">
                <span className="inline-flex text-sm px-3 py-1 rounded-full border-2 border-primary text-primary bg-primary/10 font-medium">
                  {VARIANT_CONDITION_LABELS[selectedVariant.condition as VariantCondition] ?? selectedVariant.condition}
                </span>
              </div>
            </motion.div>
          )}

          {/* Condition Selector for Pokemon Cards */}
          {isPokemon && !hasDbVariants && (
            <motion.div variants={fadeIn} className="mb-6">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Condition</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["new", "used_like_new", "used_good", "used_fair"] as const).map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setSelectedCondition(cond)}
                    className={cn(
                      "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all cursor-pointer",
                      (selectedCondition ?? product.condition) === cond
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                  >
                    {CONDITION_LABELS[cond]}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={fadeIn} className="flex gap-3">
            <div className="flex-1">
              <AddToCartButton
                product={product}
                variant={selectedVariant ? {
                  id: selectedVariant.id,
                  size: selectedVariant.size,
                  condition: selectedVariant.condition,
                  price: selectedVariant.price,
                } : undefined}
              />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-12 p-0 border-border hover:border-primary/50 hover:bg-primary/5"
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
            className="mt-6 flex flex-wrap gap-4"
          >
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Info Tabs */}
          <motion.div variants={fadeIn} className="mt-8">
            <div className="flex border-b border-border/50">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px",
                    activeTab === tab.key
                      ? "text-primary border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:border-surface-700"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="py-5 text-sm text-muted-foreground leading-relaxed">
              {activeTab === "details" && (
                <div className="space-y-3">
                  {product.description ? (
                    <p>{product.description}</p>
                  ) : (
                    <p>Authentic {product.brand ?? ""} product. Verified and inspected by the Secured Tampa team before shipping.</p>
                  )}
                  {product.colorway && <p><span className="font-medium text-foreground">Colorway:</span> {product.colorway}</p>}
                  {product.sku && <p><span className="font-medium text-foreground">SKU:</span> <span className="font-mono">{product.sku}</span></p>}
                </div>
              )}
              {activeTab === "shipping" && (
                <div className="space-y-3">
                  <p>Orders are processed within <span className="font-medium text-foreground">1-2 business days</span>.</p>
                  <p><span className="font-medium text-foreground">Free shipping</span> on orders over $150.</p>
                  <p>Standard shipping (3-7 business days) via USPS or FedEx.</p>
                  <p>Expedited and overnight options available at checkout.</p>
                  <p>Local pickup available in <span className="font-medium text-foreground">Tampa, FL</span>.</p>
                </div>
              )}
              {activeTab === "returns" && (
                <div className="space-y-3">
                  <p>Returns accepted within <span className="font-medium text-foreground">14 days</span> of delivery.</p>
                  <p>Items must be in original condition — unworn, with tags and box.</p>
                  <p>Used items are <span className="font-medium text-foreground">final sale</span> unless the condition was misrepresented.</p>
                  <p>Contact <span className="font-medium text-foreground">securedtampa.llc@gmail.com</span> to initiate a return.</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <motion.div variants={fadeIn} className="mt-2 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-800/50 text-muted-foreground border border-border/50">
                  {tag}
                </span>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.div variants={fadeIn} className="mt-16 border-t border-border/50 pt-12">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight mb-6">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/product/${rp.id}`} className="group">
                <div className="aspect-square overflow-hidden rounded-xl border border-border bg-surface-800/30">
                  {rp.images?.[0] ? (
                    <img
                      src={rp.images[0]}
                      alt={rp.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {rp.name}
                  </p>
                  {rp.brand && (
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {rp.brand}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-mono font-bold text-primary">
                    {formatCurrency(rp.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold uppercase">Sneaker Size Guide</h3>
              <button
                onClick={() => setShowSizeGuide(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-800/50 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              US, UK, and EU size conversions for men&apos;s sneakers. Sizes may vary slightly by brand.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-semibold text-primary">US</th>
                    <th className="pb-2 font-semibold text-primary">UK</th>
                    <th className="pb-2 font-semibold text-primary">EU</th>
                    <th className="pb-2 font-semibold text-primary">CM</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {[
                    ["6", "5.5", "38.5", "24"],
                    ["6.5", "6", "39", "24.5"],
                    ["7", "6", "40", "25"],
                    ["7.5", "6.5", "40.5", "25.5"],
                    ["8", "7", "41", "26"],
                    ["8.5", "7.5", "42", "26.5"],
                    ["9", "8", "42.5", "27"],
                    ["9.5", "8.5", "43", "27.5"],
                    ["10", "9", "44", "28"],
                    ["10.5", "9.5", "44.5", "28.5"],
                    ["11", "10", "45", "29"],
                    ["11.5", "10.5", "45.5", "29.5"],
                    ["12", "11", "46", "30"],
                    ["13", "12", "47.5", "31"],
                    ["14", "13", "48.5", "32"],
                  ].map(([us, uk, eu, cm]) => (
                    <tr key={us} className="border-b border-border/50 hover:bg-surface-800/30">
                      <td className="py-2 font-medium">{us}</td>
                      <td className="py-2">{uk}</td>
                      <td className="py-2">{eu}</td>
                      <td className="py-2">{cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                For the best fit, measure your foot length in centimeters and compare with the CM column.
                When between sizes, size up for a more comfortable fit.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
