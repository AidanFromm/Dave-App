"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type UserRole = "customer" | "owner" | "manager" | "staff" | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Fetch role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", user.id)
          .single();
        setRole((profile?.role as UserRole) ?? "customer");
      } else {
        setRole(null);
      }

      setLoading(false);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", currentUser.id)
          .single();
        setRole((profile?.role as UserRole) ?? "customer");
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  // Admin = owner, manager, or staff
  const isAdmin = role === "owner" || role === "manager" || role === "staff";

  return { user, role, loading, signOut, isAdmin };
}
