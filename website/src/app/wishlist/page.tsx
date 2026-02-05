"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { useWishlistStore } from "@/stores/wishlist-store";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

export default function WishlistPage() {
  const { productIds } = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlistProducts() {
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("is_active", true);

      setProducts((data ?? []) as Product[]);
      setLoading(false);
    }

    fetchWishlistProducts();
  }, [productIds]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold">Wishlist</h1>
        <div className="mt-6">
          <ProductGridSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (productIds.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your wishlist is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Tap the heart icon on products you love to save them here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">
        Wishlist ({productIds.length})
      </h1>
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
