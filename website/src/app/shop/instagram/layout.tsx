import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instagram",
  description:
    "Follow Secured Tampa on Instagram for the latest sneaker drops, Pokémon pulls, and store updates.",
  openGraph: {
    title: "Instagram | Secured Tampa",
    description:
      "Follow Secured Tampa on Instagram for sneaker drops and collectibles.",
  },
};

export default function InstagramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
