"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { WishlistButton } from "@/components/product/wishlist-button";
import type { Product } from "@/types/product";
import {
  CONDITION_LABELS,
  formatCurrency,
  isNewDrop,
  isLowStock,
  discountPercentage,
  getStockStatus,
} from "@/types/product";
import {
  Package,
  Box,
  Tag,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductDetailClient({ product }: { product: Product }) {
  const discount = discountPercentage(product);
  const newDrop = isNewDrop(product);
  const stockStatus = getStockStatus(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={product.images ?? []} name={product.name} />

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
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

          {/* Brand */}
          {product.brand && (
            <p className="mt-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
          )}

          {/* Name */}
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-primary">
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
                <span className="font-medium">{product.size}</span>
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
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
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
          <div className="mt-6 space-y-3">
            <AddToCartButton product={product} />
            <WishlistButton
              productId={product.id}
              productName={product.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
