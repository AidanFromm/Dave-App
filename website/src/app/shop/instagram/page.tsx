"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  category_id: string | null;
}

export default function ShopInstagramPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, price, images, category_id")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);
      setProducts(data ?? []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Hero */}
      <div className="border-b border-surface-800/50 bg-surface-900/50">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] mb-6">
            <Instagram className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-foreground">
            Shop Our Instagram
          </h1>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            See something you like on our feed? Find it here and add it to your cart.
          </p>
          <a
            href="https://instagram.com/securedtampa"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            @securedtampa <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-surface-800/50 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No products available right now.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-surface-800/50 border border-surface-800/50 hover:border-primary/30 transition-all"
              >
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                  <p className="text-white/80 text-xs">${(product.price / 100).toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
