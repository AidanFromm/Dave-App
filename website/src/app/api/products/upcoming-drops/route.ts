import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_drop", true)
      .gt("drop_starts_at", now)
      .order("drop_starts_at", { ascending: true })
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ products: data ?? [] });
  } catch (error) {
    console.error("Upcoming drops fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
