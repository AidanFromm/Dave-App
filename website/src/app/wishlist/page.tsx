"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { ProductGridSkeleton } from "@/components/product/product-grid-skeleton";
import { useWishlistStore } from "@/stores/wishlist-store";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types/product";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export default function WishlistPage() {
  const { productIds, clearWishlist } = useWishlistStore();
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Wishlist</h1>
        </div>
        <ProductGridSkeleton count={4} />
      </div>
    );
  }

  if (productIds.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-muted"
          >
            <Heart className="h-12 w-12 text-muted-foreground/50" />
          </motion.div>
          <h1 className="mt-6 text-2xl font-bold">Your wishlist is empty</h1>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            Tap the heart icon on products you love to save them here for later.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/?filter=all">
              <Sparkles className="mr-2 h-4 w-4" />
              Discover Products
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Wishlist</h1>
            <p className="text-muted-foreground">
              {productIds.length} {productIds.length === 1 ? "item" : "items"} saved
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={clearWishlist}>
            Clear All
          </Button>
          <Button asChild>
            <Link href="/?filter=all">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div
        variants={staggerContainer}
        className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={fadeInUp}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        variants={fadeInUp}
        className="mt-12 text-center rounded-2xl bg-gradient-to-r from-primary/10 to-orange-500/10 p-8"
      >
        <h2 className="text-xl font-bold">Ready to checkout?</h2>
        <p className="mt-2 text-muted-foreground">
          Add your favorites to cart and complete your order
        </p>
        <Button size="lg" className="mt-4" asChild>
          <Link href="/?filter=all">
            Shop Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
