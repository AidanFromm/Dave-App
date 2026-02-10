"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Box,
  ScanBarcode,
  Package,
  Flame,
  Sparkles,
  Store,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Box },
  { href: "/admin/scan", label: "Scan In", icon: ScanBarcode },
  { href: "/admin/pokemon", label: "Pokemon", icon: Sparkles },
  { href: "/admin/drops", label: "Drops", icon: Flame },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/clover", label: "Clover POS", icon: Store },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-border bg-card md:block">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">SECURED</span>
            <span className="text-xs font-medium text-muted-foreground">Admin</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile hamburger + slide-out drawer */}
      <div className="flex items-center border-b border-border bg-card p-2 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-lg font-bold text-primary">SECURED</span>
          <span className="text-xs font-medium text-muted-foreground">Admin</span>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 bg-card shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Link href="/admin" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <span className="text-lg font-bold text-primary">SECURED</span>
                <span className="text-xs font-medium text-muted-foreground">Admin</span>
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent"
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
