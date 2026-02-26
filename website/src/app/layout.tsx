import type { Metadata } from "next";
import { Inter, Oswald, JetBrains_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Header } from "@/components/layout/header";
import { FooterWrapper } from "@/components/layout/footer-wrapper";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ErrorBoundary } from "@/components/error-boundary";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import { CookieConsent } from "@/components/analytics/CookieConsent";
import { CartSyncProvider } from "@/components/providers/cart-sync-provider";
import { HelpButton } from "@/components/shop/help-button";
import VersionCheck from "@/components/VersionCheck";
import { PasswordGate } from "@/components/PasswordGate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const pacifico = Pacifico({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Secured Tampa — Premium Sneakers & Collectibles",
    template: "%s | Secured Tampa",
  },
  description:
    "Shop premium sneakers, streetwear, and Pokemon cards at Secured Tampa. New drops, used gems, and rare collectibles.",
  metadataBase: new URL("https://securedtampa.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Secured Tampa",
    title: "Secured Tampa — Premium Sneakers & Collectibles",
    description:
      "Shop premium sneakers, streetwear, and Pokemon cards at Secured Tampa. New drops, used gems, and rare collectibles.",
    url: "https://securedtampa.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Secured Tampa — Premium Sneakers & Collectibles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Secured Tampa — Premium Sneakers & Collectibles",
    description:
      "Shop premium sneakers, streetwear, and Pokemon cards at Secured Tampa.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable} ${pacifico.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          {/* PASSWORD GATE — Remove PasswordGate wrapper + import when ready to go live */}
          <PasswordGate>
            <ErrorBoundary>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <FooterWrapper />
              </div>
              <CartDrawer />
              <HelpButton />
              <CartSyncProvider />
            </ErrorBoundary>
            <ToastProvider />
            <GoogleAnalytics />
            <MetaPixel />
            <CookieConsent />
            <VersionCheck />
          </PasswordGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
