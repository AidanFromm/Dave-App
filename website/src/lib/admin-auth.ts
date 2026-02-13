import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verify the current request is from an authenticated admin user.
 * Returns the user if authorized, or a NextResponse error if not.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email?: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  const role = profile?.role ?? "customer";
  const isAdmin = role === "owner" || role === "manager" || role === "staff";

  if (!isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user: { id: user.id, email: user.email } };
}
