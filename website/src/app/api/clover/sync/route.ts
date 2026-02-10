import { NextRequest, NextResponse } from "next/server";
import {
  syncFromClover,
  syncToClover,
  fullSync,
  getSyncStatus,
} from "@/lib/clover-sync";
import { getCloverClient } from "@/lib/clover";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  if (action === "test") {
    try {
      const client = await getCloverClient();
      if (!client) {
        return NextResponse.json({
          ok: false,
          error: "Clover not configured. Add API keys or connect via OAuth.",
        });
      }
      const result = await client.testConnection();
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  if (action === "status") {
    try {
      const status = await getSyncStatus();
      return NextResponse.json(status);
    } catch (err) {
      return NextResponse.json({
        isConnected: false,
        lastSyncAt: null,
        mismatches: [],
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const direction = body.direction as string;
    const productId = body.productId as string | undefined;

    if (direction === "from") {
      const result = await syncFromClover();
      return NextResponse.json({
        success: result.success,
        summary: result,
      });
    }

    if (direction === "to") {
      if (productId) {
        const result = await syncToClover(productId);
        return NextResponse.json(result);
      }
      // Sync all products to Clover
      const supabase = createAdminClient();
      const { data: products } = await supabase
        .from("products")
        .select("id")
        .eq("is_active", true);

      if (!products || products.length === 0) {
        return NextResponse.json({
          success: true,
          summary: { total: 0, matched: 0, updated: 0, created: 0, skipped: 0, errors: [] },
        });
      }

      let updated = 0;
      let created = 0;
      const errors: string[] = [];

      for (const p of products) {
        const r = await syncToClover(p.id);
        if (r.success) {
          updated += 1;
        } else {
          errors.push(r.error ?? "Unknown");
        }
      }

      return NextResponse.json({
        success: errors.length === 0,
        summary: {
          total: products.length,
          matched: updated,
          updated,
          created,
          skipped: 0,
          errors,
        },
      });
    }

    if (direction === "full") {
      const result = await fullSync();
      return NextResponse.json({
        success: result.success,
        summary: result,
      });
    }

    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  } catch (error) {
    console.error("Clover sync error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync with Clover" },
      { status: 500 }
    );
  }
}
