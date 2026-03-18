import { NextRequest, NextResponse } from "next/server";
import {
  syncFromClover,
  syncToClover,
  fullSync,
  getSyncStatus,
} from "@/lib/clover-sync";
import { getCloverClient } from "@/lib/clover";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  // Require admin for sync operations
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

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

  if (action === "initial-push-all") {
    try {
      const supabase = createAdminClient();
      const client = await getCloverClient();
      if (!client) {
        return NextResponse.json({
          success: false,
          error: "Clover not configured. Add API keys or connect via OAuth.",
        }, { status: 500 });
      }

      // Fetch all active products with quantity > 0 from Supabase
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, is_active, quantity")
        .eq("is_active", true)
        .gt("quantity", 0);

      if (error) {
        throw new Error(`Failed to fetch products from Supabase: ${error.message}`);
      }
      if (!products || products.length === 0) {
        return NextResponse.json({ success: true, message: "No active products with quantity > 0 to push." });
      }

      console.log(`Starting initial push of ${products.length} products to Clover...`);
      const pushResults = { total: products.length, success: 0, skipped: 0, errors: [] as string[] };

      for (let i = 0; i < products.length; i++) {
        const p = products[i];
        try {
          // Implement rate limiting: 16 requests/sec. Delay for ~60ms between requests.
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 60)); // ~16.6 requests per second
          }

          const syncResult = await syncToClover(p.id);
          if (syncResult.success) {
            pushResults.success++;
            console.log(`Pushed product ${p.name} (${p.id}) to Clover.`);
          } else {
            pushResults.errors.push(`Failed to push ${p.name} (${p.id}): ${syncResult.error}`);
            console.error(`Failed to push product ${p.name} (${p.id}): ${syncResult.error}`);
          }
        } catch (innerError) {
          pushResults.errors.push(`Error processing ${p.name} (${p.id}): ${innerError instanceof Error ? innerError.message : "Unknown error"}`);
          console.error(`Error processing product ${p.name} (${p.id}):`, innerError);
        }
      }

      console.log("Initial Clover product push complete.", pushResults);
      return NextResponse.json({
        success: pushResults.errors.length === 0,
        message: "Initial product push to Clover completed.",
        details: pushResults,
      });

    } catch (err) {
      console.error("Initial Clover product push failed:", err);
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error during initial push",
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  // Require admin for sync operations
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

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
