"use client";

import { PackageSearch } from "lucide-react";
import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
  sizesByName?: Map<string, Set<string>>;
}

export function ProductGrid({ products, sizesByName }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
          <PackageSearch className="h-8 w-8 text-neutral-300" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-neutral-900">No Products Found</h3>
        <p className="mt-1.5 text-sm text-neutral-500 text-center max-w-xs">
          Try adjusting your filters or check back soon for new arrivals.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const sizes = sizesByName?.get(product.name.toLowerCase().trim());
        return (
          <ProductCard
            key={product.id}
            product={product}
            availableSizes={sizes && sizes.size > 1 ? Array.from(sizes) : undefined}
          />
        );
      })}
    </div>
  );
}
