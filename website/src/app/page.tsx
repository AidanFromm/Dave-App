import { Metadata } from "next";
import { getProducts, getCategories } from "@/actions/products";
import { ShopPage } from "@/components/shop/shop-page";
import { OrganizationJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse premium sneakers, streetwear, and Pokémon cards at Secured Tampa. Authenticated and hand-picked inventory.",
  openGraph: {
    title: "Shop | Secured Tampa",
    description: "Browse premium sneakers, streetwear, and Pokémon cards at Secured Tampa.",
  },
};

export default async function Home() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <>
      <OrganizationJsonLd />
      <ShopPage initialProducts={products} categories={categories} />
    </>
  );
}
