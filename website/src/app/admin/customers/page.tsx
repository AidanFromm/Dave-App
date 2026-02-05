"use client";

import { useEffect, useState } from "react";
import { getAdminCustomers } from "@/actions/admin";
import { CustomerTable } from "@/components/admin/customer-table";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="p-6">
        <Skeleton className="h-8 w-52" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full max-w-sm" />
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
      <h1 className="text-2xl font-bold">Customers ({customers.length})</h1>
      <div className="mt-6">
        <CustomerTable customers={customers} />
      </div>
    </div>
  );
}
