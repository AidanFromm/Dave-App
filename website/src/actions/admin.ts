"use server";

import { createClient } from "@/lib/supabase/server";
import type { AdjustmentReason, AdjustmentSource } from "@/types/admin";

export async function getAdminProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return profile;
}

export async function getDashboardStats(days: number = 30) {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Current period orders
  const { data: orders } = await supabase
    .from("orders")
    .select("total, items, sales_channel, created_at")
    .gte("created_at", startDate.toISOString());

  const currentOrders = orders ?? [];
  const totalRevenue = currentOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalOrders = currentOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const itemsSold = currentOrders.reduce((sum, o) => {
    const items = o.items as Array<{ quantity: number }> | null;
    return sum + (items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0);
  }, 0);
  const webOrders = currentOrders.filter((o) => o.sales_channel === "web").length;
  const instoreOrders = currentOrders.filter((o) => o.sales_channel === "in_store").length;

  // Previous period for comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const { data: prevOrders } = await supabase
    .from("orders")
    .select("total, items")
    .gte("created_at", prevStartDate.toISOString())
    .lt("created_at", startDate.toISOString());

  const prev = prevOrders ?? [];
  const prevRevenue = prev.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const prevTotal = prev.length;
  const prevAov = prevTotal > 0 ? prevRevenue / prevTotal : 0;
  const prevItems = prev.reduce((sum, o) => {
    const items = o.items as Array<{ quantity: number }> | null;
    return sum + (items?.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0);
  }, 0);

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100);

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    itemsSold,
    webOrders,
    instoreOrders,
    revenueChange: pctChange(totalRevenue, prevRevenue),
    ordersChange: pctChange(totalOrders, prevTotal),
    aovChange: pctChange(avgOrderValue, prevAov),
    itemsChange: pctChange(itemsSold, prevItems),
  };
}

export async function getRevenueOverTime(days: number = 30) {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: orders } = await supabase
    .from("orders")
    .select("total, sales_channel, created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  // Group by date
  const byDate = new Map<string, { web: number; instore: number; total: number }>();
  (orders ?? []).forEach((o) => {
    const date = new Date(o.created_at).toISOString().split("T")[0];
    const existing = byDate.get(date) ?? { web: 0, instore: 0, total: 0 };
    const amount = o.total ?? 0;
    existing.total += amount;
    if (o.sales_channel === "web") existing.web += amount;
    else existing.instore += amount;
    byDate.set(date, existing);
  });

  return Array.from(byDate.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));
}

export async function getTopProducts(days: number = 30, limit: number = 10) {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: orders } = await supabase
    .from("orders")
    .select("items")
    .gte("created_at", startDate.toISOString());

  const productSales = new Map<string, { name: string; revenue: number; quantity: number }>();
  (orders ?? []).forEach((o) => {
    const items = o.items as Array<{ name: string; price: number; quantity: number }> | null;
    items?.forEach((item) => {
      const existing = productSales.get(item.name) ?? { name: item.name, revenue: 0, quantity: 0 };
      existing.revenue += item.price * item.quantity;
      existing.quantity += item.quantity;
      productSales.set(item.name, existing);
    });
  });

  return Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function getInventoryList(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function adjustStock(
  productId: string,
  quantityChange: number,
  reason: AdjustmentReason,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get current product
  const { data: product } = await supabase
    .from("products")
    .select("quantity")
    .eq("id", productId)
    .single();

  if (!product) throw new Error("Product not found");

  const previousQuantity = product.quantity;
  const newQuantity = previousQuantity + quantityChange;

  // Update product quantity
  const { error: updateError } = await supabase
    .from("products")
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (updateError) throw new Error(updateError.message);

  // Log adjustment
  const { error: logError } = await supabase
    .from("inventory_adjustments")
    .insert({
      product_id: productId,
      quantity_change: quantityChange,
      reason,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      notes: notes ?? null,
      adjusted_by: user.id,
      source: "admin" as AdjustmentSource,
    });

  if (logError) throw new Error(logError.message);

  return { previousQuantity, newQuantity };
}

export async function getAdminOrders(status?: string, channel?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (channel) query = query.eq("sales_channel", channel);

  const { data } = await query;
  return data ?? [];
}

export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  const supabase = await createClient();

  const updateData: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (trackingNumber) updateData.tracking_number = trackingNumber;

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function getAdminCustomers(search?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: customers } = await query;

  // Get order aggregates for each customer
  const enriched = await Promise.all(
    (customers ?? []).map(async (c) => {
      const { data: orders } = await supabase
        .from("orders")
        .select("total")
        .eq("customer_id", c.id);

      const totalOrders = orders?.length ?? 0;
      const totalSpend = orders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;
      const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

      return {
        ...c,
        total_orders: totalOrders,
        total_spend: totalSpend,
        avg_order_value: Math.round(avgOrderValue * 100) / 100,
      };
    })
  );

  return enriched;
}

export async function getCustomerDetail(customerId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (!customer) return null;

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const totalOrders = orders?.length ?? 0;
  const totalSpend = orders?.reduce((sum, o) => sum + (o.total ?? 0), 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;

  return {
    ...customer,
    orders: orders ?? [],
    total_orders: totalOrders,
    total_spend: totalSpend,
    avg_order_value: Math.round(avgOrderValue * 100) / 100,
  };
}
