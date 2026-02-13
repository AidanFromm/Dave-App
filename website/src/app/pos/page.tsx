"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  Banknote,
  Percent,
  Hash,
  Receipt,
  X,
  ShoppingBag,
  TrendingUp,
  Printer,
} from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  image?: string;
}

interface CompletedSale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: string;
  created_at: string;
  receipt_number?: string;
}

const TAX_RATE = 0.075; // 7.5% FL sales tax

export default function POSPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const scanRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanInput, setScanInput] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "zelle">("card");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<CompletedSale | null>(null);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const [scanning, setScanning] = useState(false);

  // Load daily totals
  const loadDailyTotals = useCallback(async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("pos_transactions")
      .select("total")
      .gte("created_at", todayStart.toISOString());
    if (data) {
      setDailyTotal(data.reduce((sum, t) => sum + (t.total || 0), 0));
      setDailyCount(data.length);
    }
  }, [supabase]);

  // Load on mount
  useState(() => { loadDailyTotals(); });

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setScanning(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, price, sku, images")
      .or(`sku.eq.${scanInput},barcode.eq.${scanInput}`)
      .limit(1);

    if (data && data.length > 0) {
      const product = data[0];
      const existing = cart.find((i) => i.id === product.id);
      if (existing) {
        setCart(cart.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
      } else {
        setCart([
          ...cart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            sku: product.sku,
            image: product.images?.[0],
          },
        ]);
      }
    }
    setScanInput("");
    setScanning(false);
    scanRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (id: string) => setCart(cart.filter((i) => i.id !== id));

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount =
    discountType === "percent"
      ? subtotal * (parseFloat(discountValue || "0") / 100)
      : parseFloat(discountValue || "0");
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const tax = afterDiscount * TAX_RATE;
  const total = afterDiscount + tax;

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    const receiptNumber = `ST-${Date.now().toString(36).toUpperCase()}`;
    const transaction = {
      items: cart.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, sku: i.sku })),
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      payment_method: paymentMethod,
      staff_id: user.id,
      receipt_number: receiptNumber,
    };
    const { data } = await supabase.from("pos_transactions").insert(transaction).select().single();
    if (data) {
      setLastSale({ ...data, items: cart });
      setShowReceipt(true);
      setCart([]);
      setDiscountValue("");
      loadDailyTotals();
      await supabase.from("staff_activity_log").insert({
        user_id: user.id,
        action: "pos_sale",
        details: { total: transaction.total, items: cart.length, payment: paymentMethod },
      });
    }
  };

  const paymentMethods = [
    { id: "card" as const, label: "Card", icon: CreditCard },
    { id: "cash" as const, label: "Cash", icon: Banknote },
    { id: "zelle" as const, label: "Zelle", icon: Smartphone },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Product List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-800 bg-surface-900 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold uppercase tracking-tight">SECURED</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
              POS
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Today&apos;s Sales</p>
              <p className="font-mono text-lg font-bold text-primary">
                ${dailyTotal.toFixed(2)}
                <span className="text-xs text-muted-foreground ml-1">({dailyCount})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scan Bar */}
        <div className="border-b border-surface-800 bg-surface-900 px-4 py-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                ref={scanRef}
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                placeholder="Scan barcode or enter SKU to add item..."
                className="w-full rounded-lg border border-surface-700 bg-surface-850 pl-11 pr-4 py-3.5 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="rounded-lg bg-primary hover:bg-brand-orange-600 text-white px-6 font-medium transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No items in cart</p>
              <p className="text-sm">Scan a barcode or enter SKU to begin</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-surface-800 bg-surface-900 p-4"
              >
                {item.image ? (
                  <img src={item.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-surface-800 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku || "N/A"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="rounded-md border border-surface-700 p-1.5 hover:bg-surface-800 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="rounded-md border border-surface-700 p-1.5 hover:bg-surface-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-mono text-lg font-bold w-24 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-secured-error hover:bg-secured-error/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Checkout Panel */}
      <div className="w-80 lg:w-96 border-l border-surface-800 bg-surface-900 flex flex-col">
        <div className="p-4 border-b border-surface-800">
          <h2 className="font-display text-lg font-bold uppercase">Checkout</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Discount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Discount
            </label>
            <div className="flex gap-2">
              <div className="flex rounded-lg border border-surface-700 overflow-hidden">
                <button
                  onClick={() => setDiscountType("percent")}
                  className={`px-3 py-2 text-sm ${
                    discountType === "percent" ? "bg-primary text-white" : "bg-surface-850 text-muted-foreground"
                  }`}
                >
                  <Percent className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDiscountType("fixed")}
                  className={`px-3 py-2 text-sm ${
                    discountType === "fixed" ? "bg-primary text-white" : "bg-surface-850 text-muted-foreground"
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                </button>
              </div>
              <input
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                type="number"
                className="flex-1 rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                    paymentMethod === pm.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-700 bg-surface-850 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <pm.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-surface-800">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-secured-success">
                <span>Discount</span>
                <span className="font-mono">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (7.5%)</span>
              <span className="font-mono">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-surface-800">
              <span>Total</span>
              <span className="font-mono text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="p-4 border-t border-surface-800">
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full rounded-lg bg-primary hover:bg-brand-orange-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-display font-bold uppercase tracking-wider py-4 text-lg transition-colors"
          >
            <DollarSign className="inline h-5 w-5 mr-1" />
            Charge ${total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div id="receipt-print" className="w-full max-w-sm rounded-xl border border-surface-800 bg-white text-black p-6 shadow-2xl">
            <div className="text-center mb-4">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight">SECURED TAMPA</h2>
              <p className="text-xs text-gray-500 mt-1">Premium Sneakers & Collectibles</p>
              <p className="text-xs text-gray-500">2398 Grand Cypress Dr STE 420, Lutz, FL 33559</p>
              <p className="text-xs text-gray-500">(813) 555-0199 | securedtampa.com</p>
              <div className="border-b border-dashed border-gray-300 my-3" />
              <p className="text-xs text-gray-500">
                {new Date(lastSale.created_at).toLocaleString()}
              </p>
              {lastSale.receipt_number && (
                <p className="text-xs text-gray-500 font-mono">Receipt #{lastSale.receipt_number}</p>
              )}
            </div>

            <div className="space-y-1 mb-3">
              {lastSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-mono">${lastSale.subtotal.toFixed(2)}</span>
              </div>
              {lastSale.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-mono">-${lastSale.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span className="font-mono">${lastSale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1 border-t border-dashed border-gray-300">
                <span>Total</span>
                <span className="font-mono">${lastSale.total.toFixed(2)}</span>
              </div>
              <p className="text-center text-xs text-gray-500 capitalize mt-2">
                Paid via {lastSale.payment_method}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-300 mt-3 pt-3 text-center">
              <p className="text-xs text-gray-500">Thank you for shopping at Secured Tampa!</p>
              <p className="text-xs text-gray-400 mt-1">securedtampa.com</p>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  const el = document.getElementById("receipt-print");
                  if (el) {
                    const w = window.open("", "_blank", "width=400,height=600");
                    if (w) {
                      w.document.write(`<html><head><title>Receipt</title><style>body{font-family:monospace;padding:20px;font-size:12px}h2{font-family:Oswald,sans-serif;margin:0}p{margin:2px 0}.line{border-top:1px dashed #999;margin:8px 0}.row{display:flex;justify-content:space-between}.bold{font-weight:bold}.center{text-align:center}</style></head><body>${el.innerHTML}</body></html>`);
                      w.document.close();
                      w.print();
                    }
                  }
                }}
                className="flex-1 rounded-lg bg-gray-200 text-gray-900 py-3 font-medium transition-colors hover:bg-gray-300"
              >
                <Printer className="inline h-4 w-4 mr-1" />
                Print
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-lg bg-gray-900 text-white py-3 font-medium transition-colors hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
