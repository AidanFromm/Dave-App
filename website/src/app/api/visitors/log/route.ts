import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const h = await headers();

    // Get IP from Vercel/proxy headers
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "unknown";

    // Vercel provides geolocation headers for FREE on all plans
    const city = h.get("x-vercel-ip-city") || null;
    const country = h.get("x-vercel-ip-country") || null;
    const region = h.get("x-vercel-ip-country-region") || null;
    const lat = parseFloat(h.get("x-vercel-ip-latitude") || "") || null;
    const lng = parseFloat(h.get("x-vercel-ip-longitude") || "") || null;

    // Determine device type from screen width if provided, fallback to user-agent
    let deviceType = body.device_type || "desktop";
    if (body.screen_width) {
      if (body.screen_width <= 480) deviceType = "mobile";
      else if (body.screen_width <= 1024) deviceType = "tablet";
      else deviceType = "desktop";
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("visitors").insert({
      ip,
      city: city ? decodeURIComponent(city) : null,
      country,
      region,
      latitude: lat,
      longitude: lng,
      page_path: body.page_path || "/",
      user_agent: h.get("user-agent") || null,
      device_type: deviceType,
      referrer: body.referrer || h.get("referer") || null,
    });

    if (error) {
      console.error("Visitor insert error:", error.message);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Visitor tracking error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
