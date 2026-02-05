import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrders } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/types/order";
import { ChevronRight, Package } from "lucide-react";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Fetch by customer_id or email
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const orders = customer ? await getOrders(customer.id) : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Order History</h1>

      {orders.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your order history will appear here
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div>
                <p className="font-semibold">{order.order_number}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateShort(order.created_at)} ·{" "}
                  {order.items?.length ?? 0} item
                  {(order.items?.length ?? 0) !== 1 ? "s" : ""}
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
