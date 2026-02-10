"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Product, Category } from "@/types/product";
import { isNewDrop } from "@/types/product";
import { ProductGrid } from "@/components/product/product-grid";
import { SortSelect, type SortOption } from "./sort-select";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type ShopFilter = "all" | "drops" | "new" | "used" | "pokemon";

const FILTERS: { key: ShopFilter; label: string }[] = [
  { key: "drops", label: "Drops" },
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "used", label: "Used" },
  { key: "pokemon", label: "Pokémon" },
];

interface ShopPageProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ShopPage({ initialProducts, categories }: ShopPageProps) {
  const [filter, setFilter] = useState<ShopFilter>("drops");
  const [sort, setSort] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const pokemonCategoryId = useMemo(() => {
    const cat = categories.find(
      (c) => c.slug === "pokemon" || c.name.toLowerCase() === "pokemon"
    );
    return cat?.id ?? null;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let products = [...initialProducts];

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category filter
    switch (filter) {
      case "drops":
        products = products.filter((p) => isNewDrop(p));
        break;
      case "new":
        products = products.filter((p) => p.condition === "new");
        break;
      case "used":
        products = products.filter((p) => p.condition === "used");
        break;
      case "pokemon":
        if (pokemonCategoryId) {
          products = products.filter((p) => p.category_id === pokemonCategoryId);
        } else {
          products = products.filter(
            (p) =>
              p.name.toLowerCase().includes("pokemon") ||
              p.tags?.some((t) => t.toLowerCase().includes("pokemon"))
          );
        }
        break;
    }

    // Group by product name — show one card per unique name (lowest price, summed quantity)
    const grouped = new Map<string, Product>();
    for (const p of products) {
      const key = p.name.toLowerCase().trim();
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { ...p, quantity: p.quantity });
      } else {
        // Keep the one with the lowest price as the display card, sum quantities
        if (p.price < existing.price) {
          grouped.set(key, { ...p, quantity: existing.quantity + p.quantity });
        } else {
          grouped.set(key, { ...existing, quantity: existing.quantity + p.quantity });
        }
      }
    }
    products = Array.from(grouped.values());

    // Sort
    switch (sort) {
      case "newest":
        products.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price_asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return products;
  }, [initialProducts, filter, sort, debouncedSearch, pokemonCategoryId]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {/* Clean filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
        <span>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          {debouncedSearch && ` for "${debouncedSearch}"`}
        </span>
      </div>

      {/* Products grid */}
      <ProductGrid products={filteredProducts} />
    </div>
  );
}
