"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { Search, ArrowUpDown } from "lucide-react";

type SortField = "total_spend" | "total_orders" | "created_at";
type SortDir = "asc" | "desc";

interface CustomerTableProps {
  customers: Array<any>;
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("total_spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = customers;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (`${c.first_name ?? ""} ${c.last_name ?? ""}`.toLowerCase()).includes(q) ||
          (c.email?.toLowerCase() ?? "").includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (sortField === "created_at") {
        const diff = new Date(aVal).getTime() - new Date(bVal).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [customers, search, sortField, sortDir]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? "text-primary" : "text-muted-foreground"}`} />
    </button>
  );

  return (
    <div>
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-semibold">Name</th>
              <th className="pb-3 font-semibold">Email</th>
              <th className="pb-3 font-semibold text-center">
                <SortButton field="total_orders">Orders</SortButton>
              </th>
              <th className="pb-3 font-semibold text-right">
                <SortButton field="total_spend">Total Spend</SortButton>
              </th>
              <th className="pb-3 font-semibold text-right">AOV</th>
              <th className="pb-3 font-semibold text-right">
                <SortButton field="created_at">Joined</SortButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {customer.first_name ?? ""} {customer.last_name ?? ""}
                    </Link>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {customer.email ?? "—"}
                  </td>
                  <td className="py-3 text-center">{customer.total_orders ?? 0}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(customer.total_spend ?? 0)}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {formatCurrency(customer.avg_order_value ?? 0)}
                  </td>
                  <td className="py-3 text-right text-muted-foreground">
                    {customer.created_at ? formatDateShort(customer.created_at) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
