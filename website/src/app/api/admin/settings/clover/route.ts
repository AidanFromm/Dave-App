import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();

    const { data: settings } = await supabase
      .from("clover_settings")
      .select("merchant_id, last_sync_at, is_active")
      .eq("is_active", true)
      .single();

    if (!settings) {
      return NextResponse.json({
        isConnected: false,
        merchantId: null,
        lastSyncAt: null,
      });
    }

    return NextResponse.json({
      isConnected: true,
      merchantId: settings.merchant_id,
      lastSyncAt: settings.last_sync_at,
    });
  } catch {
    return NextResponse.json({
      isConnected: false,
      merchantId: null,
      lastSyncAt: null,
    });
  }
}
