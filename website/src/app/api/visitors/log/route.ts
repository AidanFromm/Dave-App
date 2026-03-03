import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get IP from Vercel/proxy headers
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Vercel provides geolocation headers for FREE on all plans
    const rawCity = request.headers.get("x-vercel-ip-city");
    const city = rawCity ? decodeURIComponent(rawCity) : null;
    const country = request.headers.get("x-vercel-ip-country") || null;
    const region = request.headers.get("x-vercel-ip-country-region") || null;
    const lat = parseFloat(request.headers.get("x-vercel-ip-latitude") || "") || null;
    const lng = parseFloat(request.headers.get("x-vercel-ip-longitude") || "") || null;

    // Determine device type
    let deviceType = body.device_type || "desktop";
    if (body.screen_width) {
      if (body.screen_width <= 480) deviceType = "mobile";
      else if (body.screen_width <= 1024) deviceType = "tablet";
      else deviceType = "desktop";
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("visitors").insert({
      ip,
      city,
      country,
      region,
      latitude: lat,
      longitude: lng,
      page_path: body.page_path || "/",
      user_agent: request.headers.get("user-agent") || null,
      device_type: deviceType,
      referrer: body.referrer || request.headers.get("referer") || null,
    });

    if (error) {
      console.error("Visitor insert error:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Visitor tracking error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
