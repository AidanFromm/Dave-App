import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Package,
  Settings,
  ChevronRight,
  ShieldCheck,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  User,
  LogOut,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your Secured Tampa account, view orders, and update settings.",
  openGraph: {
    title: "My Account | Secured Tampa",
    description: "Manage your Secured Tampa account.",
  },
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // Fetch user role from profiles (use admin client to bypass RLS)
  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  const role = profile?.role as string | null;
  const isAdmin = role === "owner" || role === "manager" || role === "staff";

  const firstName = user.user_metadata?.first_name ?? "";
  const lastName = user.user_metadata?.last_name ?? "";
  const email = user.email ?? "";

  const quickLinks = [
    {
      href: "/account/orders",
      icon: <Package className="h-5 w-5" />,
      title: "Order History",
      description: "View and track your orders",
    },
    {
      href: "/wishlist",
      icon: <Heart className="h-5 w-5" />,
      title: "Wishlist",
      description: "Items you've saved for later",
    },
    {
      href: "/account/settings",
      icon: <Settings className="h-5 w-5" />,
      title: "Account Settings",
      description: "Update your profile and preferences",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Account</h1>
      </div>

      {/* Profile Card */}
      <div className="mt-8 rounded-2xl border bg-gradient-to-br from-primary/5 to-orange-500/5 p-6 sm:p-8">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-500 text-3xl font-bold text-white shadow-lg">
            {firstName?.[0]?.toUpperCase() ?? email[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : "Welcome!"}
            </h2>
            <p className="text-muted-foreground">{email}</p>
            {isAdmin && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                {role === "owner" ? "Owner" : role === "manager" ? "Manager" : "Staff"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel Link */}
      {isAdmin && (
        <Link
          href="/admin"
          className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-orange-500 p-5 text-white shadow-lg transition-transform hover:scale-[1.01]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-lg">Admin Panel</p>
              <p className="text-sm text-white/80">Manage products, orders & customers</p>
            </div>
          </div>
          <ChevronRight className="h-6 w-6" />
        </Link>
      )}

      {/* Quick Links Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col rounded-2xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              {link.icon}
            </div>
            <h3 className="mt-4 font-semibold group-hover:text-primary transition-colors">
              {link.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {link.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent Activity or Stats could go here */}
      <div className="mt-8 rounded-2xl border bg-card p-6">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          Stay Updated
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get notified about exclusive drops, sales, and new arrivals.
        </p>
        <Link
          href="/drops"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          View upcoming drops
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Sign Out */}
      <div className="mt-8 text-center">
        <form action="/auth/callback?next=/" method="POST">
          <button
            type="submit"
            formAction="/api/auth/signout"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
