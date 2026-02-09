"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Twitter, 
  Facebook, 
  Mail, 
  MapPin, 
  CreditCard,
  Shield,
  Truck,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const socialLinks = [
  { icon: <Instagram className="h-5 w-5" />, href: "https://instagram.com/securedtampa", label: "Instagram" },
  { icon: <Twitter className="h-5 w-5" />, href: "https://twitter.com/securedtampa", label: "Twitter" },
  { icon: <Facebook className="h-5 w-5" />, href: "https://facebook.com/securedtampa", label: "Facebook" },
];

const trustBadges = [
  { icon: <Shield className="h-5 w-5" />, text: "100% Authentic" },
  { icon: <Truck className="h-5 w-5" />, text: "Fast Shipping" },
  { icon: <CreditCard className="h-5 w-5" />, text: "Secure Payment" },
];

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      {/* Trust Badges Bar */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <div className="text-primary">{badge.icon}</div>
                <span className="text-sm font-medium">{badge.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-primary">S</span>
                <span className="text-foreground">ECURED</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Tampa's premier destination for authentic sneakers and rare Pokémon cards. 
              Every item verified, every purchase protected.
            </p>
            
            {/* Social Links */}
            <div className="mt-5 flex gap-3">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Shop */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider">Shop</h3>
            <ul className="mt-4 space-y-3">
              {[
                { label: "All Products", href: "/?filter=all" },
                { label: "Sneakers", href: "/?filter=sneakers" },
                { label: "Pokémon Cards", href: "/?filter=pokemon" },
                { label: "New Drops", href: "/drops" },
                { label: "Sale", href: "/?filter=sale" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Help */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider">Help</h3>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Track Order", href: "/orders/lookup" },
                { label: "Order History", href: "/account/orders" },
                { label: "Shipping Info", href: "#shipping" },
                { label: "Returns", href: "#returns" },
                { label: "Contact Us", href: "#contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact & Newsletter */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider">Stay Connected</h3>
            <p className="mt-4 text-sm text-muted-foreground">
              Get drop alerts and exclusive offers.
            </p>
            <form className="mt-3 flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                className="h-10 text-sm"
              />
              <Button size="sm" className="h-10 px-4">
                <Mail className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>securedtampa.llc@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Tampa, FL</span>
              </div>
            </div>
          </motion.div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Secured Tampa LLC. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="#privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="#terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in Tampa
          </p>
        </div>
      </div>
    </footer>
  );
}
