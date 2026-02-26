"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Store, Sun, Moon, Monitor, Bell, MessageSquare } from "lucide-react";
import { useTheme } from "next-themes";

export function AdminHeader() {
  const { user, signOut } = useAuth();
  const { setTheme } = useTheme();
  const [notifCount, setNotifCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  const fetchNotifCount = useCallback(async () => {
    try {
      const supabase = createClient();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [ordersRes, stockRes, ticketsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending", "paid"])
          .gte("created_at", weekAgo.toISOString()),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .lte("quantity", 5),
        supabase
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .in("status", ["open", "in_progress"]),
      ]);

      setTicketCount(ticketsRes.count ?? 0);
      setNotifCount((ordersRes.count ?? 0) + (stockRes.count ?? 0));
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    fetchNotifCount();

    const supabase = createClient();
    const channel = supabase
      .channel("header-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchNotifCount)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products" }, fetchNotifCount)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifCount]);

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-800 bg-surface-900 px-4 lg:px-6">
      {/* Mobile/iPad logo — hidden on desktop (sidebar has it) */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground gap-1.5">
          <Link href="/">
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">View Store</span>
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Link href="/admin/tickets">
            <MessageSquare className="h-4 w-4" />
            {ticketCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {ticketCount > 99 ? "99+" : ticketCount}
              </span>
            )}
          </Link>
        </Button>

        <Button variant="ghost" size="icon" asChild className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Link href="/admin/notifications">
            <Bell className="h-4 w-4" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-900 border-surface-800">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-3.5 w-3.5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-surface-900 border-surface-800">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Administrator</p>
            </div>
            <DropdownMenuSeparator className="bg-surface-800" />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
