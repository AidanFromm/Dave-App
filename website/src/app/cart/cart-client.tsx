"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const {
    items,
    fulfillmentType,
    setFulfillmentType,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTax,
    getShippingCost,
    getTotal,
    getItemCount,
  } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface-800/50">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold uppercase tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse our collection and find something you love.
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = getShippingCost();
  const total = getTotal();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
        Shopping Cart
        <span className="text-muted-foreground ml-2 text-lg">({getItemCount()})</span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-xl bg-card border border-border/50 p-4 transition-colors hover:border-border"
            >
              {/* Image */}
              <Link
                href={`/product/${item.product.id}`}
                className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-surface-850"
              >
                {item.product.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </Link>

              {/* Details */}
              <div className="flex flex-1 flex-col min-w-0">
                <Link
                  href={`/product/${item.product.id}`}
                  className="text-sm font-semibold hover:text-primary transition-colors line-clamp-2"
                >
                  {item.product.name}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.product.brand}
                  {(item.variant_size ?? item.product.size) && ` · Size ${item.variant_size ?? item.product.size}`}
                  {item.variant_condition && ` · ${item.variant_condition}`}
                </p>
                <p className="mt-1 text-sm font-mono font-bold text-primary">
                  {formatCurrency(item.variant_price ?? item.product.price)}
                </p>

                {/* Quantity controls */}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-full border border-border bg-surface-800/30">
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-800 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-8 w-8 items-center justify-center text-sm font-mono font-semibold" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-800 disabled:opacity-50"
                      disabled={item.quantity >= item.product.quantity}
                      aria-label={`Increase quantity of ${item.product.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold">
                      {formatCurrency((item.variant_price ?? item.product.price) * item.quantity)}
                    </span>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-xl bg-card border border-border/50 p-6 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">Order Summary</h2>

          {/* Fulfillment type */}
          <div className="mt-4 flex gap-2 p-1 bg-surface-800/30 rounded-xl">
            <button
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                fulfillmentType === "ship"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setFulfillmentType("ship")}
            >
              Ship
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                fulfillmentType === "pickup"
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setFulfillmentType("pickup")}
            >
              Pickup
            </button>
          </div>

          <div className="h-px bg-border/50 my-5" />

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (7% FL)</span>
              <span className="font-mono font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-mono font-medium">
                {shipping === 0 ? (
                  <span className="text-green-500 font-semibold">FREE</span>
                ) : (
                  formatCurrency(shipping)
                )}
              </span>
            </div>
          </div>

          {subtotal < 150 && fulfillmentType === "ship" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Add <span className="font-semibold text-primary">{formatCurrency(150 - subtotal)}</span> more for free shipping!
            </p>
          )}

          <div className="h-px bg-border/50 my-5" />

          <div className="flex justify-between text-lg">
            <span className="font-display font-bold uppercase">Total</span>
            <span className="font-mono font-bold">{formatCurrency(total)}</span>
          </div>

          <Button asChild size="lg" className="mt-6 w-full h-13 text-sm font-semibold uppercase tracking-wider">
            <Link href="/checkout">
              Checkout — {formatCurrency(total)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button variant="ghost" asChild className="mt-2 w-full text-muted-foreground hover:text-foreground">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
