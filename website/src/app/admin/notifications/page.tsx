"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Bell,
  ShoppingCart,
  AlertTriangle,
  MapPin,
  DollarSign,
  UserPlus,
  Check,
  CheckCheck,
  Loader2,
  Filter,
} from "lucide-react";

type NotificationType = "new_order" | "low_stock" | "pending_pickup" | "payment_reminder" | "new_signup";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; label: string }> = {
  new_order: { icon: ShoppingCart, color: "text-blue-500 bg-blue-500/10", label: "Order" },
  low_stock: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10", label: "Low Stock" },
  pending_pickup: { icon: MapPin, color: "text-purple-500 bg-purple-500/10", label: "Pickup" },
  payment_reminder: { icon: DollarSign, color: "text-orange-500 bg-orange-500/10", label: "Payment" },
  new_signup: { icon: UserPlus, color: "text-green-500 bg-green-500/10", label: "Signup" },
};

type FilterType = "all" | NotificationType;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const buildNotifications = useCallback(async () => {
    const supabase = createClient();
    const notifs: Notification[] = [];

    // Fetch recent orders (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [ordersRes, productsRes, customersRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, customer_email, customer_name, total, status, fulfillment_type, pickup_status, created_at")
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("products")
        .select("id, name, quantity, low_stock_threshold")
        .eq("is_active", true)
        .lte("quantity", 5),
      supabase
        .from("profiles")
        .select("id, email, created_at")
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const orders = ordersRes.data ?? [];
    const lowStockProducts = productsRes.data ?? [];
    const newCustomers = customersRes.data ?? [];

    // New orders
    for (const order of orders) {
      if (["pending", "paid"].includes(order.status)) {
        notifs.push({
          id: `order-${order.id}`,
          type: "new_order",
          title: `New Order #${order.order_number ?? order.id.slice(0, 8)}`,
          description: `${order.customer_name ?? order.customer_email ?? "Customer"} — ${formatCurrency(order.total)}`,
          metadata: { orderId: order.id },
          read: false,
          created_at: order.created_at,
        });
      }

      // Pending pickups
      if (order.fulfillment_type === "pickup" && order.pickup_status !== "picked_up" && order.status !== "cancelled") {
        notifs.push({
          id: `pickup-${order.id}`,
          type: "pending_pickup",
          title: `Pending Pickup #${order.order_number ?? order.id.slice(0, 8)}`,
          description: `${order.customer_name ?? "Customer"} — ${order.pickup_status === "ready" ? "Ready, awaiting pickup" : "Needs to be prepared"}`,
          metadata: { orderId: order.id },
          read: false,
          created_at: order.created_at,
        });
      }

      // Payment reminders (pending orders older than 1 day)
      if (order.status === "pending") {
        const orderDate = new Date(order.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        if (orderDate < oneDayAgo) {
          notifs.push({
            id: `payment-${order.id}`,
            type: "payment_reminder",
            title: `Payment Pending #${order.order_number ?? order.id.slice(0, 8)}`,
            description: `${order.customer_name ?? order.customer_email ?? "Customer"} — ${formatCurrency(order.total)} unpaid`,
            metadata: { orderId: order.id },
            read: false,
            created_at: order.created_at,
          });
        }
      }
    }

    // Low stock alerts
    for (const product of lowStockProducts) {
      notifs.push({
        id: `stock-${product.id}`,
        type: "low_stock",
        title: `Low Stock: ${product.name}`,
        description: `Only ${product.quantity} remaining (threshold: ${product.low_stock_threshold})`,
        metadata: { productId: product.id },
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    // New customer signups
    for (const customer of newCustomers) {
      notifs.push({
        id: `signup-${customer.id}`,
        type: "new_signup",
        title: "New Customer Signup",
        description: customer.email ?? "Unknown email",
        metadata: { customerId: customer.id },
        read: false,
        created_at: customer.created_at,
      });
    }

    // Sort by date
    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setNotifications(notifs);
    setLoading(false);
  }, []);

  useEffect(() => {
    buildNotifications();

    // Real-time subscriptions
    const supabase = createClient();

    const ordersChannel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        buildNotifications();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => {
        buildNotifications();
      })
      .subscribe();

    const productsChannel = supabase
      .channel("admin-products")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, () => {
        buildNotifications();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel("admin-profiles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, () => {
        buildNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [buildNotifications]);

  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const markAllRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const filtered = filter === "all" ? notifications : notifications.filter((n) => n.type === filter);
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "new_order", label: "Orders" },
    { key: "low_stock", label: "Low Stock" },
    { key: "pending_pickup", label: "Pickups" },
    { key: "payment_reminder", label: "Payments" },
    { key: "new_signup", label: "Signups" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all",
              filter === f.key
                ? "bg-primary text-white"
                : "bg-surface-800/50 text-muted-foreground hover:text-foreground hover:bg-surface-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notifications in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const config = TYPE_CONFIG[notif.type];
            const Icon = config.icon;
            const isRead = readIds.has(notif.id);

            return (
              <div
                key={notif.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 transition-colors cursor-pointer",
                  isRead
                    ? "border-border bg-card opacity-60"
                    : "border-border bg-card hover:bg-surface-800/30"
                )}
                onClick={() => markRead(notif.id)}
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-sm font-semibold", !isRead && "text-foreground")}>{notif.title}</p>
                    {!isRead && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{notif.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateShort(notif.created_at)}
                  </p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 border-0 text-[10px]", config.color)}>
                  {config.label}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
