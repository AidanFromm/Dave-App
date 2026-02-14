"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Product, Category } from "@/types/product";
import { formatCurrency } from "@/types/product";
import { Search, X, ChevronLeft, ChevronRight, Bell, Lock, ShieldCheck } from "lucide-react";

// ─── Constants ───
const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds
const DEFAULT_PIN = "1234";
const CHIME_FREQ = 880;

// ─── Chime (Web Audio) ───
function playChime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Play two-tone chime
    osc.frequency.setValueAtTime(CHIME_FREQ, ctx.currentTime);
    osc.frequency.setValueAtTime(CHIME_FREQ * 1.5, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio may not be available
  }
}

// ─── Types ───
interface KioskClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

type View = "home" | "detail" | "pin-gate";

// ─── Main Component ───
export function KioskClient({ initialProducts, initialCategories }: KioskClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<View>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [staffNotified, setStaffNotified] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const lastActivity = useRef(Date.now());
  const searchRef = useRef<HTMLInputElement>(null);

  // Track touch for swipe
  const touchStartX = useRef(0);

  // ─── Idle timeout ───
  const resetIdle = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ["touchstart", "touchmove", "click", "keydown", "scroll"] as const;
    const handler = () => resetIdle();
    events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > IDLE_TIMEOUT_MS) {
        // Return to home
        setView("home");
        setSelectedProduct(null);
        setSearchQuery("");
        setActiveCategory(null);
        setImageIndex(0);
      }
    }, 5000);
    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      clearInterval(timer);
    };
  }, [resetIdle]);

  // ─── Auto-refresh inventory ───
  useEffect(() => {
    const supabase = createClient();
    const refresh = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) setProducts(data as Product[]);
    };
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // ─── Filtered products ───
  const filtered = useMemo(() => {
    let list = products.filter((p) => p.quantity > 0);
    if (activeCategory) {
      list = list.filter((p) => p.category_id === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, activeCategory, searchQuery]);

  // ─── Category tabs (map to known names) ───
  const categoryTabs = useMemo(() => {
    const order = ["sneakers", "pokemon", "accessories"];
    const sorted = [...categories].sort((a, b) => {
      const ai = order.findIndex((o) => a.slug?.toLowerCase().includes(o) || a.name.toLowerCase().includes(o));
      const bi = order.findIndex((o) => b.slug?.toLowerCase().includes(o) || b.name.toLowerCase().includes(o));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return sorted;
  }, [categories]);

  // ─── Handlers ───
  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    setImageIndex(0);
    setView("detail");
    setStaffNotified(false);
    resetIdle();
  };

  const handleStaffHelp = () => {
    playChime();
    setStaffNotified(true);
    setTimeout(() => setStaffNotified(false), 5000);
  };

  const handleSwipeStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleSwipeEnd = (e: React.TouchEvent, maxImages: number) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && imageIndex < maxImages - 1) setImageIndex((i) => i + 1);
      if (diff < 0 && imageIndex > 0) setImageIndex((i) => i - 1);
    }
  };

  // ─── PIN gate (exit kiosk) ───
  if (view === "pin-gate") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-[#002244] p-8">
        <Lock className="h-16 w-16 text-[#FB4F14]" />
        <h1 className="font-display text-4xl font-bold text-white">Enter Admin PIN</h1>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-16 w-16 rounded-xl border-2 ${
                pinInput.length > i ? "border-[#FB4F14] bg-[#FB4F14]/20" : "border-white/30"
              } flex items-center justify-center text-3xl font-bold text-white`}
            >
              {pinInput.length > i ? "●" : ""}
            </div>
          ))}
        </div>
        {pinError && <p className="text-lg font-bold text-red-400">Incorrect PIN</p>}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((key, idx) => (
            <button
              key={idx}
              className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold ${
                key === null
                  ? "invisible"
                  : "bg-white/10 text-white active:bg-[#FB4F14] active:text-white"
              }`}
              onTouchEnd={() => {
                if (key === null) return;
                setPinError(false);
                if (key === "⌫") {
                  setPinInput((p) => p.slice(0, -1));
                } else {
                  const next = pinInput + String(key);
                  if (next.length === 4) {
                    const stored = typeof window !== "undefined" ? localStorage.getItem("kiosk_pin") || DEFAULT_PIN : DEFAULT_PIN;
                    if (next === stored) {
                      window.location.href = "/";
                    } else {
                      setPinError(true);
                      setPinInput("");
                    }
                  } else {
                    setPinInput(next);
                  }
                }
              }}
              onClick={() => {
                if (key === null) return;
                setPinError(false);
                if (key === "⌫") {
                  setPinInput((p) => p.slice(0, -1));
                } else {
                  const next = pinInput + String(key);
                  if (next.length === 4) {
                    const stored = typeof window !== "undefined" ? localStorage.getItem("kiosk_pin") || DEFAULT_PIN : DEFAULT_PIN;
                    if (next === stored) {
                      window.location.href = "/";
                    } else {
                      setPinError(true);
                      setPinInput("");
                    }
                  } else {
                    setPinInput(next);
                  }
                }
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <button
          className="mt-4 rounded-xl bg-white/10 px-8 py-4 text-lg font-bold text-white active:bg-white/20"
          onClick={() => { setView("home"); setPinInput(""); setPinError(false); }}
        >
          Cancel
        </button>
      </div>
    );
  }

  // ─── Product Detail ───
  if (view === "detail" && selectedProduct) {
    const images = selectedProduct.images?.length ? selectedProduct.images : [];
    return (
      <div className="flex h-full w-full flex-col bg-[#002244] text-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            className="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-4 text-lg font-bold active:bg-white/20"
            onClick={() => { setView("home"); setSelectedProduct(null); }}
          >
            <ChevronLeft className="h-6 w-6" /> Back
          </button>
          <button
            className={`flex items-center gap-3 rounded-xl px-8 py-4 text-lg font-bold transition-colors ${
              staffNotified ? "bg-green-600 text-white" : "bg-[#FB4F14] text-white active:bg-[#FB4F14]/80"
            }`}
            onClick={handleStaffHelp}
          >
            <Bell className="h-6 w-6" />
            {staffNotified ? "Staff Notified!" : "Ask Staff for Help"}
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Image area */}
          <div className="flex w-1/2 flex-col items-center justify-center p-6">
            {images.length > 0 ? (
              <div
                className="relative aspect-square w-full max-w-[500px] overflow-hidden rounded-2xl bg-white/5"
                onTouchStart={handleSwipeStart}
                onTouchEnd={(e) => handleSwipeEnd(e, images.length)}
              >
                <Image
                  src={images[imageIndex]}
                  alt={selectedProduct.name}
                  fill
                  className="object-contain p-4"
                  sizes="500px"
                  priority
                />
                {/* Image dots */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        className={`h-3 w-3 rounded-full ${i === imageIndex ? "bg-[#FB4F14]" : "bg-white/40"}`}
                        onClick={() => setImageIndex(i)}
                      />
                    ))}
                  </div>
                )}
                {/* Arrow buttons */}
                {imageIndex > 0 && (
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 active:bg-black/70"
                    onClick={() => setImageIndex((i) => i - 1)}
                  >
                    <ChevronLeft className="h-8 w-8 text-white" />
                  </button>
                )}
                {imageIndex < images.length - 1 && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 active:bg-black/70"
                    onClick={() => setImageIndex((i) => i + 1)}
                  >
                    <ChevronRight className="h-8 w-8 text-white" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex aspect-square w-full max-w-[500px] items-center justify-center rounded-2xl bg-white/5">
                <span className="text-2xl text-white/30">No Image</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex w-1/2 flex-col gap-6 overflow-y-auto p-8">
            {selectedProduct.brand && (
              <span className="text-lg font-bold uppercase tracking-widest text-[#FB4F14]">
                {selectedProduct.brand}
              </span>
            )}
            <h1 className="font-display text-5xl font-bold leading-tight">{selectedProduct.name}</h1>
            <p className="font-display text-4xl font-bold text-[#FB4F14]">
              {formatCurrency(selectedProduct.price)}
            </p>
            {selectedProduct.compare_at_price && selectedProduct.compare_at_price > selectedProduct.price && (
              <p className="text-xl text-white/50 line-through">
                {formatCurrency(selectedProduct.compare_at_price)}
              </p>
            )}

            {/* Size */}
            {selectedProduct.size && (
              <div>
                <h3 className="mb-3 text-xl font-bold text-white/70">Size</h3>
                <div className="inline-flex min-h-[64px] items-center rounded-xl bg-white/10 px-8 text-2xl font-bold">
                  {selectedProduct.size}
                </div>
              </div>
            )}

            {/* Condition */}
            <div>
              <h3 className="mb-3 text-xl font-bold text-white/70">Condition</h3>
              <div className="inline-flex min-h-[64px] items-center rounded-xl bg-white/10 px-8 text-2xl font-bold capitalize">
                {selectedProduct.condition.replace(/_/g, " ")}
              </div>
            </div>

            {/* Colorway */}
            {selectedProduct.colorway && (
              <div>
                <h3 className="mb-3 text-xl font-bold text-white/70">Colorway</h3>
                <p className="text-2xl">{selectedProduct.colorway}</p>
              </div>
            )}

            {/* Description */}
            {selectedProduct.description && (
              <div>
                <h3 className="mb-3 text-xl font-bold text-white/70">Description</h3>
                <p className="text-lg leading-relaxed text-white/80">{selectedProduct.description}</p>
              </div>
            )}

            {/* Stock indicator */}
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-green-400" />
              <span className="text-lg font-bold text-green-400">
                {selectedProduct.quantity > 0 ? "In Stock" : "Sold Out"}
              </span>
            </div>

            {/* Staff help (bottom) */}
            <button
              className={`mt-auto flex min-h-[72px] w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold transition-colors ${
                staffNotified ? "bg-green-600 text-white" : "bg-[#FB4F14] text-white active:bg-[#FB4F14]/80"
              }`}
              onClick={handleStaffHelp}
            >
              <Bell className="h-7 w-7" />
              {staffNotified ? "Staff Has Been Notified!" : "Ask Staff for Help"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Home / Browse ───
  return (
    <div className="flex h-full w-full flex-col bg-[#002244] text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            <span className="text-[#FB4F14]">SECURED</span> TAMPA
          </h1>
          <span className="rounded-full bg-[#FB4F14]/20 px-4 py-1 text-sm font-bold text-[#FB4F14]">
            IN-STORE
          </span>
        </div>
        {/* Exit button (hidden, small) */}
        <button
          className="rounded-lg p-2 text-white/20 active:text-white/60"
          onClick={() => { setView("pin-gate"); setPinInput(""); setPinError(false); }}
        >
          <Lock className="h-5 w-5" />
        </button>
      </div>

      {/* Search + Category Tabs */}
      <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-white/40" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search sneakers, Pokémon, accessories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 w-full rounded-2xl bg-white/10 pl-14 pr-14 text-xl font-medium text-white placeholder:text-white/40 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#FB4F14]"
          />
          {searchQuery && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 active:bg-white/30"
              onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
            >
              <X className="h-5 w-5 text-white" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <button
            className={`flex min-h-[56px] min-w-[120px] items-center justify-center whitespace-nowrap rounded-2xl px-8 text-lg font-bold transition-colors ${
              activeCategory === null ? "bg-[#FB4F14] text-white" : "bg-white/10 text-white/70 active:bg-white/20"
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categoryTabs.map((cat) => (
            <button
              key={cat.id}
              className={`flex min-h-[56px] min-w-[120px] items-center justify-center whitespace-nowrap rounded-2xl px-8 text-lg font-bold transition-colors ${
                activeCategory === cat.id ? "bg-[#FB4F14] text-white" : "bg-white/10 text-white/70 active:bg-white/20"
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <Search className="h-16 w-16 text-white/20" />
            <p className="text-2xl font-bold text-white/40">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <button
                key={product.id}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white/5 text-left active:bg-white/10"
                onClick={() => openProduct(product)}
              >
                {/* Image */}
                <div className="relative aspect-square w-full bg-white/5">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/20 text-lg">
                      No Image
                    </div>
                  )}
                  {/* Badges */}
                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    {product.is_drop && (
                      <span className="rounded-lg bg-[#FB4F14] px-2 py-1 text-xs font-bold uppercase">
                        Drop
                      </span>
                    )}
                    {product.quantity <= (product.low_stock_threshold || 3) && product.quantity > 0 && (
                      <span className="rounded-lg bg-yellow-500 px-2 py-1 text-xs font-bold uppercase text-black">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 p-4">
                  {product.brand && (
                    <span className="text-xs font-bold uppercase tracking-wider text-[#FB4F14]">
                      {product.brand}
                    </span>
                  )}
                  <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug">
                    {product.name}
                  </h3>
                  <div className="mt-auto flex items-baseline gap-2 pt-2">
                    <span className="text-xl font-bold text-[#FB4F14]">
                      {formatCurrency(product.price)}
                    </span>
                    {product.size && (
                      <span className="text-sm text-white/50">Size {product.size}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar - staff help */}
      <div className="border-t border-white/10 px-6 py-4">
        <button
          className={`flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold transition-colors ${
            staffNotified ? "bg-green-600 text-white" : "bg-[#FB4F14] text-white active:bg-[#FB4F14]/80"
          }`}
          onClick={handleStaffHelp}
        >
          <Bell className="h-7 w-7" />
          {staffNotified ? "Staff Has Been Notified!" : "Need Help? Tap Here!"}
        </button>
      </div>
    </div>
  );
}
