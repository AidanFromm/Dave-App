import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { CONDITION_LABELS } from "@/types/product";
import type { Product } from "@/types/product";
import { Plus, Edit } from "lucide-react";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const products = (data ?? []) as Product[];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products ({products.length})</h1>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Link>
        </Button>
      </div>

      {/* Product table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-semibold">Product</th>
              <th className="pb-3 font-semibold">SKU</th>
              <th className="pb-3 font-semibold">Condition</th>
              <th className="pb-3 font-semibold">Price</th>
              <th className="pb-3 font-semibold">Qty</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border last:border-0"
              >
                <td className="py-3">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}
                      {product.size && ` · Size ${product.size}`}
                    </p>
                  </div>
                </td>
                <td className="py-3 text-muted-foreground">
                  {product.sku ?? "—"}
                </td>
                <td className="py-3">
                  <Badge variant="outline" className="text-xs">
                    {CONDITION_LABELS[product.condition]}
                  </Badge>
                </td>
                <td className="py-3">{formatCurrency(product.price)}</td>
                <td className="py-3">
                  <span
                    className={
                      product.quantity <= 0
                        ? "font-bold text-destructive"
                        : product.quantity <= product.low_stock_threshold
                          ? "font-bold text-secured-warning"
                          : ""
                    }
                  >
                    {product.quantity}
                  </span>
                </td>
                <td className="py-3">
                  {product.is_featured && (
                    <Badge className="mr-1 text-[10px]">Featured</Badge>
                  )}
                  {product.is_drop && (
                    <Badge variant="secondary" className="text-[10px]">
                      Drop
                    </Badge>
                  )}
                </td>
                <td className="py-3">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
