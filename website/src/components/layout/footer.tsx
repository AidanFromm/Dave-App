import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl font-black tracking-tight">
                <span className="text-primary">S</span>
                <span className="text-foreground">ECURED</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Tampa's trusted source for authentic sneakers and Pokémon cards.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>securedtampa.llc@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Tampa, FL</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold">Shop</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/drops" className="text-muted-foreground hover:text-foreground transition-colors">
                  New Drops
                </Link>
              </li>
              <li>
                <Link href="/orders/lookup" className="text-muted-foreground hover:text-foreground transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold">Help</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-foreground transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Secured Tampa LLC. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
