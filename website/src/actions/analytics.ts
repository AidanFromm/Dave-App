"use server";

import { createClient } from "@/lib/supabase/server";

export interface AnalyticsData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    itemsSold: number;
    uniqueCustomers: number;
    revenueChange: number;
    ordersChange: number;
    aovChange: number;
    itemsChange: number;
    customersChange: number;
  };
  revenueOverTime: Array<{ date: string; web: number; instore: number; total: number }>;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  categoryData: Array<{ name: string; value: number }>;
  salesByDay: Array<{ day: string; revenue: number }>;
  salesByHour: Array<{ hour: string; revenue: number }>;
  channelData: Array<{ name: string; orders: number; revenue: number }>;
  customers: {
    total: number;
    new: number;
    returning: number;
    topCustomers: Array<{ email: string; totalSpend: number; orderCount: number }>;
  };
  inventory: {
    total: number;
    lowStock: number;
    outOfStock: number;
    avgTurnoverDays: number | null;
    deadStock: Array<{ name: string; quantity: number; lastSoldDaysAgo: number | null }>;
  };
  profit: {
    totalProfit: number;
    profitMargin: number;
    hasCostData: boolean;
    mostProfitable: Array<{ name: string; profit: number; margin: number }>;
  };
}

export async function getAnalyticsData(days: number): Promise<AnalyticsData> {
  const supabase = await createClient();
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);

  // Current period orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id, total, items, channel, customer_email, created_at, status")
    .gte("created_at", startDate.toISOString());
  const currentOrders = orders ?? [];

  // Previous period orders
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - days);
  const { data: prevOrders } = await supabase
    .from("orders")
    .select("id, total, items, channel, customer_email, created_at")
    .gte("created_at", prevStartDate.toISOString())
    .lt("created_at", startDate.toISOString());
  const prev = prevOrders ?? [];

  // All orders before this period for "new customer" detection
  const { data: allOrdersBefore } = await supabase
    .from("orders")
    .select("customer_email")
    .lt("created_at", startDate.toISOString());
  const existingEmails = new Set(
    (allOrdersBefore ?? []).map((o) => o.customer_email?.toLowerCase()).filter(Boolean)
  );

  // Products with cost data
  const { data: allProducts } = await supabase
    .from("products")
    .select("id, name, category, quantity, cost, price, created_at, updated_at");
  const products = allProducts ?? [];

  // --- Stats ---
  type OrderItem = { name: string; price: number; quantity: number; product_id?: string; cost?: number };

  const totalRevenue = currentOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalOrders = currentOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const itemsSold = currentOrders.reduce((s, o) => {
    const items = o.items as OrderItem[] | null;
    return s + (items?.reduce((a, i) => a + (i.quantity ?? 0), 0) ?? 0);
  }, 0);

  const customerEmails = new Set(
    currentOrders.map((o) => o.customer_email?.toLowerCase()).filter(Boolean)
  );
  const uniqueCustomers = customerEmails.size;

  // Previous period
  const prevRevenue = prev.reduce((s, o) => s + (o.total ?? 0), 0);
  const prevTotal = prev.length;
  const prevAov = prevTotal > 0 ? prevRevenue / prevTotal : 0;
  const prevItems = prev.reduce((s, o) => {
    const items = o.items as OrderItem[] | null;
    return s + (items?.reduce((a, i) => a + (i.quantity ?? 0), 0) ?? 0);
  }, 0);
  const prevCustomerEmails = new Set(
    prev.map((o) => o.customer_email?.toLowerCase()).filter(Boolean)
  );

  const pctChange = (curr: number, p: number) =>
    p === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - p) / p) * 100);

  // --- Revenue Over Time ---
  const revenueByDate = new Map<string, { web: number; instore: number }>();
  currentOrders.forEach((o) => {
    const date = new Date(o.created_at).toISOString().split("T")[0];
    const existing = revenueByDate.get(date) ?? { web: 0, instore: 0 };
    const amount = o.total ?? 0;
    if (o.channel === "web") existing.web += amount;
    else existing.instore += amount;
    revenueByDate.set(date, existing);
  });
  const revenueOverTime = Array.from(revenueByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, web: d.web, instore: d.instore, total: d.web + d.instore }));

  // --- Channel Data ---
  const webOrders = currentOrders.filter((o) => o.channel === "web");
  const instoreOrders = currentOrders.filter((o) => o.channel !== "web");
  const channelData = [
    {
      name: "Online",
      orders: webOrders.length,
      revenue: webOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    },
    {
      name: "In-Store",
      orders: instoreOrders.length,
      revenue: instoreOrders.reduce((s, o) => s + (o.total ?? 0), 0),
    },
  ];

  // --- Top Products ---
  const productSales = new Map<string, { name: string; revenue: number; quantity: number }>();
  currentOrders.forEach((o) => {
    const items = o.items as OrderItem[] | null;
    items?.forEach((item) => {
      const existing = productSales.get(item.name) ?? { name: item.name, revenue: 0, quantity: 0 };
      existing.revenue += (item.price ?? 0) * (item.quantity ?? 0);
      existing.quantity += item.quantity ?? 0;
      productSales.set(item.name, existing);
    });
  });
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)
    .map((p) => ({
      ...p,
      name: p.name.length > 35 ? p.name.substring(0, 32) + "..." : p.name,
    }));

  // --- Category Breakdown ---
  const productCategoryMap = new Map<string, string>();
  products.forEach((p) => {
    if (p.category) productCategoryMap.set(p.name?.toLowerCase(), p.category);
  });

  const categoryRevenue: Record<string, number> = {};
  currentOrders.forEach((o) => {
    const items = o.items as OrderItem[] | null;
    items?.forEach((item) => {
      const cat = productCategoryMap.get(item.name?.toLowerCase()) || "Other";
      categoryRevenue[cat] = (categoryRevenue[cat] ?? 0) + (item.price ?? 0) * (item.quantity ?? 0);
    });
  });
  const categoryData = Object.entries(categoryRevenue)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // --- Sales by Day of Week ---
  const dayTotals = [0, 0, 0, 0, 0, 0, 0];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  currentOrders.forEach((o) => {
    const d = new Date(o.created_at).getDay();
    dayTotals[d] += o.total ?? 0;
    dayCounts[d] += 1;
  });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeksInPeriod = Math.max(1, Math.ceil(days / 7));
  const salesByDay = dayNames.map((name, i) => ({
    day: name,
    revenue: dayCounts[i] > 0 ? Math.round(dayTotals[i] / weeksInPeriod) : 0,
  }));

  // --- Sales by Hour ---
  const hourTotals = Array(24).fill(0) as number[];
  currentOrders.forEach((o) => {
    const h = new Date(o.created_at).getHours();
    hourTotals[h] += o.total ?? 0;
  });
  const salesByHour = hourTotals.map((revenue, hour) => ({
    hour: hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`,
    revenue: Math.round(revenue),
  }));

  // --- Customer Insights ---
  const customerSpend = new Map<string, { totalSpend: number; orderCount: number }>();
  currentOrders.forEach((o) => {
    const email = o.customer_email?.toLowerCase();
    if (email) {
      const existing = customerSpend.get(email) ?? { totalSpend: 0, orderCount: 0 };
      existing.totalSpend += o.total ?? 0;
      existing.orderCount += 1;
      customerSpend.set(email, existing);
    }
  });

  const newCustomerCount = Array.from(customerSpend.keys()).filter(
    (e) => !existingEmails.has(e)
  ).length;
  const returningCustomerCount = uniqueCustomers - newCustomerCount;

  const topCustomers = Array.from(customerSpend.entries())
    .map(([email, data]) => ({ email, ...data }))
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 5);

  // --- Inventory Insights ---
  // Avg turnover: look at sold items' created_at vs order created_at
  // We approximate by checking product created_at vs first sale
  const soldProductNames = new Set<string>();
  const productFirstSaleDate = new Map<string, string>();
  currentOrders.forEach((o) => {
    const items = o.items as OrderItem[] | null;
    items?.forEach((item) => {
      soldProductNames.add(item.name?.toLowerCase());
      const existing = productFirstSaleDate.get(item.name?.toLowerCase());
      if (!existing || o.created_at < existing) {
        productFirstSaleDate.set(item.name?.toLowerCase(), o.created_at);
      }
    });
  });

  // Calculate avg days from product creation to first sale
  let turnoverSum = 0;
  let turnoverCount = 0;
  products.forEach((p) => {
    const saleDate = productFirstSaleDate.get(p.name?.toLowerCase());
    if (saleDate && p.created_at) {
      const daysDiff = Math.round(
        (new Date(saleDate).getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff >= 0) {
        turnoverSum += daysDiff;
        turnoverCount += 1;
      }
    }
  });
  const avgTurnoverDays = turnoverCount > 0 ? Math.round(turnoverSum / turnoverCount) : null;

  // Dead stock: products not sold in 30+ days
  // Check all orders in last 30 days for sold product names
  const recentSoldNames = new Set<string>();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("items")
    .gte("created_at", thirtyDaysAgo.toISOString());
  (recentOrders ?? []).forEach((o) => {
    const items = o.items as OrderItem[] | null;
    items?.forEach((item) => recentSoldNames.add(item.name?.toLowerCase()));
  });

  const deadStock = products
    .filter((p) => (p.quantity ?? 0) > 0 && !recentSoldNames.has(p.name?.toLowerCase()))
    .map((p) => ({
      name: p.name.length > 35 ? p.name.substring(0, 32) + "..." : p.name,
      quantity: p.quantity ?? 0,
      lastSoldDaysAgo: null as number | null,
    }))
    .slice(0, 10);

  const lowStock = products.filter((p) => (p.quantity ?? 0) > 0 && (p.quantity ?? 0) < 3).length;
  const outOfStock = products.filter((p) => (p.quantity ?? 0) === 0).length;

  // --- Profit Section ---
  const productCostMap = new Map<string, number>();
  products.forEach((p) => {
    if (p.cost != null && p.cost > 0) {
      productCostMap.set(p.name?.toLowerCase(), p.cost);
    }
  });

  const hasCostData = productCostMap.size > 0;
  let totalProfit = 0;
  let totalCostRevenue = 0;
  const productProfit = new Map<string, { name: string; profit: number; revenue: number }>();

  if (hasCostData) {
    currentOrders.forEach((o) => {
      const items = o.items as OrderItem[] | null;
      items?.forEach((item) => {
        const cost = productCostMap.get(item.name?.toLowerCase());
        if (cost != null) {
          const itemRevenue = (item.price ?? 0) * (item.quantity ?? 0);
          const itemProfit = itemRevenue - cost * (item.quantity ?? 0);
          totalProfit += itemProfit;
          totalCostRevenue += itemRevenue;

          const existing = productProfit.get(item.name) ?? { name: item.name, profit: 0, revenue: 0 };
          existing.profit += itemProfit;
          existing.revenue += itemRevenue;
          productProfit.set(item.name, existing);
        }
      });
    });
  }

  const mostProfitable = Array.from(productProfit.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 35 ? p.name.substring(0, 32) + "..." : p.name,
      profit: Math.round(p.profit * 100) / 100,
      margin: p.revenue > 0 ? Math.round((p.profit / p.revenue) * 100) : 0,
    }));

  const profitMargin = totalCostRevenue > 0 ? Math.round((totalProfit / totalCostRevenue) * 100) : 0;

  return {
    stats: {
      totalRevenue,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      itemsSold,
      uniqueCustomers,
      revenueChange: pctChange(totalRevenue, prevRevenue),
      ordersChange: pctChange(totalOrders, prevTotal),
      aovChange: pctChange(avgOrderValue, prevAov),
      itemsChange: pctChange(itemsSold, prevItems),
      customersChange: pctChange(uniqueCustomers, prevCustomerEmails.size),
    },
    revenueOverTime,
    topProducts,
    categoryData,
    salesByDay,
    salesByHour,
    channelData,
    customers: {
      total: uniqueCustomers,
      new: newCustomerCount,
      returning: returningCustomerCount,
      topCustomers,
    },
    inventory: {
      total: products.length,
      lowStock,
      outOfStock,
      avgTurnoverDays,
      deadStock,
    },
    profit: {
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin,
      hasCostData,
      mostProfitable,
    },
  };
}
