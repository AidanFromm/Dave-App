/**
 * Scheduled Clover ↔ Supabase sync — runs every 5 minutes via Vercel Cron.
 * Safety net: catches any drift from missed webhooks or failed auto-syncs.
 */

import { NextRequest, NextResponse } from "next/server";
import { syncFromClover } from "@/lib/clover-sync";

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncFromClover();
    console.log(`Cron clover-sync: ${JSON.stringify(result)}`);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("Cron clover-sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
