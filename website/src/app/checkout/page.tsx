"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart-store";
import { shippingFormSchema, type ShippingFormValues } from "@/lib/validators";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CheckoutProgress } from "@/components/checkout/checkout-progress";

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
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button asChild className="mt-4">
          <Link href="/">Continue Shopping</Link>
        </Button>
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
    // Store email in sessionStorage for the review step
    sessionStorage.setItem("checkout_email", data.email);
    router.push("/checkout/review");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <CheckoutProgress currentStep={1} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* Contact */}
        <div className="space-y-3">
          <h2 className="font-semibold">Contact</h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* Fulfillment */}
        <div className="space-y-3">
          <h2 className="font-semibold">Fulfillment</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={watchFulfillment === "ship" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setValue("fulfillmentType", "ship")}
            >
              Ship to Address
            </Button>
            <Button
              type="button"
              variant={watchFulfillment === "pickup" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setValue("fulfillmentType", "pickup")}
            >
              Store Pickup
            </Button>
          </div>
        </div>

        {/* Shipping address */}
        {watchFulfillment === "ship" && (
          <div className="space-y-3">
            <h2 className="font-semibold">Shipping Address</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...register("address.firstName")} />
                {errors.address?.firstName && (
                  <p className="text-xs text-destructive">
                    {errors.address.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...register("address.lastName")} />
                {errors.address?.lastName && (
                  <p className="text-xs text-destructive">
                    {errors.address.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input {...register("address.street")} />
              {errors.address?.street && (
                <p className="text-xs text-destructive">
                  {errors.address.street.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Apartment / Suite (optional)</Label>
              <Input {...register("address.apartment")} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...register("address.city")} />
                {errors.address?.city && (
                  <p className="text-xs text-destructive">
                    {errors.address.city.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input {...register("address.state")} maxLength={2} />
                {errors.address?.state && (
                  <p className="text-xs text-destructive">
                    {errors.address.state.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input {...register("address.zipCode")} />
                {errors.address?.zipCode && (
                  <p className="text-xs text-destructive">
                    {errors.address.zipCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label>Order Notes (optional)</Label>
          <Textarea
            {...register("customerNotes")}
            placeholder="Any special instructions..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Summary */}
        <div className="rounded-xl shadow-card bg-card p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {getItemCount()} items
            </span>
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
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(getTotal())}</span>
          </div>
        </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
