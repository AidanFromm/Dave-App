import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/products/new", label: "Add Product", icon: Plus },
    { href: "/admin/stockx", label: "StockX", icon: ShoppingBag },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="hidden w-56 border-r border-border bg-card md:block">
        <div className="p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Admin
          </h2>
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-foreground whitespace-nowrap hover:bg-accent"
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
