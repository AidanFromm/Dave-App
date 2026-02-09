"use client";

import { useMemo, useState } from "react";
import type { Product, Category } from "@/types/product";
import { isNewDrop } from "@/types/product";
import { ProductGrid } from "@/components/product/product-grid";
import { FilterTabs, type ShopFilter } from "./filter-tabs";
import { SortSelect, type SortOption } from "./sort-select";
import { SearchBar } from "./search-bar";
import { useDebounce } from "@/hooks/use-debounce";

interface ShopPageProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ShopPage({ initialProducts, categories }: ShopPageProps) {
  const [filter, setFilter] = useState<ShopFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const pokemonCategoryId = useMemo(() => {
    const cat = categories.find(
      (c) =>
        c.slug === "pokemon" || c.name.toLowerCase() === "pokemon"
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

    // Category filter — same logic as iOS ShopView
    switch (filter) {
      case "drops":
        products = products.filter((p) => isNewDrop(p));
        break;
      case "new": {
        // Show all items with condition="new" (includes drops)
        products = products.filter((p) => p.condition === "new");
        break;
      }
      case "used":
        products = products.filter((p) => p.condition === "used");
        break;
      case "pokemon":
        if (pokemonCategoryId) {
          products = products.filter(
            (p) => p.category_id === pokemonCategoryId
          );
        } else {
          products = products.filter(
            (p) =>
              p.name.toLowerCase().includes("pokemon") ||
              p.tags?.some((t) => t.toLowerCase().includes("pokemon"))
          );
        }
        break;
    }

    // Sort
    switch (sort) {
      case "newest":
        products.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Filter tabs */}
        <FilterTabs selected={filter} onChange={setFilter} />

        {/* Right: Search + Sort */}
        <div className="flex items-center gap-3">
          <div className="w-48 sm:w-56">
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Results count */}
      {debouncedSearch && (
        <p className="mt-4 text-sm text-muted-foreground">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for "{debouncedSearch}"
        </p>
      )}

      {/* Grid */}
      <div className="mt-6">
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}
