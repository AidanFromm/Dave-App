"use client";

import { useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";
import type { Product } from "@/types/product";
import { formatCurrency } from "@/types/product";
import { ProductCard } from "@/components/product/product-card";
import { SortSelect, type SortOption } from "./sort-select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type PokemonFilter = "all" | "raw" | "graded" | "sealed";

const FILTERS: { key: PokemonFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "raw", label: "Singles (Raw)" },
  { key: "graded", label: "Singles (Graded)" },
  { key: "sealed", label: "Sealed" },
];

interface PokemonHubProps {
  initialProducts: Product[];
}

// Extract grading info from product metadata/tags/name
function getGradeBadge(product: Product): string | null {
  // Check name for [PSA 10] style badges
  const nameMatch = product.name.match(/\[([A-Z]{2,3}\s+\d+(?:\.\d+)?(?:\s+.*?)?)\]/);
  if (nameMatch) return nameMatch[1];

  // Check tags
  if (product.tags?.includes("graded")) {
    const company = product.tags.find((t) =>
      ["psa", "bgs", "cgc", "sgc", "ace", "tag"].includes(t)
    );
    if (company) return company.toUpperCase();
  }

  return null;
}

function isSealed(product: Product): boolean {
  return (
    product.tags?.includes("sealed") === true ||
    product.name.toLowerCase().includes("[booster box]") ||
    product.name.toLowerCase().includes("[etb]") ||
    product.name.toLowerCase().includes("[tin]") ||
    product.name.toLowerCase().includes("[booster pack]") ||
    product.name.toLowerCase().includes("[collection box]")
  );
}

function isGraded(product: Product): boolean {
  return (
    product.tags?.includes("graded") === true ||
    /\[(PSA|BGS|CGC|SGC|ACE|TAG)\s/i.test(product.name)
  );
}

export function PokemonHub({ initialProducts }: PokemonHubProps) {
  const [filter, setFilter] = useState<PokemonFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    let products = [...initialProducts];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.colorway?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter
    switch (filter) {
      case "raw":
        products = products.filter((p) => !isSealed(p) && !isGraded(p));
        break;
      case "graded":
        products = products.filter((p) => isGraded(p));
        break;
      case "sealed":
        products = products.filter((p) => isSealed(p));
        break;
    }

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
  }, [initialProducts, filter, sort, debouncedSearch]);

  const counts = useMemo(() => ({
    all: initialProducts.length,
    raw: initialProducts.filter((p) => !isSealed(p) && !isGraded(p)).length,
    graded: initialProducts.filter((p) => isGraded(p)).length,
    sealed: initialProducts.filter((p) => isSealed(p)).length,
  }), [initialProducts]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Pokemon TCG</h1>
        <p className="text-muted-foreground">
          Graded singles, raw cards, and sealed products
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
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
              <span className="ml-1.5 text-xs opacity-70">({counts[f.key]})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cards..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
        <span>
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          {debouncedSearch && ` for "${debouncedSearch}"`}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Filter className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Products Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or check back soon
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {filtered.map((product) => {
            const gradeBadge = getGradeBadge(product);
            return (
              <div key={product.id} className="relative">
                {gradeBadge && (
                  <div className="absolute left-3 top-3 z-10">
                    <Badge className="bg-black/80 text-white text-[10px] font-bold shadow-md backdrop-blur-sm">
                      {gradeBadge}
                    </Badge>
                  </div>
                )}
                {isSealed(product) && (
                  <div className="absolute right-3 top-3 z-10">
                    <Badge className="bg-green-600 text-white text-[10px] font-bold shadow-md">
                      SEALED
                    </Badge>
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
