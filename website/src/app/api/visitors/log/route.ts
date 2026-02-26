import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = createAdminClient();

    await supabase.from("visitors").insert({
      ip: data.ip,
      city: data.city,
      country: data.country,
      region: data.region,
      latitude: data.latitude,
      longitude: data.longitude,
      page_path: data.page_path,
      user_agent: data.user_agent,
      device_type: data.device_type,
      referrer: data.referrer,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
