"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  // Don't guard the login page itself
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (isLoginPage) return;
    if (!user || !isAdmin) {
      router.replace("/admin/login");
    }
  }, [user, isAdmin, loading, isLoginPage, router]);

  // Login page renders without chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated — show nothing while redirecting
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
