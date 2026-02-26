import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "1", 10);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = 50;

  const supabase = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const country = searchParams.get("country") || "";

  let query = supabase
    .from("visitors")
    .select("*", { count: "exact" })
    .gte("created_at", since);

  if (country) {
    query = query.ilike("country", `%${country}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visitors: data, total: count });
}
