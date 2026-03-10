import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Links",
  description:
    "All Secured Tampa links in one place. Shop, social media, contact, and more.",
  openGraph: {
    title: "Links | Secured Tampa",
    description:
      "All Secured Tampa links — shop, socials, and contact info.",
  },
};

export default function LinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
