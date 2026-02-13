"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Clock,
  Bell,
  ArrowRight,
  Timer,
  Check,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { getDropStatus, getDropRemainingQuantity, formatCurrency } from "@/types/product";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = targetDate.getTime() - Date.now();
      if (distance < 0) { clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hours" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#002244] font-mono text-2xl font-bold text-white border border-[#FB4F14]/20">
            {String(item.value).padStart(2, "0")}
          </div>
          <span className="mt-1 text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DropsPage() {
  const [liveDrops, setLiveDrops] = useState<Product[]>([]);
  const [upcomingDrops, setUpcomingDrops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function loadDrops() {
      try {
        // Fetch all drop products
        const res = await fetch("/api/products?drops=true&limit=50");
        if (res.ok) {
          const data = await res.json();
          const products = (data.products ?? []) as Product[];
          setLiveDrops(products.filter((p) => getDropStatus(p) === "live"));
        }
        // Also fetch upcoming (drop_starts_at > now) - these won't show in the regular drops=true query
        // We need a separate approach for upcoming since they haven't started yet
        const upRes = await fetch("/api/products/upcoming-drops");
        if (upRes.ok) {
          const upData = await upRes.json();
          setUpcomingDrops(upData.products ?? []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadDrops();
  }, []);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch("/api/drops/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to subscribe");
      setSubscribed(true);
      toast.success("You're on the list! We'll notify you for upcoming drops.");
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FB4F14]/20 via-background to-[#002244]/30">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#FB4F14]/20 blur-3xl"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-[#FB4F14]/10 px-4 py-2 text-sm font-medium text-[#FB4F14] mb-6">
              <Flame className="h-4 w-4" />
              Exclusive Releases
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block">Limited</span>
              <span className="block bg-gradient-to-r from-[#FB4F14] via-orange-500 to-red-500 bg-clip-text text-transparent">
                Drops
              </span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Exclusive limited releases. When they're gone, they're gone.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Drops with Countdown */}
      {upcomingDrops.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Timer className="h-6 w-6 text-[#FB4F14]" />
            Coming Soon
          </h2>
          <div className="space-y-6">
            {upcomingDrops.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-[#FB4F14]/20 bg-card overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-blue-500/15 text-blue-400 mb-2">Upcoming</Badge>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {product.drop_starts_at && new Date(product.drop_starts_at).toLocaleDateString("en-US", {
                          weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </span>
                      {product.drop_quantity && (
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {product.drop_quantity} available
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-lg font-bold text-[#FB4F14]">
                      {formatCurrency(product.drop_price ?? product.price)}
                      {product.drop_price != null && product.drop_price !== product.price && (
                        <span className="ml-2 text-sm text-muted-foreground line-through font-normal">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </p>
                  </div>
                  {product.drop_starts_at && (
                    <Countdown targetDate={new Date(product.drop_starts_at)} />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Notification Signup */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-card p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FB4F14]/10">
                <Bell className="h-7 w-7 text-[#FB4F14]" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Never Miss a Drop</h3>
                <p className="text-muted-foreground">Get notified when new items release</p>
              </div>
            </div>
            {subscribed ? (
              <div className="flex items-center gap-2 text-green-500">
                <Check className="h-5 w-5" />
                <span className="font-medium">You're on the list!</span>
              </div>
            ) : (
              <form onSubmit={handleNotify} className="flex w-full md:w-auto gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full md:w-64"
                  required
                />
                <Button type="submit" className="bg-[#FB4F14] hover:bg-[#FB4F14]/90">Notify Me</Button>
              </form>
            )}
          </div>
        </motion.div>
      </section>

      {/* Live Drops */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Flame className="h-8 w-8 text-[#FB4F14]" />
              Live Drops
            </h2>
            <p className="mt-1 text-muted-foreground">Available now -- limited quantities</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/?tab=drops">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        {loading ? (
          <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : liveDrops.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {liveDrops.map((product) => (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Flame className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No live drops right now</h3>
            <p className="text-muted-foreground mt-2">Check back soon for exclusive releases.</p>
          </div>
        )}
      </section>

      {/* How Drops Work */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold">How Drops Work</h2>
            <p className="mt-2 text-muted-foreground">Simple steps to secure your heat</p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: <Bell className="h-8 w-8" />, title: "Get Notified", description: "Sign up for drop alerts and be the first to know when new items release.", gradient: "from-blue-500 to-cyan-500" },
              { icon: <Clock className="h-8 w-8" />, title: "Show Up Early", description: "Drops go live at scheduled times. Be ready -- limited items sell fast.", gradient: "from-[#FB4F14] to-orange-500" },
              { icon: <Check className="h-8 w-8" />, title: "Secure the Bag", description: "Add to cart and checkout quickly. Authenticity guaranteed on every item.", gradient: "from-green-500 to-emerald-500" },
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="text-center">
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-white mb-4`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to shop?</h2>
          <p className="text-muted-foreground mb-6">Browse our full collection of sneakers and cards.</p>
          <Button size="lg" asChild className="bg-[#FB4F14] hover:bg-[#FB4F14]/90">
            <Link href="/">
              Shop All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
