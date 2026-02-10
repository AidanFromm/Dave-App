import { Metadata } from "next";
import WishlistPage from "./wishlist-client";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved items at Secured Tampa. Keep track of sneakers and collectibles you love.",
  openGraph: {
    title: "Wishlist | Secured Tampa",
    description: "Your saved items at Secured Tampa.",
  },
};

export default function Page() {
  return <WishlistPage />;
}
