import { Metadata } from "next";
import { Truck, Clock, MapPin, Package, Globe, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy | Secured Tampa",
  description: "Free shipping on orders over $200. Fast processing, secure packaging, and local pickup available in Tampa, FL.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Shipping Information</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Fast processing, secure packaging, and reliable delivery on every order.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border bg-card p-5 text-center">
          <Truck className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">$200+</p>
          <p className="mt-1 text-xs text-muted-foreground">Free Shipping</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 text-center">
          <Clock className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">1–2</p>
          <p className="mt-1 text-xs text-muted-foreground">Days Processing</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 text-center">
          <Package className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">3–5</p>
          <p className="mt-1 text-xs text-muted-foreground">Days Delivery</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 text-center">
          <Globe className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-3 text-2xl font-bold">50</p>
          <p className="mt-1 text-xs text-muted-foreground">US States</p>
        </div>
      </div>

      {/* Shipping Options */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold">Shipping Options</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Standard Shipping</h3>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-medium">$10 flat rate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free shipping</span>
                <span className="font-medium">Orders over $200</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-medium">3–5 business days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Carriers</span>
                <span className="font-medium">USPS / UPS</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Local Pickup</h3>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-medium text-green-500">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Availability</span>
                <span className="font-medium">Same or next day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">Tampa, FL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">How</span>
                <span className="font-medium">Select at checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-16 space-y-10">
        {/* Processing */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Processing & Tracking</h2>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>
              Orders are processed within 1–2 business days (Monday through Friday, excluding holidays). 
              Orders placed after 2:00 PM EST may be processed the next business day.
            </p>
            <p>
              Once your order ships, you'll receive an email with tracking information. You can 
              also check your order status anytime on the{" "}
              <Link href="/orders/lookup" className="text-primary hover:underline font-medium">
                Track Order
              </Link>{" "}
              page.
            </p>
          </div>
        </div>

        {/* Packaging */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Packaging Standards</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="font-medium text-sm">Sneakers</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Double-boxed to prevent crushing and ensure shoes arrive in perfect condition.
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="font-medium text-sm">Pokémon Cards</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Shipped in protective sleeves with rigid cardboard backing to prevent bending.
              </p>
            </div>
          </div>
        </div>

        {/* Issues */}
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Delivery Issues</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            If your package is lost, damaged, or significantly delayed, contact us within 
            7 days of the expected delivery date. We'll work to resolve the issue promptly.
          </p>
          <a
            href="mailto:securedtampa.llc@gmail.com"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            securedtampa.llc@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
