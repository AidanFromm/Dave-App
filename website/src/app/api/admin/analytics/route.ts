import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") ?? "30", 10);

    const supabase = createAdminClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch orders for the period
    const { data: orders, error } = await supabase
      .from("orders")
      .select("total, items, sales_channel, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Analytics query error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch analytics data" },
        { status: 500 }
      );
    }

    // Aggregate orders by date
    const dailyMap = new Map<
      string,
      {
        date: string;
        revenue: number;
        orders: number;
        web_orders: number;
        instore_orders: number;
        web_revenue: number;
        instore_revenue: number;
        items_sold: number;
      }
    >();

    (orders ?? []).forEach((order) => {
      const date = new Date(order.created_at).toISOString().split("T")[0];
      const existing = dailyMap.get(date) ?? {
        date,
        revenue: 0,
        orders: 0,
        web_orders: 0,
        instore_orders: 0,
        web_revenue: 0,
        instore_revenue: 0,
        items_sold: 0,
      };

      const amount = order.total ?? 0;
      existing.revenue += amount;
      existing.orders += 1;

      if (order.sales_channel === "web") {
        existing.web_orders += 1;
        existing.web_revenue += amount;
      } else {
        existing.instore_orders += 1;
        existing.instore_revenue += amount;
      }

      const items = order.items as Array<{ quantity: number }> | null;
      existing.items_sold +=
        items?.reduce((sum, i) => sum + (i.quantity ?? 0), 0) ?? 0;

      dailyMap.set(date, existing);
    });

    const dailyAggregates = Array.from(dailyMap.values()).map((d) => ({
      ...d,
      avg_order_value:
        d.orders > 0 ? Math.round((d.revenue / d.orders) * 100) / 100 : 0,
    }));

    // Summary totals
    const totalRevenue = dailyAggregates.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = dailyAggregates.reduce((sum, d) => sum + d.orders, 0);
    const totalItemsSold = dailyAggregates.reduce(
      (sum, d) => sum + d.items_sold,
      0
    );

    return NextResponse.json({
      period: { days, start: startDate.toISOString() },
      summary: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        avg_order_value:
          totalOrders > 0
            ? Math.round((totalRevenue / totalOrders) * 100) / 100
            : 0,
        total_items_sold: totalItemsSold,
      },
      daily: dailyAggregates,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
