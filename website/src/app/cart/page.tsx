import { Metadata } from "next";
import CartPage from "./cart-client";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your shopping cart at Secured Tampa. Premium sneakers, streetwear, and collectibles.",
  openGraph: {
    title: "Cart | Secured Tampa",
    description: "Review your shopping cart at Secured Tampa.",
  },
};

export default function Page() {
  return <CartPage />;
}
