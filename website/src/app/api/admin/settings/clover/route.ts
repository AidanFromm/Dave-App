import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
