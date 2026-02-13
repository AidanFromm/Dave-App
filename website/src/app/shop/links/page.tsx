"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Sparkles, Instagram, Mail, MapPin, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
}

const QUICK_LINKS = [
  { href: "/", label: "Shop All", icon: ShoppingBag },
  { href: "/drops", label: "New Arrivals", icon: Sparkles },
  { href: "/pokemon", label: "Pokemon Cards", icon: ShoppingBag },
  { href: "/contact", label: "Contact Us", icon: Mail },
  { href: "/shop/instagram", label: "Shop Our Instagram", icon: Instagram },
];

export default function LinksPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, price, images")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      setProducts(data ?? []);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center">
      <div className="w-full max-w-md px-4 py-12">
        {/* Profile */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-[#002244] mx-auto flex items-center justify-center mb-4">
            <span className="font-display text-xl font-bold text-white">ST</span>
          </div>
          <h1 className="font-display text-xl font-bold uppercase tracking-tight text-foreground">
            <span>SECURED</span>
            <span className="text-primary">TAMPA</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Authentic Sneakers & Pokemon Cards</p>
          <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> Tampa, FL
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-3 mb-10">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 w-full px-5 py-3.5 rounded-xl border border-surface-800 bg-surface-900/80 hover:bg-surface-800 hover:border-primary/30 transition-all text-sm font-semibold text-foreground"
            >
              <link.icon className="h-4 w-4 text-primary" />
              {link.label}
              <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            </Link>
          ))}
        </div>

        {/* Featured Products */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-4 text-center">
              Featured Products
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group rounded-xl overflow-hidden border border-surface-800 bg-surface-900/50 hover:border-primary/30 transition-all"
                >
                  <div className="relative aspect-square">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="50vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-surface-800/50 text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-primary font-semibold">${(product.price / 100).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Social */}
        <div className="mt-10 text-center">
          <a
            href="https://instagram.com/securedtampa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Instagram className="h-4 w-4" /> @securedtampa
          </a>
        </div>
      </div>
    </div>
  );
}
