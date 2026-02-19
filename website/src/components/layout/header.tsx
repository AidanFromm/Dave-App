"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  LogOut,
  Shield,
  Search,
  X,
  Instagram,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/stores/cart-store";
import { useCartDrawerStore } from "@/stores/cart-drawer-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Shop" },
  { href: "/drops", label: "Drops" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const itemCount = useCartStore((s) => s.getItemCount());
  const openCartDrawer = useCartDrawerStore((s) => s.open);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isAdminRoute) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-gray-200"
          : "bg-white border-b border-gray-100"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/secured-text.png"
            alt="Secured"
            width={150}
            height={55}
            className="h-10 sm:h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Center navigation — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors rounded-lg",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-800/50"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Instagram */}
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-9 w-9 text-muted-foreground hover:text-foreground">
            <a href="https://instagram.com/securedtampa" target="_blank" rel="noopener noreferrer">
              <Instagram className="h-4 w-4" />
              <span className="sr-only">Instagram</span>
            </a>
          </Button>

          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-9 w-9 text-muted-foreground hover:text-foreground">
            <Link href="/wishlist">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>

          {/* Admin button */}
          {user && isAdmin && (
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-1.5 h-9 px-3 text-xs text-muted-foreground hover:text-primary">
              <Link href="/admin">
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            </Button>
          )}

          {/* Cart */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={openCartDrawer}
          >
            <ShoppingBag className="h-4 w-4" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
                  aria-live="polite"
                  aria-label={`${itemCount} items in cart`}
                >
                  {itemCount > 9 ? "9+" : itemCount}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="sr-only">Cart</span>
          </Button>

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-surface-900 border-surface-800">
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">Orders</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator className="bg-surface-800" />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="bg-surface-800" />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-muted-foreground hover:text-foreground">
              <Link href="/auth/sign-in">
                <User className="h-4 w-4" />
                <span className="sr-only">Sign In</span>
              </Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-surface-950 border-surface-800 p-0">
              <div className="flex items-center justify-between px-6 py-5 border-b border-surface-800">
                <SheetTitle className="font-display text-xl font-bold uppercase tracking-tight">
                  <span className="text-foreground">SECURED</span>
                  <span className="text-primary">TAMPA</span>
                </SheetTitle>
              </div>
              <nav className="flex flex-col px-4 py-4">
                {NAV_LINKS.map((link) => {
                  const isActive = link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-surface-800 hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}

                <div className="h-px bg-surface-800 my-3" />

                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface-800 hover:text-foreground transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openCartDrawer();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface-800 hover:text-foreground transition-colors text-left"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Cart {itemCount > 0 && (
                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </button>
                
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-surface-800 hover:text-foreground transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Account
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}

                    <div className="h-px bg-surface-800 my-3" />

                    <button
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 mx-4 mt-4 px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-white justify-center uppercase tracking-wider hover:bg-primary/90 transition-colors"
                  >
                    Sign In
                  </Link>
                )}

              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
