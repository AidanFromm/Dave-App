import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Package,
  Settings,
  ChevronRight,
} from "lucide-react";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const firstName = user.user_metadata?.first_name ?? "";
  const lastName = user.user_metadata?.last_name ?? "";
  const email = user.email ?? "";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">My Account</h1>

      {/* Profile Card */}
      <div className="mt-6 rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {firstName?.[0]?.toUpperCase() ?? email[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 space-y-2">
        <Link
          href="/account/orders"
          className="flex items-center justify-between rounded-xl shadow-card bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Order History</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/account/settings"
          className="flex items-center justify-between rounded-xl shadow-card bg-card p-4 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Settings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
