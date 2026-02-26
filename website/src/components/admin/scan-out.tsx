"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { BarcodeScannerInput } from "@/components/admin/barcode-scanner-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  X,
  DollarSign,
  Printer,
  QrCode,
  ImageOff,
  Search,
  ScanBarcode,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Delete,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TAX_RATE } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  brand: string | null;
  size: string | null;
  cost: number;
  price: number;
  image_urls: string[] | null;
  images?: string[] | null;
  quantity: number;
  barcode?: string | null;
  condition?: string | null;
}

interface CartItem {
  product: Product;
  sellPrice: number;
  qty: number;
  cartId: string; // unique per cart entry
}

type PaymentMethod = "cash" | "stripe";
type PosView = "register" | "checkout" | "qr" | "success";
type FinderMode = "scan" | "search";

// ─── Helpers ─────────────────────────────────────────────────

function getImage(p: Product): string | null {
  const imgs = p.image_urls || p.images;
  return Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

let _cartSeq = 0;
function cartId() {
  return `c_${Date.now()}_${++_cartSeq}`;
}

// beep on scan
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

// ─── Component ───────────────────────────────────────────────

export function ScanOut() {
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [view, setView] = useState<PosView>("register");
  const [finderMode, setFinderMode] = useState<FinderMode>("scan");

  // Product finder
  const [scanLoading, setScanLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Checkout
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashInput, setCashInput] = useState("");
  const [processing, setProcessing] = useState(false);

  // Stripe QR
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrCountdown, setQrCountdown] = useState(1800);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Success
  const [successData, setSuccessData] = useState<{
    orderNumber: string;
    items: { name: string; size?: string; price: number; qty: number }[];
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
    change?: number;
  } | null>(null);

  // Price editing
  const [editingCartId, setEditingCartId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  // Derived
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.sellPrice * i.qty, 0),
    [cart]
  );
  const tax = useMemo(
    () => Math.round(subtotal * TAX_RATE * 100) / 100,
    [subtotal]
  );
  const total = useMemo(
    () => Math.round((subtotal + tax) * 100) / 100,
    [subtotal, tax]
  );
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  const cashReceived = parseFloat(cashInput) || 0;
  const changeDue = Math.max(0, Math.round((cashReceived - total) * 100) / 100);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ─── Product Finder ──────────────────────────────────────

  const addToCart = useCallback((product: Product) => {
    beep();
    setCart((prev) => {
      // If same product already in cart, bump qty
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product,
          sellPrice: product.price || 0,
          qty: 1,
          cartId: cartId(),
        },
      ];
    });
    toast.success("Added to cart", { description: product.name, duration: 1500 });
  }, []);

  const handleScan = useCallback(
    async (barcode: string) => {
      setScanLoading(true);
      try {
        const res = await fetch(
          `/api/admin/products/search-barcode?q=${encodeURIComponent(barcode)}`
        );
        if (!res.ok) {
          toast.error("Product not found", { description: `Barcode: ${barcode}` });
          setScanLoading(false);
          return;
        }
        const data = await res.json();
        addToCart(data.product);
      } catch {
        toast.error("Failed to look up product");
      }
      setScanLoading(false);
    },
    [addToCart]
  );

  const searchInventory = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/admin/products?search=${encodeURIComponent(query)}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || data || []);
      }
    } catch {}
    setSearching(false);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInventory(value), 300);
  };

  // ─── Cart Operations ────────────────────────────────────

  const removeItem = (cid: string) => {
    setCart((prev) => prev.filter((i) => i.cartId !== cid));
  };

  const updateQty = (cid: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.cartId === cid ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const updatePrice = (cid: string, price: number) => {
    setCart((prev) =>
      prev.map((i) => (i.cartId === cid ? { ...i, sellPrice: price } : i))
    );
    setEditingCartId(null);
  };

  const clearCart = () => {
    setCart([]);
    setView("register");
  };

  // ─── Checkout ────────────────────────────────────────────

  const startCheckout = () => {
    if (cart.length === 0) return;
    setView("checkout");
    setCashInput("");
    setPaymentMethod("cash");
  };

  const handleCashSale = async () => {
    if (cart.length === 0 || cashReceived < total) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/pos/sell-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            brand: i.product.brand,
            size: i.product.size,
            price: i.sellPrice,
            quantity: i.qty,
            image_url: getImage(i.product),
          })),
          subtotal,
          tax,
          total,
          paymentMethod: "cash",
          amountReceived: cashReceived,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Sale failed");
        setProcessing(false);
        return;
      }
      setSuccessData({
        orderNumber: data.orderNumber,
        items: cart.map((i) => ({
          name: i.product.name,
          size: i.product.size || undefined,
          price: i.sellPrice,
          qty: i.qty,
        })),
        subtotal,
        tax,
        total,
        paymentMethod: "cash",
        change: data.change,
      });
      setView("success");
    } catch {
      toast.error("Network error");
    }
    setProcessing(false);
  };

  const handleStripeQR = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      // For stripe, create a session for the whole cart
      // Use the first item's image as representative
      const firstItem = cart[0];
      const cartDescription =
        cart.length === 1
          ? firstItem.product.name
          : `${cart.length} items from SecuredTampa`;
      const imageUrl = getImage(firstItem.product) || undefined;

      const res = await fetch("/api/admin/pos/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: firstItem.product.id,
          productName: cartDescription,
          sellPrice: subtotal,
          tax,
          total,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create payment");
        setProcessing(false);
        return;
      }

      // Generate QR
      const QRCode = (await import("qrcode")).default;
      const qrUrl = await QRCode.toDataURL(data.sessionUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#002244", light: "#FFFFFF" },
      });
      setQrDataUrl(qrUrl);
      setQrCountdown(1800);
      setView("qr");

      // Countdown
      countdownRef.current = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
            toast.error("Payment session expired");
            setView("checkout");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Poll
      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(
            `/api/admin/pos/check-payment?sessionId=${data.sessionId}`
          );
          const checkData = await checkRes.json();
          if (checkData.status === "paid") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);

            // Also record the cart sale
            await fetch("/api/admin/pos/sell-cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: cart.map((i) => ({
                  productId: i.product.id,
                  name: i.product.name,
                  brand: i.product.brand,
                  size: i.product.size,
                  price: i.sellPrice,
                  quantity: i.qty,
                  image_url: getImage(i.product),
                })),
                subtotal,
                tax,
                total,
                paymentMethod: "stripe",
              }),
            });

            setSuccessData({
              orderNumber: checkData.orderNumber || `ST-${Date.now()}`,
              items: cart.map((i) => ({
                name: i.product.name,
                size: i.product.size || undefined,
                price: i.sellPrice,
                qty: i.qty,
              })),
              subtotal,
              tax,
              total,
              paymentMethod: "stripe",
            });
            setView("success");
          } else if (checkData.status === "expired") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            toast.error("Payment expired");
            setView("checkout");
          }
        } catch {}
      }, 5000);
    } catch {
      toast.error("Network error");
    }
    setProcessing(false);
  };

  // ─── Receipt ─────────────────────────────────────────────

  const handlePrintReceipt = async () => {
    if (!successData) return;
    try {
      const res = await fetch("/api/admin/pos/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...successData,
          itemName: successData.items.map((i) => i.name).join(", "),
          price: successData.subtotal,
          date: new Date().toISOString(),
        }),
      });
      const html = await res.text();
      const win = window.open("", "_blank", "width=320,height=600");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch {
      toast.error("Failed to generate receipt");
    }
  };

  // ─── Reset ───────────────────────────────────────────────

  const resetAll = () => {
    setCart([]);
    setView("register");
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setCashInput("");
    setSuccessData(null);
    setQrDataUrl("");
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // Cash quick buttons
  const cashDenoms = [1, 5, 10, 20, 50, 100];
  const exactButton = total;

  // numpad for cash
  const handleNumpad = (key: string) => {
    if (key === "clear") {
      setCashInput("");
    } else if (key === "back") {
      setCashInput((prev) => prev.slice(0, -1));
    } else if (key === ".") {
      if (!cashInput.includes(".")) setCashInput((prev) => prev + ".");
    } else {
      setCashInput((prev) => prev + key);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────

  // ──── SUCCESS VIEW ────
  if (view === "success" && successData) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Success icon */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
              <Check className="h-10 w-10 text-white" strokeWidth={3} />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-green-500">Sale Complete</h2>
              <p className="mt-1 text-base text-muted-foreground">
                Order {successData.orderNumber}
              </p>
            </div>
          </div>

          {/* Receipt summary */}
          <div className="rounded-2xl border-2 border-border bg-card p-5 space-y-3">
            {successData.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="truncate pr-4">
                  {item.name}
                  {item.size ? ` (${item.size})` : ""}
                  {item.qty > 1 ? ` x${item.qty}` : ""}
                </span>
                <span className="font-semibold tabular-nums">
                  {money(item.price * item.qty)}
                </span>
              </div>
            ))}
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(successData.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (7.5%)</span>
              <span className="tabular-nums">{money(successData.tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums">{money(successData.total)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span>Payment</span>
              <span className="font-semibold">
                {successData.paymentMethod === "cash" ? "Cash" : "Stripe"}
              </span>
            </div>
            {successData.change !== undefined && successData.change > 0 && (
              <div className="flex justify-between text-lg font-bold text-green-500">
                <span>Change Due</span>
                <span className="tabular-nums">{money(successData.change)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handlePrintReceipt}
              variant="outline"
              className="h-14 flex-1 text-base font-semibold rounded-xl"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print Receipt
            </Button>
            <Button
              onClick={resetAll}
              className="h-14 flex-1 bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-base font-semibold rounded-xl"
            >
              New Sale
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ──── QR VIEW ────
  if (view === "qr") {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <h2 className="text-2xl font-bold">Scan to Pay</h2>
            <p className="mt-1 text-3xl font-bold text-[#FB4F14] tabular-nums">
              {money(total)}
            </p>
          </div>

          {qrDataUrl && (
            <div className="mx-auto rounded-2xl border-4 border-[#002244] bg-white p-6 inline-block">
              <img src={qrDataUrl} alt="Payment QR" className="h-64 w-64" />
            </div>
          )}

          <div
            className={cn(
              "mx-auto inline-block rounded-full px-8 py-3 text-xl font-bold tabular-nums",
              qrCountdown > 300
                ? "bg-[#002244] text-white"
                : "bg-red-500 text-white animate-pulse"
            )}
          >
            {formatTime(qrCountdown)}
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Waiting for payment...</span>
          </div>

          <Button
            variant="outline"
            className="h-12 rounded-xl"
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              if (countdownRef.current) clearInterval(countdownRef.current);
              setView("checkout");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  // ──── CHECKOUT VIEW ────
  if (view === "checkout") {
    return (
      <div className="flex min-h-[80vh] flex-col p-2 sm:p-4">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setView("register")}
            className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          {/* Left: Order summary */}
          <div className="lg:w-[360px] space-y-3">
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-2 max-h-[40vh] overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="truncate font-medium">{item.product.name}</p>
                    {item.product.size && (
                      <p className="text-xs text-muted-foreground">
                        Size {item.product.size}
                        {item.qty > 1 ? ` x${item.qty}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold tabular-nums whitespace-nowrap">
                    {money(item.sellPrice * item.qty)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="tabular-nums">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (7.5%)</span>
                <span className="tabular-nums">{money(tax)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span className="tabular-nums text-[#FB4F14]">{money(total)}</span>
              </div>
            </div>
          </div>

          {/* Right: Payment */}
          <div className="flex-1 space-y-4">
            {/* Payment method toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod("cash")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-base font-bold transition-all",
                  paymentMethod === "cash"
                    ? "border-green-600 bg-green-600 text-white shadow-lg shadow-green-600/20"
                    : "border-border text-muted-foreground hover:border-green-600/50"
                )}
              >
                <DollarSign className="h-5 w-5" />
                Cash
              </button>
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-base font-bold transition-all",
                  paymentMethod === "stripe"
                    ? "border-[#FB4F14] bg-[#FB4F14] text-white shadow-lg shadow-[#FB4F14]/20"
                    : "border-border text-muted-foreground hover:border-[#FB4F14]/50"
                )}
              >
                <QrCode className="h-5 w-5" />
                Stripe QR
              </button>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-3">
                {/* Cash display */}
                <div className="rounded-2xl border-2 border-border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Amount Received
                  </p>
                  <p className="text-4xl font-bold tabular-nums">
                    ${cashInput || "0.00"}
                  </p>
                </div>

                {/* Quick denomination buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setCashInput(total.toFixed(2))}
                    className="col-span-2 rounded-xl border-2 border-green-600/30 bg-green-600/10 py-3.5 text-base font-bold text-green-600 hover:bg-green-600/20 transition-colors"
                  >
                    Exact {money(total)}
                  </button>
                  {cashDenoms.map((d) => (
                    <button
                      key={d}
                      onClick={() =>
                        setCashInput((prev) => {
                          const current = parseFloat(prev) || 0;
                          return (current + d).toFixed(2);
                        })
                      }
                      className="rounded-xl border-2 border-border py-3.5 text-base font-bold hover:bg-muted transition-colors"
                    >
                      +${d}
                    </button>
                  ))}
                </div>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => handleNumpad(key)}
                        className={cn(
                          "flex h-14 items-center justify-center rounded-xl border-2 border-border text-xl font-bold transition-colors hover:bg-muted",
                          key === "back" && "text-red-400"
                        )}
                      >
                        {key === "back" ? <Delete className="h-5 w-5" /> : key}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => setCashInput("")}
                  className="w-full rounded-xl border-2 border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Clear
                </button>

                {/* Change due */}
                {cashReceived > 0 && cashReceived >= total && (
                  <div className="rounded-2xl bg-green-500/10 border-2 border-green-500/30 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                      Change Due
                    </p>
                    <p className="text-4xl font-bold text-green-500 tabular-nums">
                      {money(changeDue)}
                    </p>
                  </div>
                )}

                {/* Complete sale */}
                <Button
                  className="w-full h-16 text-xl font-bold rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20"
                  onClick={handleCashSale}
                  disabled={processing || cashReceived < total || cart.length === 0}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-5 w-5" />
                  )}
                  Complete Sale
                </Button>
              </div>
            )}

            {paymentMethod === "stripe" && (
              <div className="space-y-4">
                <div className="rounded-2xl border-2 border-border bg-card p-8 text-center space-y-3">
                  <QrCode className="mx-auto h-12 w-12 text-[#FB4F14]" />
                  <p className="text-lg font-semibold">
                    Generate a QR code for the customer to scan and pay
                  </p>
                  <p className="text-3xl font-bold tabular-nums text-[#FB4F14]">
                    {money(total)}
                  </p>
                </div>
                <Button
                  className="w-full h-16 text-xl font-bold rounded-xl bg-[#FB4F14] hover:bg-[#FB4F14]/90 shadow-lg shadow-[#FB4F14]/20"
                  onClick={handleStripeQR}
                  disabled={processing || cart.length === 0}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-5 w-5" />
                  )}
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ──── REGISTER VIEW (main) ────
  return (
    <div className="flex min-h-[80vh] flex-col lg:flex-row gap-4 p-2 sm:p-4">
      {/* LEFT PANEL: Product Finder */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Point of Sale</h1>
          <p className="text-sm text-muted-foreground">
            Scan or search to add items to cart
          </p>
        </div>

        {/* Finder mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setFinderMode("scan")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-base font-bold transition-all",
              finderMode === "scan"
                ? "border-[#002244] bg-[#002244] text-white"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30"
            )}
          >
            <ScanBarcode className="h-5 w-5" />
            Scan
          </button>
          <button
            onClick={() => setFinderMode("search")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-base font-bold transition-all",
              finderMode === "search"
                ? "border-[#FB4F14] bg-[#FB4F14] text-white"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30"
            )}
          >
            <Search className="h-5 w-5" />
            Search
          </button>
        </div>

        {/* Scan mode */}
        {finderMode === "scan" && (
          <BarcodeScannerInput onScan={handleScan} loading={scanLoading} />
        )}

        {/* Search mode */}
        {finderMode === "search" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, brand, or barcode..."
                className="h-14 pl-12 text-lg bg-card border-2 border-border rounded-xl focus:border-[#FB4F14]"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex w-full items-center gap-3 rounded-xl border-2 border-border bg-card p-3 text-left transition-all hover:border-[#FB4F14]/50 hover:bg-[#FB4F14]/5 active:scale-[0.98]"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                    {getImage(product) ? (
                      <img
                        src={getImage(product)!}
                        alt=""
                        className="h-full w-full object-contain p-0.5"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.brand && (
                        <span className="text-xs text-muted-foreground">
                          {product.brand}
                        </span>
                      )}
                      {product.size && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {product.size}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold tabular-nums">
                      {money(product.price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Qty: {product.quantity}
                    </p>
                  </div>
                  <Plus className="h-5 w-5 text-[#FB4F14] flex-shrink-0" />
                </button>
              ))}
              {!searching && hasSearched && searchResults.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-medium">No products found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state when scan mode and no scanning */}
        {finderMode === "scan" && !scanLoading && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center">
            <ScanBarcode className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Scan a barcode to add to cart
            </p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Cart */}
      <div className="w-full lg:w-[380px] flex flex-col">
        {/* Cart header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-bold">
              Cart
              {itemCount > 0 && (
                <span className="ml-2 text-sm font-semibold text-muted-foreground">
                  ({itemCount})
                </span>
              )}
            </h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors px-2 py-1"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[45vh] lg:max-h-[55vh] mb-3">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
              <ShoppingCart className="mb-3 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Cart is empty</p>
            </div>
          )}

          {cart.map((item) => (
            <div
              key={item.cartId}
              className="rounded-xl border-2 border-border bg-card p-3 space-y-2"
            >
              <div className="flex items-start gap-3">
                {/* Image */}
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                  {getImage(item.product) ? (
                    <img
                      src={getImage(item.product)!}
                      alt=""
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageOff className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate leading-tight">
                    {item.product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.product.size && (
                      <span className="text-xs text-muted-foreground">
                        Size {item.product.size}
                      </span>
                    )}
                    {item.product.brand && (
                      <span className="text-xs text-muted-foreground">
                        {item.product.brand}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.cartId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Price + Qty row */}
              <div className="flex items-center justify-between">
                {/* Editable price */}
                {editingCartId === item.cartId ? (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      onBlur={() => {
                        const p = parseFloat(editPrice);
                        if (p > 0) updatePrice(item.cartId, p);
                        else setEditingCartId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const p = parseFloat(editPrice);
                          if (p > 0) updatePrice(item.cartId, p);
                          else setEditingCartId(null);
                        }
                      }}
                      className="w-24 rounded-lg border-2 border-[#FB4F14] bg-transparent px-2 py-1 text-sm font-bold tabular-nums outline-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCartId(item.cartId);
                      setEditPrice(item.sellPrice.toFixed(2));
                    }}
                    className="text-lg font-bold tabular-nums hover:text-[#FB4F14] transition-colors"
                  >
                    {money(item.sellPrice)}
                  </button>
                )}

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.cartId, -1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border hover:bg-muted transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.cartId, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-border hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart totals + checkout button */}
        <div className="space-y-3 border-t-2 border-border pt-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (7.5%)</span>
              <span className="font-semibold tabular-nums">{money(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-1">
              <span>Total</span>
              <span className="tabular-nums text-[#FB4F14]">{money(total)}</span>
            </div>
          </div>

          <Button
            className="w-full h-16 text-xl font-bold rounded-xl bg-[#FB4F14] hover:bg-[#FB4F14]/90 shadow-lg shadow-[#FB4F14]/20 disabled:opacity-40"
            disabled={cart.length === 0}
            onClick={startCheckout}
          >
            Charge {money(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
