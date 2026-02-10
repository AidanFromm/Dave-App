import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ role: null, isAdmin: false });
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("auth_user_id", user.id)
      .single();

    const role = profile?.role ?? "customer";
    const isAdmin = role === "owner" || role === "manager" || role === "staff";

    return NextResponse.json({ role, isAdmin });
  } catch {
    return NextResponse.json({ role: null, isAdmin: false });
  }
}
