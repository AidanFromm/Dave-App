import { KioskClient } from "./kiosk-client";
import { getProducts, getCategories } from "@/actions/products";

export default async function KioskPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return <KioskClient initialProducts={products} initialCategories={categories} />;
}
