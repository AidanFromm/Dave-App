import { getPokemonProducts } from "@/actions/pokemon";
import { PokemonHub } from "@/components/shop/pokemon-hub";

export const metadata = {
  title: "Pokemon TCG | Secured Tampa",
  description: "Shop graded singles, raw cards, and sealed Pokemon TCG products at Secured Tampa.",
};

export default async function PokemonPage() {
  const products = await getPokemonProducts();
  return <PokemonHub initialProducts={products} />;
}
