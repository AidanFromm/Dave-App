import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since = todayStart.toISOString();

  const { data: todayVisitors } = await supabase
    .from("visitors")
    .select("ip, city, country, latitude, longitude")
    .gte("created_at", since);

  const visitors = todayVisitors || [];
  const totalToday = visitors.length;
  const uniqueIPs = new Set(visitors.map((v) => v.ip)).size;

  // Top country
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  for (const v of visitors) {
    if (v.country) countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
    if (v.city) cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
  }

  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Unique locations for globe
  const locations = visitors
    .filter((v) => v.latitude && v.longitude)
    .map((v) => ({ latitude: v.latitude, longitude: v.longitude }));

  // Deduplicate locations by rounding
  const seen = new Set<string>();
  const uniqueLocations = locations.filter((l) => {
    const key = `${l.latitude!.toFixed(2)},${l.longitude!.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Total all-time
  const { count: allTimeCount } = await supabase
    .from("visitors")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    totalToday,
    uniqueIPs,
    topCountry,
    topCity,
    totalAllTime: allTimeCount || 0,
    locations: uniqueLocations,
  });
}
