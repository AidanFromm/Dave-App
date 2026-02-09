"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, ShoppingBag, Package, ArrowRight, PartyPopper, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutProgress } from "@/components/checkout/checkout-progress";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

function ConfirmationContent() {
  const clearCart = useCartStore((s) => s.clearCart);
  const searchParams = useSearchParams();
  const paymentIntent = searchParams.get("payment_intent");
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Clear cart after successful payment
    clearCart();
    sessionStorage.removeItem("checkout_email");

    // Trigger confetti
    setShowConfetti(true);
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#3b82f6', '#f97316'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#3b82f6', '#f97316'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, [clearCart]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg text-center"
      >
        <CheckoutProgress currentStep={3} />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mt-8"
        >
          <div className="relative mx-auto">
            <motion.div
              className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500"
              animate={{ 
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0.4)",
                  "0 0 0 20px rgba(34, 197, 94, 0)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <CheckCircle className="h-12 w-12 text-white" />
            </motion.div>
            
            {/* Floating emojis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-4 text-3xl"
            >
              🎉
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="absolute -bottom-2 -left-4 text-2xl"
            >
              ✨
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="mt-6 text-3xl font-bold">Order Confirmed!</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Thank you for your purchase! 🙏
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 rounded-2xl border bg-card p-6"
        >
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Payment received
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Order processing
            </div>
          </div>

          <p className="mt-4 text-muted-foreground">
            You'll receive an email confirmation shortly with your order details and tracking info.
          </p>

          {paymentIntent && (
            <p className="mt-4 text-xs text-muted-foreground/60 font-mono">
              Payment ID: {paymentIntent}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button size="lg" asChild>
            <Link href="/">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/orders/lookup">
              <Package className="mr-2 h-5 w-5" />
              Track Order
            </Link>
          </Button>
        </motion.div>

        {/* Social sharing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10"
        >
          <p className="text-sm text-muted-foreground">
            Share your excitement!
          </p>
          <div className="mt-3 flex justify-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Share on X
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Share on Instagram
            </Button>
          </div>
        </motion.div>
      </motion.div>
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
