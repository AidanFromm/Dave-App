import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since = todayStart.toISOString();

  // Get today's visitors
  const { data: todayVisitors } = await supabase
    .from("visitors")
    .select("ip, city, country, latitude, longitude")
    .gte("created_at", since);

  const visitors = todayVisitors || [];
  const totalToday = visitors.length;
  const uniqueIPs = new Set(visitors.map((v) => v.ip)).size;

  // Top country & city
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  for (const v of visitors) {
    if (v.country) countryCounts[v.country] = (countryCounts[v.country] || 0) + 1;
    if (v.city) cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
  }

  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Unique locations for globe — get from all time for better visualization
  const { data: allLocations } = await supabase
    .from("visitors")
    .select("latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const seen = new Set<string>();
  const uniqueLocations = (allLocations || []).filter((l) => {
    const key = `${Number(l.latitude).toFixed(2)},${Number(l.longitude).toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(l => ({ latitude: Number(l.latitude), longitude: Number(l.longitude) }));

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
