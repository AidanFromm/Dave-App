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
import { Loader2, CreditCard, ArrowLeft, Lock, Package, MapPin, Truck, Shield } from "lucide-react";
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
            <span className="text-lg">⚠️</span>
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
          Pay {formatCurrency(getTotal())}
        </Button>
      </motion.div>

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

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    const createPaymentIntent = async () => {
      const email = sessionStorage.getItem("checkout_email") ?? "";
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
            total: getTotal(),
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
  }, []);

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
                        className="object-cover"
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
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(getTotal())}</span>
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
