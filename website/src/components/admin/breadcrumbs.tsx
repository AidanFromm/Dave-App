"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const LABEL_MAP: Record<string, string> = {
  admin: "Dashboard",
  orders: "Orders",
  products: "Products",
  customers: "Customers",
  inventory: "Stock Levels",
  settings: "Settings",
  analytics: "Analytics",
  reports: "Reports",
  shipping: "Shipping",
  discounts: "Discounts",
  drops: "New Drops",
  pokemon: "Pokémon Cards",
  "gift-cards": "Gift Cards",
  "payment-links": "Payment Links",
  staff: "Staff",
  notifications: "Notifications",
  scan: "Scan In",
  buy: "Buy from Customer",
  purchases: "Purchase History",
  reconciliation: "Reconciliation",
  clover: "Clover POS",
  monitoring: "System Health",
  "abandoned-carts": "Cart Recovery",
  reviews: "Reviews",
  new: "New",
  edit: "Edit",
  detail: "Details",
  "price-sync": "Price Sync",
  "pokemon-inventory": "Pokémon Inventory",
  stockx: "StockX",
  help: "Help",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on dashboard itself
  if (segments.length <= 1) return null;

  const crumbs: Array<{ label: string; href: string }> = [];

  segments.forEach((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    // Skip "admin" as first segment — we show it as Dashboard
    if (i === 0 && seg === "admin") {
      crumbs.push({ label: "Dashboard", href: "/admin" });
      return;
    }
    // Check if segment looks like a UUID or ID
    const isId = seg.length > 8 && /^[a-f0-9-]+$/i.test(seg);
    const label = isId ? `#${seg.slice(0, 8)}` : (LABEL_MAP[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "));
    crumbs.push({ label, href });
  });

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3 w-3 flex-shrink-0" />}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
