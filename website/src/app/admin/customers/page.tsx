"use client";

import { useEffect, useState } from "react";
import { getAdminCustomers } from "@/actions/admin";
import { CustomerTable } from "@/components/admin/customer-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import Link from "next/link";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminCustomers()
      .then((data) => setCustomers(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">{customers.length} total customers</p>
      </div>
      {customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No customers yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Customers will show up here once they create an account or place an order.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/orders/new">Create an Order</Link>
          </Button>
        </div>
      ) : (
        <CustomerTable customers={customers} />
      )}
    </div>
  );
}
