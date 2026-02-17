import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { syncFromClover, syncToClover, fullSync } from "@/lib/clover-sync";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Pull Clover inventory into website (import from Clover)
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const result = await syncFromClover();
    return NextResponse.json({
      success: result.success,
      direction: "pull",
      report: {
        total: result.total,
        matched: result.matched,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Clover pull sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}

/**
 * POST: Push website inventory to Clover or run full sync
 * Body: { direction: "push" | "pull" | "full" }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const direction = (body.direction as string) ?? "push";

    if (direction === "pull" || direction === "from") {
      const result = await syncFromClover();
      return NextResponse.json({
        success: result.success,
        direction: "pull",
        report: {
          total: result.total,
          matched: result.matched,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (direction === "full") {
      const result = await fullSync();
      return NextResponse.json({
        success: result.success,
        direction: "full",
        report: {
          total: result.total,
          matched: result.matched,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Default: push to Clover
    const supabase = createAdminClient();
    const { data: products } = await supabase
      .from("products")
      .select("id, name")
      .eq("is_active", true);

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        direction: "push",
        report: { total: 0, matched: 0, created: 0, updated: 0, skipped: 0, errors: [] },
        timestamp: new Date().toISOString(),
      });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const p of products) {
      const r = await syncToClover(p.id);
      if (r.success) {
        updated += 1;
      } else {
        errors.push(`${p.name}: ${r.error ?? "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      direction: "push",
      report: {
        total: products.length,
        matched: updated,
        created,
        updated,
        skipped: 0,
        errors,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Clover sync error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
