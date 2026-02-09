"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { shippingFormSchema, type ShippingFormValues } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Loader2, ShoppingBag, Truck, MapPin, Package, Lock, CreditCard } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckoutProgress } from "@/components/checkout/checkout-progress";
import { cn } from "@/lib/utils";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    fulfillmentType,
    setFulfillmentType,
    setShippingAddress,
    setCustomerNotes,
    getSubtotal,
    getTax,
    getShippingCost,
    getTotal,
    getItemCount,
  } = useCartStore();

  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fulfillmentType,
      email: "",
      customerNotes: "",
    },
  });

  const watchFulfillment = watch("fulfillmentType");

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">Add some items before checkout</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  const onSubmit = async (data: ShippingFormValues) => {
    setLoading(true);
    setFulfillmentType(data.fulfillmentType);
    if (data.address) {
      setShippingAddress({ ...data.address, country: data.address.country ?? "US" });
    }
    if (data.customerNotes) {
      setCustomerNotes(data.customerNotes);
    }
    sessionStorage.setItem("checkout_email", data.email);
    router.push("/checkout/review");
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <motion.div variants={fadeIn}>
        <CheckoutProgress currentStep={1} />
      </motion.div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left - Form */}
        <motion.form
          variants={staggerContainer}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Contact */}
          <motion.div
            variants={fadeIn}
            className="rounded-2xl border bg-card p-6"
          >
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
              Contact Information
            </h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  We'll send your order confirmation here
                </p>
              </div>
            </div>
          </motion.div>

          {/* Fulfillment */}
          <motion.div
            variants={fadeIn}
            className="rounded-2xl border bg-card p-6"
          >
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                2
              </span>
              Delivery Method
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setValue("fulfillmentType", "ship")}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                  watchFulfillment === "ship"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                {watchFulfillment === "ship" && (
                  <motion.div
                    layoutId="fulfillment-check"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                  >
                    ✓
                  </motion.div>
                )}
                <Truck className={cn("h-8 w-8", watchFulfillment === "ship" ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <p className="font-semibold">Ship to Address</p>
                  <p className="text-xs text-muted-foreground">3-5 business days</p>
                </div>
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setValue("fulfillmentType", "pickup")}
                className={cn(
                  "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all",
                  watchFulfillment === "pickup"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                {watchFulfillment === "pickup" && (
                  <motion.div
                    layoutId="fulfillment-check"
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"
                  >
                    ✓
                  </motion.div>
                )}
                <MapPin className={cn("h-8 w-8", watchFulfillment === "pickup" ? "text-primary" : "text-muted-foreground")} />
                <div className="text-center">
                  <p className="font-semibold">Store Pickup</p>
                  <p className="text-xs text-muted-foreground">Tampa, FL</p>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Shipping address */}
          {watchFulfillment === "ship" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border bg-card p-6"
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </span>
                Shipping Address
              </h2>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">First Name</Label>
                    <Input className="h-12" placeholder="John" {...register("address.firstName")} />
                    {errors.address?.firstName && (
                      <p className="text-xs text-destructive">{errors.address.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Last Name</Label>
                    <Input className="h-12" placeholder="Doe" {...register("address.lastName")} />
                    {errors.address?.lastName && (
                      <p className="text-xs text-destructive">{errors.address.lastName.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Street Address</Label>
                  <Input className="h-12" placeholder="123 Main St" {...register("address.street")} />
                  {errors.address?.street && (
                    <p className="text-xs text-destructive">{errors.address.street.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Apartment / Suite (optional)</Label>
                  <Input className="h-12" placeholder="Apt 4B" {...register("address.apartment")} />
                </div>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label className="text-sm font-medium">City</Label>
                    <Input className="h-12" placeholder="Tampa" {...register("address.city")} />
                    {errors.address?.city && (
                      <p className="text-xs text-destructive">{errors.address.city.message}</p>
                    )}
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className="text-sm font-medium">State</Label>
                    <Input className="h-12" placeholder="FL" maxLength={2} {...register("address.state")} />
                    {errors.address?.state && (
                      <p className="text-xs text-destructive">{errors.address.state.message}</p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-sm font-medium">ZIP Code</Label>
                    <Input className="h-12" placeholder="33602" {...register("address.zipCode")} />
                    {errors.address?.zipCode && (
                      <p className="text-xs text-destructive">{errors.address.zipCode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notes */}
          <motion.div
            variants={fadeIn}
            className="rounded-2xl border bg-card p-6"
          >
            <h2 className="text-lg font-bold">Order Notes (optional)</h2>
            <div className="mt-4">
              <Textarea
                {...register("customerNotes")}
                placeholder="Any special instructions for your order..."
                rows={3}
                className="resize-none"
              />
            </div>
          </motion.div>

          {/* Submit - Mobile */}
          <motion.div variants={fadeIn} className="lg:hidden">
            <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Lock className="mr-2 h-5 w-5" />
              )}
              Continue to Payment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.form>

        {/* Right - Order Summary */}
        <motion.div variants={fadeIn} className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="bg-muted/50 p-4 border-b">
              <h2 className="font-bold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </h2>
            </div>

            {/* Items */}
            <div className="max-h-64 overflow-y-auto divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                    {item.product.size && (
                      <p className="text-xs text-muted-foreground">Size: {item.product.size}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({getItemCount()} items)</span>
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

            {/* Submit - Desktop */}
            <div className="hidden lg:block p-4 border-t bg-muted/30">
              <Button type="submit" form="checkout-form" size="lg" className="w-full h-14 text-base font-semibold" disabled={loading} onClick={handleSubmit(onSubmit)}>
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-5 w-5" />
                )}
                Continue to Payment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Trust badges */}
            <div className="border-t p-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" />
                <span>Encrypted</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
