import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface VisitorRow {
  id: string;
  ip_address: string;
  country: string | null;
  country_code: string | null;
  city: string | null;
  region: string | null;
  device_type: string | null;
  user_agent: string | null;
  page_path: string;
  referrer: string | null;
  created_at: string;
}

interface GroupedVisitor {
  ip: string;
  country: string | null;
  country_code: string | null;
  city: string | null;
  device: string | null;
  visits: number;
  pages: string[];
  firstSeen: string;
  lastUpdated: string;
}

function getPeriodDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";
    const countryFilter = searchParams.get("country") || null;

    const supabase = createAdminClient();
    const periodDate = getPeriodDate(period);

    // Build query for the selected period
    let query = supabase
      .from("visitor_logs")
      .select("*")
      .gte("created_at", periodDate.toISOString())
      .order("created_at", { ascending: false });

    if (countryFilter) {
      query = query.eq("country", countryFilter);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Visitor fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch visitors" },
        { status: 500 }
      );
    }

    const visitors = (rows || []) as VisitorRow[];

    // Get today's start for today count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all-time count
    const { count: allTimeCount } = await supabase
      .from("visitor_logs")
      .select("*", { count: "exact", head: true });

    // Calculate stats
    const uniqueIps = new Set(visitors.map((v) => v.ip_address));
    const todayVisits = visitors.filter(
      (v) => new Date(v.created_at) >= todayStart
    ).length;

    // Count countries and cities
    const countryCounts = new Map<string, number>();
    const cityCounts = new Map<string, number>();
    for (const v of visitors) {
      if (v.country) {
        countryCounts.set(v.country, (countryCounts.get(v.country) || 0) + 1);
      }
      if (v.city) {
        cityCounts.set(v.city, (cityCounts.get(v.city) || 0) + 1);
      }
    }

    const topCountry =
      Array.from(countryCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topCity =
      Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Group visitors by IP
    const grouped = new Map<string, GroupedVisitor>();
    for (const v of visitors) {
      const existing = grouped.get(v.ip_address);
      if (existing) {
        existing.visits++;
        if (!existing.pages.includes(v.page_path)) {
          existing.pages.push(v.page_path);
        }
        if (new Date(v.created_at) < new Date(existing.firstSeen)) {
          existing.firstSeen = v.created_at;
        }
        if (new Date(v.created_at) > new Date(existing.lastUpdated)) {
          existing.lastUpdated = v.created_at;
          // Update with latest info
          existing.country = v.country || existing.country;
          existing.country_code = v.country_code || existing.country_code;
          existing.city = v.city || existing.city;
          existing.device = v.device_type || existing.device;
        }
      } else {
        grouped.set(v.ip_address, {
          ip: v.ip_address,
          country: v.country,
          country_code: v.country_code,
          city: v.city,
          device: v.device_type,
          visits: 1,
          pages: [v.page_path],
          firstSeen: v.created_at,
          lastUpdated: v.created_at,
        });
      }
    }

    // Sort grouped visitors by lastUpdated descending
    const groupedVisitors = Array.from(grouped.values()).sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );

    // Activity log: most recent 100 entries
    const activityLog = visitors.slice(0, 100).map((v) => ({
      ip: v.ip_address,
      page_path: v.page_path,
      city: v.city,
      country: v.country,
      device: v.device_type,
      created_at: v.created_at,
    }));

    return NextResponse.json({
      stats: {
        pageViews: visitors.length,
        uniqueIps: uniqueIps.size,
        topCountry,
        topCity,
        todayVisits,
        allTimeVisits: allTimeCount || 0,
      },
      visitors: groupedVisitors,
      activityLog,
    });
  } catch (err) {
    console.error("Visitors API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
