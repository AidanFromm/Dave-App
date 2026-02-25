"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Loader2, CreditCard, ArrowLeft, Lock, Package, MapPin, Truck, Shield, Tag, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CheckoutProgress } from "@/components/checkout/checkout-progress";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart, getTotal } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="rounded-xl border p-4">
        <PaymentElement />
      </div>
      
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-base font-semibold"
          disabled={!stripe || loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Lock className="mr-2 h-5 w-5" />
          )}
          Pay Now
        </Button>
      </motion.div>

      <p className="text-center text-xs text-muted-foreground">
        All sales are final. By completing this purchase you agree to our{" "}
        <a href="/returns" className="underline hover:text-foreground">return policy</a>.
      </p>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4" />
          Secured by Stripe
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="h-4 w-4" />
          256-bit encryption
        </div>
      </div>
    </form>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const {
    items,
    fulfillmentType,
    shippingAddress,
    getSubtotal,
    getTax,
    getShippingCost,
    getTotal,
    toOrderItems,
  } = useCartStore();

  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  // Promo code state
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    type: string;
    value: number;
    discountAmount: number;
  } | null>(null);

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    id: string;
    code: string;
    balance: number;
    applied: number;
  } | null>(null);

  const afterDiscount = appliedDiscount
    ? Math.max(0, getTotal() - appliedDiscount.discountAmount)
    : getTotal();
  const giftCardApplied = appliedGiftCard?.applied ?? 0;
  const discountedTotal = Math.max(0, afterDiscount - giftCardApplied);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, orderTotal: getSubtotal() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid promo code");
        return;
      }
      setAppliedDiscount(data);
      toast.success(`Promo code ${data.code} applied!`);
    } catch {
      toast.error("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedDiscount(null);
    setPromoCode("");
  };

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setGiftCardLoading(true);
    try {
      const res = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCardCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Invalid gift card");
        return;
      }
      const remaining = afterDiscount;
      const applied = Math.min(data.balance, remaining);
      setAppliedGiftCard({ id: data.id, code: data.code, balance: data.balance, applied });
      toast.success(`Gift card applied! Using ${formatCurrency(applied)} of ${formatCurrency(data.balance)} balance.`);
    } catch {
      toast.error("Failed to validate gift card");
    } finally {
      setGiftCardLoading(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode("");
  };

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    const createPaymentIntent = async () => {
      const email = sessionStorage.getItem("checkout_email") ?? "";
      const discount = appliedDiscount?.discountAmount || 0;
      const finalTotal = Math.max(0, getTotal() - discount);
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: toOrderItems(),
            email,
            fulfillmentType,
            shippingAddress,
            subtotal: getSubtotal(),
            tax: getTax(),
            shippingCost: getShippingCost(),
            total: finalTotal,
            discountCode: appliedDiscount?.code || null,
            phone: sessionStorage.getItem("checkout_phone") || undefined,
          }),
        });

        const data = await res.json();
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        }
      } catch {
        // Payment initialization failed
      }
      setLoading(false);
    };

    createPaymentIntent();
  }, [appliedDiscount]);

  if (items.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <motion.div variants={fadeIn}>
        <CheckoutProgress currentStep={2} />
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left - Payment */}
        <motion.div variants={fadeIn} className="space-y-6">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Method
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All transactions are secure and encrypted
            </p>

            <div className="mt-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">Loading payment options...</p>
                </div>
              ) : clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: { 
                      theme: "stripe", 
                      variables: { 
                        colorPrimary: "#FB4F14", 
                        fontFamily: "Inter, sans-serif",
                        borderRadius: "12px",
                      } 
                    },
                  }}
                >
                  <PaymentForm />
                </Elements>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <CreditCard className="h-8 w-8 text-destructive" />
                  </div>
                  <p className="mt-4 font-medium text-destructive">Failed to initialize payment</p>
                  <p className="mt-1 text-sm text-muted-foreground">Please try again or contact support</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Button variant="ghost" asChild className="w-full">
            <Link href="/checkout">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
            </Link>
          </Button>
        </motion.div>

        {/* Right - Summary */}
        <motion.div variants={fadeIn} className="lg:sticky lg:top-24 lg:self-start space-y-4">
          {/* Order Items */}
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="bg-muted/50 p-4 border-b">
              <h2 className="font-bold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </h2>
            </div>
            
            <div className="max-h-48 overflow-y-auto divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-4">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                    {item.product.size && (
                      <p className="text-xs text-muted-foreground">Size: {item.product.size}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <div className="border-t p-4">
              {appliedDiscount ? (
                <div className="flex items-center justify-between rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">{appliedDiscount.code}</span>
                    <span className="text-xs text-muted-foreground">
                      (-{formatCurrency(appliedDiscount.discountAmount)})
                    </span>
                  </div>
                  <button onClick={handleRemovePromo} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    className="h-9 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="shrink-0"
                  >
                    {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Gift Card */}
            <div className="border-t p-4">
              {appliedGiftCard ? (
                <div className="flex items-center justify-between rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Gift Card</span>
                    <span className="text-xs text-muted-foreground">
                      (-{formatCurrency(appliedGiftCard.applied)})
                    </span>
                  </div>
                  <button onClick={handleRemoveGiftCard} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Gift card code"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyGiftCard()}
                    className="h-9 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyGiftCard}
                    disabled={giftCardLoading || !giftCardCode.trim()}
                    className="shrink-0"
                  >
                    {giftCardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (7%)</span>
                <span>{formatCurrency(getTax())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className={getShippingCost() === 0 ? "text-green-600 font-semibold" : ""}>
                  {getShippingCost() === 0 ? "FREE" : formatCurrency(getShippingCost())}
                </span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(appliedDiscount.discountAmount)}</span>
                </div>
              )}
              {appliedGiftCard && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Gift Card</span>
                  <span>-{formatCurrency(appliedGiftCard.applied)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(discountedTotal)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                {fulfillmentType === "ship" ? (
                  <><Truck className="h-4 w-4 text-primary" /> Shipping To</>
                ) : (
                  <><MapPin className="h-4 w-4 text-primary" /> Store Pickup</>
                )}
              </h3>
              <Link href="/checkout" className="text-xs text-primary hover:underline">
                Edit
              </Link>
            </div>
            
            {fulfillmentType === "ship" && shippingAddress ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {shippingAddress.firstName} {shippingAddress.lastName}<br />
                {shippingAddress.street}
                {shippingAddress.apartment && `, ${shippingAddress.apartment}`}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Tampa, FL — We'll notify you when ready
              </p>
            )}
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground">
            By placing your order, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
