import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("drop_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch subscribers:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscribers: data ?? [] });
  } catch (error) {
    console.error("Subscribers fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
