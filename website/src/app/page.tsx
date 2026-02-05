import { getProducts, getCategories } from "@/actions/products";
import { ShopPage } from "@/components/shop/shop-page";

export default async function Home() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <ShopPage initialProducts={products} categories={categories} />;
}
