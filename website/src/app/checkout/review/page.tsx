"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { Loader2, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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
    // If successful, Stripe redirects to return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <PaymentElement />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe || loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="mr-2 h-4 w-4" />
        )}
        Pay {formatCurrency(getTotal())}
      </Button>
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
      setLoading(false);
    };

    createPaymentIntent();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Review & Pay</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Step 2 of 2 — Payment
      </p>

      {/* Order summary */}
      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="font-semibold">Order Summary</h2>
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>
                {formatCurrency(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(getSubtotal())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(getTax())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {getShippingCost() === 0
                ? "FREE"
                : formatCurrency(getShippingCost())}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>
        </div>
      </div>

      {/* Shipping info */}
      {fulfillmentType === "ship" && shippingAddress && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Shipping To</h2>
            <Link
              href="/checkout"
              className="text-xs text-primary hover:underline"
            >
              Edit
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {shippingAddress.firstName} {shippingAddress.lastName}
            <br />
            {shippingAddress.street}
            {shippingAddress.apartment && `, ${shippingAddress.apartment}`}
            <br />
            {shippingAddress.city}, {shippingAddress.state}{" "}
            {shippingAddress.zipCode}
          </p>
        </div>
      )}

      {fulfillmentType === "pickup" && (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Store Pickup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tampa, FL — We&apos;ll notify you when your order is ready.
          </p>
        </div>
      )}

      {/* Payment */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <PaymentForm />
          </Elements>
        ) : (
          <div className="text-center text-sm text-destructive">
            Failed to initialize payment. Please try again.
          </div>
        )}
      </div>

      <Button variant="ghost" asChild className="mt-4 w-full">
        <Link href="/checkout">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
        </Link>
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By placing your order, you agree to our terms and conditions.
      </p>
    </div>
  );
}
