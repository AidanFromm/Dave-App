"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  Package,
  ScanBarcode,
  Flame,
  Tag,
  Menu,
  X,
  ExternalLink,
  Truck,
  HelpCircle,
  Store,
  MessageSquare,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/products", label: "Inventory", icon: Package },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "Store",
    items: [
      { href: "/admin/scan", label: "Scan In", icon: ScanBarcode },
      { href: "/admin/pos", label: "Point of Sale", icon: Store },
      { href: "/admin/drops", label: "Daily Deals", icon: Flame },
      { href: "/admin/discounts", label: "Discount Codes", icon: Tag },
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/tickets", label: "Tickets", icon: MessageSquare },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/visitors", label: "Visitors", icon: Globe },
    ],
  },
  {
    label: "Integrations",
    items: [
      { href: "/admin/clover", label: "Clover POS", icon: Store },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Store Settings", icon: Settings },
      { href: "/admin/staff", label: "Staff", icon: Users },
      { href: "/admin/help", label: "Help & Guides", icon: HelpCircle },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-surface-800 px-5">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold uppercase tracking-tight text-foreground">SECURED</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
            Admin
          </span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-surface-800/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-800 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-800/50 hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          View Store
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-surface-800 bg-surface-900 md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger — absolutely positioned so it doesn't take flex space */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center border-b border-surface-800 bg-surface-900 p-3 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-800/50 transition-colors"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
          <span className="font-display text-lg font-bold uppercase tracking-tight text-foreground">SECURED</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
            Admin
          </span>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-900 shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="absolute right-3 top-4">
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-800/50 transition-colors"
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
