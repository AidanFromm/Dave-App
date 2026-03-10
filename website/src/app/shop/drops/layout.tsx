import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Drops",
  description:
    "Exclusive sneaker and collectible drops at Secured Tampa. Don't miss limited releases.",
  openGraph: {
    title: "Drops | Secured Tampa",
    description:
      "Exclusive sneaker and collectible drops at Secured Tampa.",
  },
};

export default function DropsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
