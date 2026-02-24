import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-surface-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-transparent.png"
                alt="Secured Tampa"
                width={280}
                height={105}
                className="h-24 sm:h-32 w-auto object-contain"
              />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Tampa&apos;s trusted source for authentic sneakers and Pokémon cards.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary/60" />
                <span>securedtampa.llc@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary/60" />
                <span>Tampa, FL</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Shop</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/drops" className="text-muted-foreground hover:text-primary transition-colors">
                  Daily Deals
                </Link>
              </li>
              <li>
                <Link href="/orders/lookup" className="text-muted-foreground hover:text-primary transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Help</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-primary transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">Company</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-border/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Secured Tampa LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a
              href="https://instagram.com/securedtampa"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
