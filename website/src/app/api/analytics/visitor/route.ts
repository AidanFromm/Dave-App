import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/rate-limit";

interface GeoData {
  country?: string;
  countryCode?: string;
  city?: string;
  regionName?: string;
  lat?: number;
  lon?: number;
}

function detectDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
  if (
    /mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|opera mobi/i.test(
      ua
    )
  )
    return "Mobile";
  return "Desktop";
}

async function getGeoData(ip: string): Promise<GeoData> {
  try {
    // Skip geo lookup for local/unknown IPs
    if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
      return {};
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,regionName,lat,lon`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { page_path, referrer } = body;

    if (!page_path) {
      return NextResponse.json(
        { error: "page_path is required" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = detectDeviceType(userAgent);

    // Get geolocation from IP
    const geo = await getGeoData(ip);

    const supabase = createAdminClient();

    const { error } = await supabase.from("visitor_logs").insert({
      ip_address: ip,
      country: geo.country || null,
      country_code: geo.countryCode || null,
      city: geo.city || null,
      region: geo.regionName || null,
      latitude: geo.lat || null,
      longitude: geo.lon || null,
      device_type: deviceType,
      user_agent: userAgent,
      page_path,
      referrer: referrer || null,
    });

    if (error) {
      console.error("Visitor log insert error:", error);
      return NextResponse.json({ error: "Failed to log visit" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Visitor tracking error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
