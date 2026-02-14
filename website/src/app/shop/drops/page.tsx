"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Flame, ArrowRight, Package } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types/product";
import { getDropStatus, getDropRemainingQuantity, formatCurrency } from "@/types/product";

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const distance = targetDate.getTime() - Date.now();
      if (distance < 0) { setIsLive(true); clearInterval(timer); return; }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isLive) return <Badge className="bg-green-500 text-white text-sm px-3 py-1">LIVE NOW</Badge>;

  return (
    <div className="flex gap-1.5 sm:gap-2">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#002244] font-mono text-base sm:text-xl font-bold text-white border border-[#FB4F14]/20">
            {String(item.value).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] text-muted-foreground uppercase">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function ShopDropsPage() {
  const [liveDrops, setLiveDrops] = useState<Product[]>([]);
  const [upcomingDrops, setUpcomingDrops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [liveRes, upRes] = await Promise.all([
          fetch("/api/products?drops=true&limit=50"),
          fetch("/api/products/upcoming-drops"),
        ]);
        if (liveRes.ok) {
          const data = await liveRes.json();
          setLiveDrops((data.products ?? []).filter((p: Product) => getDropStatus(p) === "live"));
        }
        if (upRes.ok) {
          const data = await upRes.json();
          setUpcomingDrops(data.products ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FB4F14]/10 px-4 py-2 text-sm font-medium text-[#FB4F14] mb-4">
          <Flame className="h-4 w-4" />
          Exclusive Releases
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Drops</h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Limited releases -- exclusive pricing, limited quantities. When they're gone, they're gone.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : liveDrops.length === 0 && upcomingDrops.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No drops scheduled</h3>
          <p className="text-muted-foreground mt-2">Check back soon for upcoming releases.</p>
          <Button asChild className="mt-6 bg-[#FB4F14] hover:bg-[#FB4F14]/90">
            <Link href="/">Shop All Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Upcoming */}
          {upcomingDrops.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Coming Soon
              </h2>
              <div className="space-y-6">
                {upcomingDrops.map((product) => {
                  const remaining = getDropRemainingQuantity(product);
                  return (
                    <div key={product.id} className="rounded-2xl border border-[#FB4F14]/20 bg-card p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div>
                          <Badge className="bg-blue-500/15 text-blue-400 mb-2">Upcoming</Badge>
                          <h3 className="text-lg font-bold">{product.name}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {product.drop_starts_at && new Date(product.drop_starts_at).toLocaleDateString("en-US", {
                                weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })}
                            </span>
                            {remaining !== null && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {remaining} available
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-bold text-[#FB4F14]">
                            {formatCurrency(product.drop_price ?? product.price)}
                            {product.drop_price != null && product.drop_price !== product.price && (
                              <span className="ml-2 text-sm text-muted-foreground line-through font-normal">{formatCurrency(product.price)}</span>
                            )}
                          </p>
                        </div>
                        {product.drop_starts_at && (
                          <Countdown targetDate={new Date(product.drop_starts_at)} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Drops */}
          {liveDrops.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#FB4F14]" />
                Live Now
              </h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {liveDrops.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
