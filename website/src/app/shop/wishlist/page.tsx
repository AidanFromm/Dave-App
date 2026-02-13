import { Metadata } from "next";
import WishlistClient from "@/app/wishlist/wishlist-client";

export const metadata: Metadata = {
  title: "Wishlist | Secured Tampa",
  description: "Your saved items at Secured Tampa.",
};

export default function ShopWishlistPage() {
  return <WishlistClient />;
}
