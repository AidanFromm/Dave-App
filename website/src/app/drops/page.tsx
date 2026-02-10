import { Metadata } from "next";
import DropsPage from "./drops-client";

export const metadata: Metadata = {
  title: "Drops",
  description: "Exclusive sneaker and Pokémon card drops at Secured Tampa. Limited releases every week.",
  openGraph: {
    title: "Drops & Releases | Secured Tampa",
    description: "Exclusive sneaker and Pokémon card drops. Limited releases every week.",
  },
};

export default function Page() {
  return <DropsPage />;
}
