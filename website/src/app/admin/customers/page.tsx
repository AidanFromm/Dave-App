"use client";

import { useEffect, useState } from "react";
import { getAdminCustomers } from "@/actions/admin";
import { CustomerTable } from "@/components/admin/customer-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

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
      <CustomerTable customers={customers} />
    </div>
  );
}
