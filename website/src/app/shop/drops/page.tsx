"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Clock, Flame, Check, ArrowRight } from "lucide-react";

interface Drop {
  id: string;
  title: string;
  description: string | null;
  drop_date: string;
  image_url: string | null;
  is_active: boolean;
  product_id: string | null;
  products: { id: string; name: string; price: number; images: string[] } | null;
}

function Countdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const distance = targetDate.getTime() - now;
      if (distance < 0) {
        setIsLive(true);
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

  if (isLive) {
    return (
      <Badge className="bg-green-500 text-white text-sm px-3 py-1">LIVE NOW</Badge>
    );
  }

  return (
    <div className="flex gap-2">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map((item, i) => (
        <div key={i} className="text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#002244] font-mono text-xl font-bold text-white">
            {String(item.value).padStart(2, "0")}
          </div>
          <span className="mt-1 text-[10px] text-muted-foreground uppercase">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function NotifyButton({ dropId }: { dropId: string }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleSubscribe = async () => {
    if (!email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/drops/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dropId }),
      });
      if (!res.ok) throw new Error();
      setSubscribed(true);
      toast.success("You'll be notified when this drops!");
    } catch {
      toast.error("Failed to subscribe");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
        <Check className="h-4 w-4" />
        Subscribed
      </div>
    );
  }

  if (!showInput) {
    return (
      <Button size="sm" variant="outline" onClick={() => setShowInput(true)}>
        <Bell className="mr-2 h-4 w-4" />
        Notify Me
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
        className="h-9 text-sm w-48"
      />
      <Button size="sm" onClick={handleSubscribe} disabled={loading}>
        {loading ? "..." : "Notify"}
      </Button>
    </div>
  );
}

export default function ShopDropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/drops");
        if (res.ok) {
          const data = await res.json();
          setDrops((data.drops ?? []).filter((d: Drop) => d.is_active));
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const upcoming = drops.filter((d) => new Date(d.drop_date) > new Date());
  const past = drops.filter((d) => new Date(d.drop_date) <= new Date());

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FB4F14]/10 px-4 py-2 text-sm font-medium text-[#FB4F14] mb-4">
          <Flame className="h-4 w-4" />
          Release Calendar
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Upcoming Drops
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Limited releases dropping soon. Sign up to get notified the moment they go live.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : drops.length === 0 ? (
        <div className="text-center py-20">
          <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No drops scheduled</h3>
          <p className="text-muted-foreground mt-2">Check back soon for upcoming releases.</p>
          <Button asChild className="mt-6">
            <Link href="/">Shop All Products</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Coming Soon</h2>
              <div className="space-y-6">
                {upcoming.map((drop) => (
                  <div
                    key={drop.id}
                    className="rounded-2xl border bg-card overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="relative w-full md:w-64 h-48 md:h-auto bg-muted flex-shrink-0">
                        {(drop.image_url || drop.products?.images?.[0]) ? (
                          <Image
                            src={drop.image_url || drop.products!.images[0]}
                            alt={drop.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Flame className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold">{drop.title}</h3>
                          {drop.description && (
                            <p className="mt-2 text-muted-foreground text-sm">{drop.description}</p>
                          )}
                          <p className="mt-2 text-sm text-muted-foreground">
                            <Clock className="inline h-4 w-4 mr-1" />
                            {new Date(drop.drop_date).toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                          <Countdown targetDate={new Date(drop.drop_date)} />
                          <NotifyButton dropId={drop.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past / Live */}
          {past.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-6">Recent Drops</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((drop) => (
                  <div key={drop.id} className="rounded-xl border bg-card p-4 flex gap-4">
                    <div className="relative h-20 w-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {(drop.image_url || drop.products?.images?.[0]) ? (
                        <Image
                          src={drop.image_url || drop.products!.images[0]}
                          alt={drop.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Flame className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{drop.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Dropped {new Date(drop.drop_date).toLocaleDateString()}
                      </p>
                      {drop.product_id && (
                        <Button size="sm" variant="outline" className="mt-2" asChild>
                          <Link href={`/product/${drop.product_id}`}>
                            Shop Now <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
