"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import type { Product, Category } from "@/types/product";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  gradient: string;
  delay?: number;
}

function CategoryCard({ title, description, icon, href, gradient, delay = 0 }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Link href={href}>
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className={`group relative overflow-hidden rounded-2xl p-8 h-64 ${gradient} cursor-pointer`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/20" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
              <p className="text-white/80 text-sm">{description}</p>
            </div>
          </div>
          
          {/* Hover arrow */}
          <motion.div
            className="absolute right-6 bottom-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ x: 4 }}
          >
            <ArrowRight className="h-5 w-5 text-white" />
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products?featured=true&limit=8");
        if (res.ok) {
          const data = await res.json();
          setFeaturedProducts(data.products?.slice(0, 4) ?? []);
          setNewArrivals(data.products?.slice(0, 8) ?? []);
        }
      } catch {
        console.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            {/* Left content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                <Flame className="h-4 w-4" />
                Tampa&apos;s Premier Sneaker & Card Shop
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block">Authentic Heat.</span>
                <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Secured for You.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Premium sneakers and Pokémon cards, authenticated and ready to ship. 
                Join thousands of collectors who trust Secured Tampa.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild className="text-base h-12 px-8">
                  <Link href="/?filter=all">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-8">
                  <Link href="/drops">
                    View Drops
                    <Clock className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  100% Authentic
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Fast Shipping
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Secure Checkout
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Featured product showcase */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative mx-auto w-full max-w-lg">
                {/* Main featured card */}
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-muted to-muted/50 shadow-2xl">
                  {featuredProducts[0]?.images?.[0] ? (
                    <Image
                      src={featuredProducts[0].images[0]}
                      alt={featuredProducts[0].name}
                      fill
                      className="object-contain p-8"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Sparkles className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  )}
                  
                  {/* Product info overlay */}
                  {featuredProducts[0] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <p className="text-sm text-white/70">{featuredProducts[0].brand}</p>
                      <h3 className="text-xl font-bold text-white line-clamp-1">{featuredProducts[0].name}</h3>
                      <p className="text-lg font-semibold text-primary mt-1">
                        ${featuredProducts[0].price.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Floating mini cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute -left-8 top-1/4 hidden lg:block"
                >
                  <div className="h-24 w-24 overflow-hidden rounded-xl bg-card shadow-xl">
                    {featuredProducts[1]?.images?.[0] && (
                      <Image
                        src={featuredProducts[1].images[0]}
                        alt=""
                        width={96}
                        height={96}
                        className="h-full w-full object-contain p-2"
                      />
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -right-8 bottom-1/4 hidden lg:block"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-card shadow-xl">
                    {featuredProducts[2]?.images?.[0] && (
                      <Image
                        src={featuredProducts[2].images[0]}
                        alt=""
                        width={80}
                        height={80}
                        className="h-full w-full object-contain p-2"
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold">Shop by Category</h2>
          <p className="mt-2 text-muted-foreground">Find exactly what you&apos;re looking for</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CategoryCard
            title="Sneakers"
            description="Jordan, Nike, Yeezy, and more heat"
            icon={<Flame className="h-7 w-7 text-white" />}
            href="/?filter=new"
            gradient="bg-gradient-to-br from-primary to-orange-600"
            delay={0}
          />
          <CategoryCard
            title="Pokémon"
            description="Cards, sealed product, and graded slabs"
            icon={<Sparkles className="h-7 w-7 text-white" />}
            href="/?filter=pokemon"
            gradient="bg-gradient-to-br from-blue-600 to-purple-600"
            delay={0.1}
          />
          <CategoryCard
            title="New Arrivals"
            description="Fresh drops, just landed"
            icon={<Clock className="h-7 w-7 text-white" />}
            href="/?filter=drops"
            gradient="bg-gradient-to-br from-green-600 to-teal-600"
            delay={0.2}
          />
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-3xl font-bold">New Arrivals</h2>
              <p className="mt-1 text-muted-foreground">The latest heat in stock</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/?filter=all">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>

          {loading ? (
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : newArrivals.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid gap-6 grid-cols-2 lg:grid-cols-4"
            >
              {newArrivals.slice(0, 4).map((product, i) => (
                <motion.div key={product.id} variants={scaleIn}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Check back soon for new arrivals!
            </div>
          )}
        </div>
      </section>

      {/* Drops CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-orange-600 p-8 sm:p-12"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/30" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-white/20" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white mb-4">
                <Flame className="h-4 w-4" />
                Exclusive Drops
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Never Miss a Drop
              </h2>
              <p className="mt-3 text-lg text-white/80 max-w-lg">
                Get notified when we release limited sneakers and rare cards. 
                Be first in line for the hottest releases.
              </p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="h-14 px-8 text-base font-semibold"
            >
              <Link href="/drops">
                View Upcoming Drops
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer spacer */}
      <div className="h-8" />
    </div>
  );
}
