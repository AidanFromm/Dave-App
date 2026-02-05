"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProductDetailClient({ product }: { product: Product }) {
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const stockStatus = getStockStatus(product);
  const { isWishlisted, toggleProduct } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  const handleWishlist = () => {
    toggleProduct(product.id);
    toast.success(
      wishlisted
        ? `${product.name} removed from wishlist`
        : `${product.name} added to wishlist`
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={product.images ?? []} name={product.name} />

        {/* Product Info — sticky on desktop */}
        <div className="flex flex-col lg:sticky lg:top-20 lg:self-start">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">
            {product.name}
          </h1>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-2">
            {newDrop && (
              <Badge className="bg-primary text-primary-foreground">
                NEW DROP
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                product.condition === "new"
                  ? "border-secured-condition-new text-secured-condition-new"
                  : "border-secured-condition-used text-secured-condition-used"
              )}
            >
              {CONDITION_LABELS[product.condition]}
            </Badge>
            {stockStatus === "low_stock" && (
              <Badge className="bg-secured-warning text-white">
                LOW STOCK
              </Badge>
            )}
            {stockStatus === "sold_out" && (
              <Badge variant="secondary">SOLD OUT</Badge>
            )}
          </div>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              {formatCurrency(product.price)}
            </span>
            {product.compare_at_price &&
              product.compare_at_price > product.price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(product.compare_at_price)}
                  </span>
                  {discount && (
                    <Badge variant="destructive">-{discount}%</Badge>
                  )}
                </>
              )}
          </div>

          <Separator className="my-4" />

          {/* Details */}
          <div className="space-y-3">
            {product.size && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Size:</span>
                <span className="inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-sm font-medium">
                  {product.size}
                </span>
              </div>
            )}
            {product.colorway && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Colorway:</span>
                <span className="font-medium">{product.colorway}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Box:</span>
              <span className="font-medium">
                {product.has_box ? "Included" : "No Box"}
              </span>
            </div>
            {product.sku && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-medium">{product.sku}</span>
              </div>
            )}
          </div>

          {/* Shipping info */}
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 p-3 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Free shipping on orders over $150. Standard shipping $10.
            </span>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Description</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <div className="flex-1">
              <AddToCartButton product={product} />
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlist}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  wishlisted && "fill-primary text-primary"
                )}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
