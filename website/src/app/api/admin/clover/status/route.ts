import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getCloverClientFromEnv, getCloverClient } from "@/lib/clover";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const client = await getCloverClient() ?? getCloverClientFromEnv();

    if (!client) {
      return NextResponse.json({
        connected: false,
        merchant: null,
        cloverItemCount: 0,
        websiteItemCount: 0,
        lastSyncAt: null,
        error: "Clover not configured. Add CLOVER_MERCHANT_ID and CLOVER_API_TOKEN.",
      });
    }

    // Test connection and get item count
    const testResult = await client.testConnection();
    if (!testResult.ok) {
      return NextResponse.json({
        connected: false,
        merchant: null,
        cloverItemCount: 0,
        websiteItemCount: 0,
        lastSyncAt: null,
        error: testResult.error,
      });
    }

    const items = await client.getInventory();
    const cloverItemCount = items.length;

    // Get website product count
    const supabase = createAdminClient();
    const { count: websiteItemCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    // Get last sync time from clover_settings if available
    let lastSyncAt: string | null = null;
    try {
      const { data: settings } = await supabase
        .from("clover_settings")
        .select("last_sync_at")
        .eq("is_active", true)
        .single();
      lastSyncAt = settings?.last_sync_at ?? null;
    } catch {
      // clover_settings table may not exist
    }

    return NextResponse.json({
      connected: true,
      merchant: {
        id: process.env.CLOVER_MERCHANT_ID,
        environment: process.env.CLOVER_ENVIRONMENT ?? "production",
      },
      cloverItemCount,
      websiteItemCount: websiteItemCount ?? 0,
      lastSyncAt,
    });
  } catch (error) {
    console.error("Clover status check error:", error);
    return NextResponse.json(
      {
        connected: false,
        merchant: null,
        cloverItemCount: 0,
        websiteItemCount: 0,
        lastSyncAt: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
