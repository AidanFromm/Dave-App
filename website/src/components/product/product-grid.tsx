"use client";

import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-4xl">👟</div>
        <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or check back soon for new arrivals
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
