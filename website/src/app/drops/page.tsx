"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Flame, 
  Clock, 
  Bell, 
  CalendarDays, 
  ArrowRight,
  Sparkles,
  Timer,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
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

interface CountdownProps {
  targetDate: Date;
}

function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

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
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm font-mono text-2xl font-bold">
            {String(item.value).padStart(2, "0")}
          </div>
          <span className="mt-1 text-xs text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DropsPage() {
  const [recentDrops, setRecentDrops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Get next Friday at 6 PM for the "upcoming drop"
  const getNextDropDate = () => {
    const now = new Date();
    const nextFriday = new Date();
    nextFriday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7 || 7));
    nextFriday.setHours(18, 0, 0, 0);
    return nextFriday;
  };

  useEffect(() => {
    async function loadDrops() {
      try {
        const res = await fetch("/api/products?sort=newest&limit=12");
        if (res.ok) {
          const data = await res.json();
          setRecentDrops(data.products ?? []);
        }
      } catch {
        // Failed to load drops
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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-orange-500/10">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
              <Flame className="h-4 w-4 animate-pulse" />
              Exclusive Releases
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block">The Hottest</span>
              <span className="block bg-gradient-to-r from-primary via-orange-500 to-red-500 bg-clip-text text-transparent">
                Drops & Releases
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Be first in line for limited sneakers and rare Pokémon cards. 
              New drops every week — don't miss out on the heat.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Drop Countdown */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 sm:p-12"
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/30" />
            <div className="absolute -bottom-20 left-1/4 h-60 w-60 rounded-full bg-white/20" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white mb-4">
                <Timer className="h-4 w-4" />
                Next Drop
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Friday Night Heat
              </h2>
              <p className="mt-3 text-lg text-white/80 max-w-lg">
                New sneakers and cards dropping this Friday at 6 PM EST.
                Limited quantities — be ready!
              </p>
            </div>

            <div className="text-white">
              <Countdown targetDate={getNextDropDate()} />
            </div>
          </div>
        </motion.div>
      </section>

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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Bell className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Never Miss a Drop</h3>
                <p className="text-muted-foreground">Get notified when new items release</p>
              </div>
            </div>

            {subscribed ? (
              <div className="flex items-center gap-2 text-green-600">
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
                <Button type="submit">
                  Notify Me
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </section>

      {/* Recent Drops Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Recent Drops
            </h2>
            <p className="mt-1 text-muted-foreground">Fresh releases you might have missed</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/?filter=all">
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
        ) : recentDrops.length > 0 ? (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          >
            {recentDrops.map((product) => (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Flame className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No drops yet</h3>
            <p className="text-muted-foreground mt-2">Check back soon for fresh heat!</p>
          </div>
        )}
      </section>

      {/* How Drops Work */}
      <section className="bg-muted/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold">How Drops Work</h2>
            <p className="mt-2 text-muted-foreground">Simple steps to secure your heat</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Bell className="h-8 w-8" />,
                title: "Get Notified",
                description: "Sign up for drop alerts and be the first to know when new items release.",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Clock className="h-8 w-8" />,
                title: "Show Up Early",
                description: "Drops go live at scheduled times. Be ready — limited items sell fast!",
                gradient: "from-primary to-orange-500",
              },
              {
                icon: <Check className="h-8 w-8" />,
                title: "Secure the Bag",
                description: "Add to cart and checkout quickly. Authenticity guaranteed on every item.",
                gradient: "from-green-500 to-emerald-500",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-center">
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-white mb-4`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to shop?</h2>
          <p className="text-muted-foreground mb-6">Browse our full collection of sneakers and cards.</p>
          <Button size="lg" asChild>
            <Link href="/?filter=all">
              Shop All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
