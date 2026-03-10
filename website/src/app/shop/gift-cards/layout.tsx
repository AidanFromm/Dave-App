import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Cards",
  description:
    "Buy Secured Tampa gift cards. The perfect gift for sneakerheads and Pokémon collectors.",
  openGraph: {
    title: "Gift Cards | Secured Tampa",
    description:
      "Buy Secured Tampa gift cards for sneakers, streetwear, and collectibles.",
  },
};

export default function GiftCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
