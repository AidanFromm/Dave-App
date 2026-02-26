"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { BarcodeScannerInput } from "@/components/admin/barcode-scanner-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  X,
  DollarSign,
  CreditCard,
  Printer,
  QrCode,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TAX_RATE } from "@/lib/constants";

// ─── Types ───────────────────────────────────────────────────

interface ScannedProduct {
  id: string;
  name: string;
  brand: string | null;
  size: string | null;
  cost: number;
  price: number;
  image_urls: string[] | null;
  quantity: number;
}

type PaymentMethod = "cash" | "stripe";
type SalePhase = "scan" | "product" | "payment" | "qr" | "success";

// ─── Component ───────────────────────────────────────────────

export function ScanOut() {
  const [phase, setPhase] = useState<SalePhase>("scan");
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const [sellPrice, setSellPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [processing, setProcessing] = useState(false);

  // Stripe QR state
  const [sessionId, setSessionId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrCountdown, setQrCountdown] = useState(1800);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Success state
  const [successData, setSuccessData] = useState<{
    orderNumber: string;
    itemName: string;
    size?: string;
    price: number;
    tax: number;
    total: number;
    paymentMethod: string;
    change?: number;
  } | null>(null);

  // Derived
  const price = parseFloat(sellPrice) || 0;
  const tax = Math.round(price * TAX_RATE * 100) / 100;
  const total = Math.round((price + tax) * 100) / 100;
  const received = parseFloat(amountReceived) || 0;
  const change = Math.max(0, Math.round((received - total) * 100) / 100);

  // Cleanup intervals
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ─── Barcode Scan ────────────────────────────────────────

  const handleScan = useCallback(async (barcode: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/search-barcode?q=${encodeURIComponent(barcode)}`);
      if (!res.ok) {
        toast.error("Product not found", { description: `Barcode: ${barcode}` });
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProduct(data.product);
      setSellPrice(String(data.product.price || ""));
      setPhase("product");
    } catch {
      toast.error("Failed to look up product");
    }
    setLoading(false);
  }, []);

  // ─── Cash Sale ───────────────────────────────────────────

  const handleCashSale = async () => {
    if (!product || price <= 0) return;
    if (received < total) {
      toast.error("Insufficient payment", { description: `Need $${total.toFixed(2)}, received $${received.toFixed(2)}` });
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/pos/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sellPrice: price,
          tax,
          total,
          paymentMethod: "cash",
          amountReceived: received,
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
        itemName: product.name,
        size: product.size || undefined,
        price,
        tax,
        total,
        paymentMethod: "cash",
        change: data.change,
      });
      setPhase("success");
    } catch {
      toast.error("Network error");
    }
    setProcessing(false);
  };

  // ─── Stripe QR ───────────────────────────────────────────

  const handleStripeQR = async () => {
    if (!product || price <= 0) return;
    setProcessing(true);
    try {
      const imageUrl = product.image_urls?.[0] || undefined;
      const res = await fetch("/api/admin/pos/stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          sellPrice: price,
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

      setSessionId(data.sessionId);

      // Generate QR code
      const QRCode = (await import("qrcode")).default;
      const qrUrl = await QRCode.toDataURL(data.sessionUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#002244", light: "#FFFFFF" },
      });
      setQrDataUrl(qrUrl);
      setQrCountdown(1800);
      setPhase("qr");

      // Start countdown
      countdownRef.current = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (pollRef.current) clearInterval(pollRef.current);
            toast.error("Payment session expired");
            resetSale();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Poll for payment
      pollRef.current = setInterval(async () => {
        try {
          const checkRes = await fetch(`/api/admin/pos/check-payment?sessionId=${data.sessionId}`);
          const checkData = await checkRes.json();
          if (checkData.status === "paid") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            setSuccessData({
              orderNumber: checkData.orderNumber,
              itemName: product.name,
              size: product.size || undefined,
              price,
              tax,
              total,
              paymentMethod: "stripe",
            });
            setPhase("success");
          } else if (checkData.status === "expired") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            toast.error("Payment session expired");
            resetSale();
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

  const resetSale = () => {
    setPhase("scan");
    setProduct(null);
    setSellPrice("");
    setPaymentMethod("cash");
    setAmountReceived("");
    setSuccessData(null);
    setSessionId("");
    setQrDataUrl("");
    setQrCountdown(1800);
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  // ─── Format countdown ───────────────────────────────────

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── SCAN PHASE ─── */}
      {phase === "scan" && (
        <>
          <BarcodeScannerInput onScan={handleScan} loading={loading} />
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
            <DollarSign className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Scan a product barcode to start a sale
            </p>
          </div>
        </>
      )}

      {/* ─── PRODUCT CARD ─── */}
      {(phase === "product" || phase === "payment") && product && (
        <div className="space-y-5">
          {/* Product Card */}
          <div className="overflow-hidden rounded-xl border-2 border-[#002244]/20 bg-card">
            <div className="flex gap-4 p-5">
              {/* Image */}
              <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                {product.image_urls?.[0] ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-lg font-bold leading-tight">{product.name}</p>
                {product.brand && (
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                )}
                {product.size && (
                  <Badge variant="secondary" className="text-xs">Size {product.size}</Badge>
                )}
                <div className="pt-1 text-xs text-muted-foreground">
                  Cost: ${(product.cost || 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t border-border bg-muted/30 p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sell Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="h-12 text-xl font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-base font-semibold">${price.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-background p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tax (7.5%)</p>
                  <p className="text-base font-semibold">${tax.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-[#002244] p-3 text-center text-white">
                  <p className="text-xs text-white/70">Total</p>
                  <p className="text-base font-bold">${total.toFixed(2)}</p>
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Payment Method</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setPaymentMethod("cash"); setPhase("product"); }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all",
                      paymentMethod === "cash"
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-border text-muted-foreground hover:border-green-600/50"
                    )}
                  >
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </button>
                  <button
                    onClick={() => { setPaymentMethod("stripe"); setPhase("product"); }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all",
                      paymentMethod === "stripe"
                        ? "border-[#FB4F14] bg-[#FB4F14] text-white"
                        : "border-border text-muted-foreground hover:border-[#FB4F14]/50"
                    )}
                  >
                    <QrCode className="h-4 w-4" />
                    Stripe QR
                  </button>
                </div>
              </div>

              {/* Cash Payment */}
              {paymentMethod === "cash" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Amount Received</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="h-12 text-xl font-bold"
                      placeholder="0.00"
                    />
                  </div>
                  {received > 0 && received >= total && (
                    <div className="rounded-lg bg-green-500/10 p-3 text-center">
                      <p className="text-xs text-green-700">Change Due</p>
                      <p className="text-2xl font-bold text-green-700">${change.toFixed(2)}</p>
                    </div>
                  )}
                  <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleCashSale}
                    disabled={processing || price <= 0 || received < total}
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Complete Sale -- ${total.toFixed(2)}
                  </Button>
                </div>
              )}

              {/* Stripe QR Payment */}
              {paymentMethod === "stripe" && (
                <Button
                  size="lg"
                  className="w-full bg-[#FB4F14] hover:bg-[#FB4F14]/90"
                  onClick={handleStripeQR}
                  disabled={processing || price <= 0}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  Generate Payment QR Code
                </Button>
              )}

              {/* Cancel */}
              <Button variant="ghost" className="w-full" onClick={resetSale}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── QR CODE PHASE ─── */}
      {phase === "qr" && (
        <div className="flex flex-col items-center space-y-6 rounded-xl border-2 border-[#FB4F14]/20 bg-card p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#002244]">Customer: Scan to Pay</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ${total.toFixed(2)} -- {product?.name}
            </p>
          </div>

          {qrDataUrl && (
            <div className="rounded-xl border-4 border-[#002244] bg-white p-4">
              <img src={qrDataUrl} alt="Payment QR Code" className="h-64 w-64" />
            </div>
          )}

          <div className={cn(
            "rounded-full px-6 py-2 text-lg font-bold",
            qrCountdown > 300 ? "bg-[#002244] text-white" : "bg-red-500 text-white animate-pulse"
          )}>
            {formatTime(qrCountdown)}
          </div>

          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Waiting for payment...</span>
          </div>

          <Button variant="outline" onClick={resetSale}>
            Cancel
          </Button>
        </div>
      )}

      {/* ─── SUCCESS PHASE ─── */}
      {phase === "success" && successData && (
        <div className="flex flex-col items-center space-y-6 rounded-xl border-2 border-green-500/30 bg-card p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <Check className="h-8 w-8 text-white" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-700">Sale Complete</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Order {successData.orderNumber}
            </p>
          </div>

          <div className="w-full max-w-sm space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <div className="flex justify-between">
              <span>Item</span>
              <span className="font-medium">{successData.itemName.substring(0, 30)}</span>
            </div>
            {successData.size && (
              <div className="flex justify-between">
                <span>Size</span>
                <span className="font-medium">{successData.size}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Price</span>
              <span className="font-medium">${successData.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-medium">${successData.tax.toFixed(2)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>${successData.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment</span>
              <span className="font-medium">{successData.paymentMethod === "cash" ? "Cash" : "Card"}</span>
            </div>
            {successData.change !== undefined && successData.change > 0 && (
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Change</span>
                <span>${successData.change.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={handlePrintReceipt} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button onClick={resetSale} className="bg-[#FB4F14] hover:bg-[#FB4F14]/90">
              New Sale
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
