"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !["owner", "manager", "staff"].includes(role || "")) {
      router.replace("/auth/sign-in");
    }
  }, [user, role, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      {children}
    </div>
  );
}
