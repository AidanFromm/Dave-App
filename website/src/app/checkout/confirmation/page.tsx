"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const clearCart = useCartStore((s) => s.clearCart);
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");

  useEffect(() => {
    // Clear cart after successful payment
    clearCart();
    sessionStorage.removeItem("checkout_email");
  }, [clearCart]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
      <CheckCircle className="h-16 w-16 text-secured-success" />
      <h1 className="mt-4 text-2xl font-bold">Order Confirmed!</h1>
      <p className="mt-2 text-muted-foreground">
        Thank you for your purchase. You&apos;ll receive an email confirmation
        shortly.
      </p>
      {paymentIntent && (
        <p className="mt-2 text-xs text-muted-foreground">
          Payment ID: {paymentIntent}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/orders/lookup">Track Order</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  );
}
