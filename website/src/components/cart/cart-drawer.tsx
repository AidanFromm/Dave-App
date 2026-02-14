"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Package, MapPin, Trash2, Sparkles, Truck, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { formatCurrency } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
};

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
  const freeShippingPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="h-5 w-5" />
            Your Bag
            <AnimatePresence mode="wait">
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                >
                  {itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-1 flex-col items-center justify-center px-4 text-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-muted"
            >
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
            </motion.div>
            <p className="mt-4 text-xl font-semibold">Your bag is empty</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
              Find something you love and add it to your bag.
            </p>
            <Button asChild size="lg" className="mt-6" onClick={close}>
              <Link href="/">
                <Sparkles className="mr-2 h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Free shipping progress */}
            <AnimatePresence>
              {showFreeShippingProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-border bg-gradient-to-r from-primary/5 to-green-500/5 px-4 py-4"
                >
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>
                      Add <span className="font-bold text-primary">{formatCurrency(amountToFreeShipping)}</span> more
                    </span>
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <Truck className="w-4 h-4" /> FREE shipping
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${freeShippingPercent}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Got free shipping! */}
            <AnimatePresence>
              {fulfillmentType === "ship" && amountToFreeShipping <= 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-border bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-600"
                >
                  You've unlocked FREE shipping!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto">
              <motion.div layout className="divide-y divide-border">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 p-4"
                    >
                      {/* Product image */}
                      <Link
                        href={`/product/${item.product.id}`}
                        onClick={close}
                        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted group"
                      >
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            sizes="96px"
                            className="object-contain p-2 transition-transform group-hover:scale-105"
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
                            className="line-clamp-2 text-sm font-medium leading-tight hover:text-primary transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeItem(item.id)}
                            className="flex-shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>

                        {(item.variant_size ?? item.product.size) && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Size: <span className="font-medium">{item.variant_size ?? item.product.size}</span>
                            {item.variant_condition && (
                              <> · {item.variant_condition}</>
                            )}
                          </p>
                        )}

                        <p className="mt-1 text-base font-bold">
                          {formatCurrency(item.variant_price ?? item.product.price)}
                        </p>

                        {/* Quantity controls */}
                        <div className="mt-auto flex items-center gap-2 pt-2">
                          <div className="inline-flex items-center rounded-full border border-border bg-muted/50">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </motion.button>
                            <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50"
                              disabled={item.quantity >= item.product.quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="border-t border-border bg-background">
              {/* Fulfillment toggle */}
              <div className="flex p-2 gap-2 bg-muted/30">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFulfillmentType("ship")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all rounded-xl",
                    fulfillmentType === "ship"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Package className="h-4 w-4" />
                  Ship It
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFulfillmentType("pickup")}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-all rounded-xl",
                    fulfillmentType === "pickup"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MapPin className="h-4 w-4" />
                  Pick Up
                </motion.button>
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
                      <span className="text-green-600 font-semibold">FREE</span>
                    ) : (
                      formatCurrency(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-lg">
                  <span className="font-semibold">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="font-bold"
                  >
                    {formatCurrency(total)}
                  </motion.span>
                </div>
              </div>

              {/* Checkout button */}
              <div className="px-4 pb-4">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button asChild size="lg" className="w-full text-base h-14 font-semibold" onClick={close}>
                    <Link href="/checkout">
                      Checkout — {formatCurrency(total)}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </motion.div>
                <button
                  onClick={close}
                  className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
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
