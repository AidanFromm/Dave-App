"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Heart,
  User,
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Shield,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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

export function Header() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
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
        "sticky top-0 z-50 w-full transition-all duration-200",
        scrolled 
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b" 
          : "bg-background border-b border-border/50"
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-black tracking-tight">
            <span className="text-primary">S</span>
            <span className="text-foreground">ECURED</span>
          </span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex h-9 w-9">
            <Link href="/wishlist">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Wishlist</span>
            </Link>
          </Button>

          {/* Admin button */}
          {user && isAdmin && (
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex gap-1.5 h-9 px-3 text-xs">
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
            className="relative h-9 w-9"
            onClick={openCartDrawer}
          >
            <ShoppingBag className="h-4 w-4" />
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
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
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders">Orders</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link href="/auth/sign-in">
                <User className="h-4 w-4" />
                <span className="sr-only">Sign In</span>
              </Link>
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="text-xl font-black">
                <span className="text-primary">S</span>
                <span className="text-foreground">ECURED</span>
              </SheetTitle>
              <nav className="mt-6 flex flex-col gap-2">
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted"
                >
                  <Heart className="h-5 w-5" />
                  Wishlist
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openCartDrawer();
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-left"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Cart {itemCount > 0 && `(${itemCount})`}
                </button>
                
                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted"
                    >
                      <User className="h-5 w-5" />
                      Account
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-primary"
                      >
                        <Shield className="h-5 w-5" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-destructive text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
                  >
                    <User className="h-5 w-5" />
                    Sign In
                  </Link>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 px-3">Theme</p>
                  <div className="flex gap-2 px-3">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="flex-1 h-8 text-xs"
                    >
                      Light
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="flex-1 h-8 text-xs"
                    >
                      Dark
                    </Button>
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
