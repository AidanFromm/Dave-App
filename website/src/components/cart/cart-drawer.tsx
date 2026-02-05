"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { formatCurrency } from "@/types/product";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { isOpen, close } = useCartDrawerStore();
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

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = getShippingCost();
  const total = getTotal();
  const itemCount = getItemCount();

  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;
  const showFreeShippingProgress = fulfillmentType === "ship" && amountToFreeShipping > 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5" />
            Your Bag ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-semibold">Your bag is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Find something you love and add it to your bag.
            </p>
            <Button asChild className="mt-6" onClick={close}>
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            {showFreeShippingProgress && (
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <p className="text-sm text-center">
                  Add <span className="font-semibold text-primary">{formatCurrency(amountToFreeShipping)}</span> more for{" "}
                  <span className="font-semibold text-green-600">FREE shipping</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Items list */}
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4">
                    {/* Product image */}
                    <Link
                      href={`/product/${item.product.id}`}
                      onClick={close}
                      className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted"
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
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </Link>

                    {/* Product info */}
                    <div className="flex flex-1 flex-col min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.product.id}`}
                          onClick={close}
                          className="line-clamp-2 text-sm font-medium leading-tight hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="flex-shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {item.product.size && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Size: {item.product.size}
                        </p>
                      )}

                      <p className="mt-1 text-sm font-semibold">
                        {formatCurrency(item.product.price)}
                      </p>

                      {/* Quantity controls */}
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        <div className="inline-flex items-center rounded-lg border border-border">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex h-8 w-8 items-center justify-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            disabled={item.quantity >= item.product.quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-background">
              {/* Fulfillment toggle */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setFulfillmentType("ship")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                    fulfillmentType === "ship"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Package className="h-4 w-4" />
                  Ship
                </button>
                <button
                  onClick={() => setFulfillmentType("pickup")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                    fulfillmentType === "pickup"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MapPin className="h-4 w-4" />
                  Pickup
                </button>
              </div>

              {/* Order summary */}
              <div className="space-y-2 px-4 py-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (7%)</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Checkout button */}
              <div className="px-4 pb-4">
                <Button asChild size="lg" className="w-full text-base" onClick={close}>
                  <Link href="/checkout">
                    Checkout — {formatCurrency(total)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <button
                  onClick={close}
                  className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
