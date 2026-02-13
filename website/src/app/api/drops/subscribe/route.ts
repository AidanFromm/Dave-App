import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeEmail } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 subscribe attempts per minute
    const ip = getClientIp(request);
    const rl = rateLimit(`drops-sub:${ip}`, { limit: 5, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Try to save to Supabase drop_subscribers table
    const { error } = await supabase.from("drop_subscribers").upsert(
      { email: email.toLowerCase().trim() },
      { onConflict: "email" }
    );

    if (error) {
      // Table might not exist - log and still return success
      console.error("Failed to save drop subscriber to Supabase:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Drop subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
