import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse premium sneakers, streetwear, and Pokémon collectibles at Secured Tampa. New arrivals, gift cards, and exclusive drops.",
  openGraph: {
    title: "Shop | Secured Tampa",
    description:
      "Browse premium sneakers, streetwear, and Pokémon collectibles at Secured Tampa.",
  },
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
