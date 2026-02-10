import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        className={`${inter.variable} font-sans antialiased`}
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
