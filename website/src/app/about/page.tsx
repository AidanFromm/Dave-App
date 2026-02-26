import { Metadata } from "next";
import { Shield, Package, Truck, MapPin, Instagram, Mail, Phone } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Secured Tampa",
  description: "Tampa's premier destination for authentic sneakers and Pokémon cards. Visit our store at Tampa Premium Outlets.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Secured Tampa
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Authentic sneakers and collectible Pokémon cards — verified, 
          trusted, and ready to ship from Tampa, Florida.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="mt-16 rounded-2xl border bg-card p-8 sm:p-10">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Secured Tampa was built to solve one problem: trust. Buying sneakers and 
          collectibles online shouldn&apos;t feel like a gamble. Every item we sell is 
          personally inspected and verified for authenticity before it ever reaches 
          a customer. No exceptions.
        </p>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Whether you&apos;re looking for the latest Jordan release, a pair of hard-to-find 
          Yeezys, or graded Pokémon cards for your collection — we make sure you get 
          exactly what you paid for.
        </p>
      </div>

      {/* Values Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">100% Authenticity Guarantee</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Every item is verified before listing. If there's ever a concern about 
            authenticity, we&apos;ll make it right — full refund, no questions asked.
          </p>
        </div>

        <div className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Secure Packaging</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Sneakers are double-boxed for maximum protection. Cards ship in 
            protective sleeves with rigid backing. Everything arrives in perfect condition.
          </p>
        </div>

        <div className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Fast Shipping</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Orders processed within 1–2 business days. Free shipping on orders 
            over $200. Standard delivery in 3–5 business days nationwide.
          </p>
        </div>

        <div className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Tampa Storefront</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Visit us at Tampa Premium Outlets. Browse inventory in person, 
            pick up online orders, or sell your sneakers and cards directly.
          </p>
        </div>
      </div>

      {/* What We Sell */}
      <div className="mt-16">
        <h2 className="text-2xl font-semibold">What We Carry</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Sneakers</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Jordan, Nike, Yeezy, New Balance, and more — new and gently used. 
              Every pair inspected and authenticated.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Pokémon Cards</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Raw singles, PSA/BGS/CGC graded cards, and sealed product. 
              From modern sets to vintage collectibles.
            </p>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="mt-16 rounded-2xl border bg-card p-8 sm:p-10">
        <h2 className="text-2xl font-semibold">Visit Us</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Location</h3>
            <p className="mt-2 font-medium">2398 Grand Cypress Dr, STE 420</p>
            <p className="text-muted-foreground">Lutz, FL 33559</p>
            <p className="mt-1 text-sm text-muted-foreground">Tampa Premium Outlets</p>
          </div>
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Hours</h3>
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mon – Thu</span>
                <span className="font-medium">10:00 AM – 8:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fri – Sat</span>
                <span className="font-medium">10:00 AM – 9:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sunday</span>
                <span className="font-medium">11:00 AM – 6:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="https://instagram.com/securedtampa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Instagram className="h-4 w-4" />
            @securedtampa
          </a>
          <a
            href="mailto:securedtampa.llc@gmail.com"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Mail className="h-4 w-4" />
            securedtampa.llc@gmail.com
          </a>
          <a
            href="tel:8139432777"
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Phone className="h-4 w-4" />
            (813) 943-2777
          </a>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}
