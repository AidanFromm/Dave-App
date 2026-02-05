import { createClient } from "@/lib/supabase/server";
import {
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, quantity, low_stock_threshold, price, is_active")
    .eq("is_active", true);

  const allProducts = products ?? [];
  const totalProducts = allProducts.length;
  const lowStock = allProducts.filter(
    (p) => p.quantity > 0 && p.quantity <= p.low_stock_threshold
  ).length;
  const outOfStock = allProducts.filter((p) => p.quantity <= 0).length;
  const inventoryValue = allProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );

  const stats = [
    {
      label: "Total Products",
      value: totalProducts,
      icon: Package,
      color: "text-secured-info",
    },
    {
      label: "Low Stock",
      value: lowStock,
      icon: AlertTriangle,
      color: "text-secured-warning",
    },
    {
      label: "Out of Stock",
      value: outOfStock,
      icon: XCircle,
      color: "text-secured-error",
    },
    {
      label: "Inventory Value",
      value: `$${inventoryValue.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-secured-success",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
