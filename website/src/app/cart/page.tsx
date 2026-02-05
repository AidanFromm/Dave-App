"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
        <ShoppingBag className="h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection and find something you love.
        </p>
        <Button asChild className="mt-6">
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold">Shopping Cart ({getItemCount()})</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border border-border bg-card p-4"
            >
              {/* Image */}
              <Link
                href={`/product/${item.product.id}`}
                className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.product.images?.[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </Link>

              {/* Details */}
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/product/${item.product.id}`}
                  className="font-semibold hover:text-primary"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {item.product.brand}
                  {item.product.size && ` · Size ${item.product.size}`}
                </p>
                <p className="text-sm font-medium">
                  {formatCurrency(item.product.price)}
                </p>

                {/* Quantity controls */}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity - 1
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={item.quantity >= item.product.quantity}
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.quantity + 1
                        )
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Order Summary</h2>

          {/* Fulfillment type */}
          <div className="mt-4 flex gap-2">
            <Button
              variant={fulfillmentType === "ship" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setFulfillmentType("ship")}
            >
              Ship
            </Button>
            <Button
              variant={fulfillmentType === "pickup" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setFulfillmentType("pickup")}
            >
              Pickup
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Tax (7% FL Sales Tax)
              </span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="font-medium text-secured-success">FREE</span>
                ) : (
                  formatCurrency(shipping)
                )}
              </span>
            </div>
          </div>

          {subtotal < 150 && fulfillmentType === "ship" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Add {formatCurrency(150 - subtotal)} more for free shipping!
            </p>
          )}

          <Separator className="my-4" />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <Button asChild size="lg" className="mt-4 w-full">
            <Link href="/checkout">
              Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button variant="ghost" asChild className="mt-2 w-full">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
