"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronRight, Package, Truck, CheckCircle, Clock, ShoppingBag, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <ShoppingBag className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function OrderLookupPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    setError("");
    setSearchedEmail(data.email);
    // NOTE: This query uses the Supabase client-side client.
    // Ensure RLS policies are enabled on the "orders" table so users
    // can only access their own orders. Consider moving to an API route
    // (e.g. /api/orders/lookup) for additional server-side validation.
    const supabase = createClient();
    const { data: results, error: err } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", data.email)
      .order("created_at", { ascending: false });

    if (err) {
      setError("Failed to look up orders. Please try again.");
    } else {
      setOrders((results ?? []) as Order[]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
        }}
        className="w-full max-w-lg"
      >
        <motion.div variants={fadeIn} className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black tracking-tight">
              <span className="text-primary">S</span>
              <span className="text-foreground">ECURED</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold">Track Your Order</h1>
          <p className="mt-1 text-muted-foreground">
            Enter the email you used at checkout
          </p>
        </motion.div>

        <motion.div
          variants={fadeIn}
          className="rounded-2xl border bg-card p-6 sm:p-8 shadow-lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-12 pr-12"
                  {...register("email")}
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Search className="mr-2 h-5 w-5" />
                )}
                Look Up Orders
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {orders !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              {orders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center rounded-2xl border bg-card p-8"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="mt-4 font-semibold">No orders found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We couldn't find any orders for {searchedEmail}
                  </p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/">Start Shopping</Link>
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">
                      {orders.length} order{orders.length !== 1 ? "s" : ""} found
                    </h2>
                    <span className="text-sm text-muted-foreground">{searchedEmail}</span>
                  </div>

                  <div className="space-y-3">
                    {orders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link href={`/orders/${order.id}`}>
                          <motion.div
                            whileHover={{ scale: 1.01, x: 4 }}
                            className="flex items-center justify-between rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold">{order.order_number}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateShort(order.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs gap-1",
                                    statusColors[order.status] || statusColors.pending
                                  )}
                                >
                                  {statusIcons[order.status] || statusIcons.pending}
                                  {ORDER_STATUS_LABELS[order.status]}
                                </Badge>
                                <p className="mt-1 text-sm font-bold">
                                  {formatCurrency(order.total)}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help text */}
        <motion.div variants={fadeIn} className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Have an account?{" "}
            <Link href="/auth/sign-in" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
            {" "}to view all your orders
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
