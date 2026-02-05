"use client";

import { useEffect, useState } from "react";
import { getAdminOrders } from "@/actions/admin";
import { OrderTable } from "@/components/admin/order-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminOrders()
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-8 w-64" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Orders ({orders.length})</h1>
      <div className="mt-6">
        <OrderTable orders={orders} />
      </div>
    </div>
  );
}
