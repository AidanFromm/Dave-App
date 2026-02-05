"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types/order";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { formatCurrency, formatDateShort } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export default function OrderLookupPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const supabase = createClient();
    const { data: results, error: err } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", data.email)
      .order("created_at", { ascending: false });

    if (err) {
      setError("Failed to look up orders");
    } else {
      setOrders((results ?? []) as Order[]);
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold">Track Your Order</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the email you used at checkout
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Look Up Orders
        </Button>
      </form>

      {orders !== null && (
        <div className="mt-8">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No orders found for that email.
            </p>
          ) : (
            <div className="space-y-3">
              <h2 className="font-semibold">
                {orders.length} order{orders.length !== 1 ? "s" : ""} found
              </h2>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateShort(order.created_at)}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
