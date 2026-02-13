import type { Metadata } from "next";
import { Inter, Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Header } from "@/components/layout/header";
import { FooterWrapper } from "@/components/layout/footer-wrapper";
import { CartDrawer } from "@/components/cart/cart-drawer";

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

export const metadata: Metadata = {
  title: {
    default: "Secured Tampa — Premium Sneakers & Collectibles",
    template: "%s | Secured Tampa",
  },
  description:
    "Shop premium sneakers, streetwear, and Pokemon cards at Secured Tampa. New drops, used gems, and rare collectibles.",
  metadataBase: new URL("https://securedtampa.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Secured Tampa",
    title: "Secured Tampa — Premium Sneakers & Collectibles",
    description:
      "Shop premium sneakers, streetwear, and Pokemon cards at Secured Tampa. New drops, used gems, and rare collectibles.",
    url: "https://securedtampa.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Secured Tampa — Premium Sneakers & Collectibles",
    description:
      "Shop premium sneakers, streetwear, and Pokemon cards at Secured Tampa.",
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
        className={`${inter.variable} ${oswald.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <FooterWrapper />
          </div>
          <CartDrawer />
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
