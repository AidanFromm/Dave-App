"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Product, Category } from "@/types/product";
import { isNewDrop, isActiveDrop } from "@/types/product";
import { ProductGrid } from "@/components/product/product-grid";
import { SortSelect, type SortOption } from "./sort-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 20;

type ShopFilter = "all" | "drops" | "sneakers" | "new" | "used" | "pokemon";

const FILTERS: { key: ShopFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drops", label: "Drops" },
  { key: "sneakers", label: "Sneakers" },
  { key: "new", label: "New" },
  { key: "used", label: "Used" },
  { key: "pokemon", label: "Pokemon" },
];

const CATEGORY_OPTIONS = [
  { value: "sneakers", label: "Sneakers" },
  { value: "pokemon", label: "Pokemon TCG" },
  { value: "sealed", label: "Sealed Product" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
];

const POKEMON_TYPE_OPTIONS = [
  { value: "raw", label: "Raw Cards" },
  { value: "graded", label: "Graded Cards" },
  { value: "sealed", label: "Sealed Product" },
];

const SIZE_OPTIONS = [
  "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5",
  "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14",
];

interface ShopPageProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ShopPage({ initialProducts, categories }: ShopPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Drop products loaded separately
  const [dropProducts, setDropProducts] = useState<Product[]>([]);
  const [dropsLoading, setDropsLoading] = useState(false);

  // Read URL params
  const [filter, setFilter] = useState<ShopFilter>(
    (searchParams.get("tab") as ShopFilter) || "all"
  );
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Advanced filters
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [categoryFilter, setCategoryFilter] = useState<string[]>(
    searchParams.get("category")?.split(",").filter(Boolean) || []
  );
  const [conditionFilter, setConditionFilter] = useState<string[]>(
    searchParams.get("condition")?.split(",").filter(Boolean) || []
  );
  const [sizeFilter, setSizeFilter] = useState<string[]>(
    searchParams.get("size")?.split(",").filter(Boolean) || []
  );
  const [priceMin, setPriceMin] = useState(searchParams.get("min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("max") || "");
  const [pokemonTypeFilter, setPokemonTypeFilter] = useState<string[]>(
    searchParams.get("ptype")?.split(",").filter(Boolean) || []
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedBrand = useDebounce(brand, 300);

  // Load drop products when drops tab is active
  useEffect(() => {
    if (filter === "drops") {
      setDropsLoading(true);
      fetch("/api/products?drops=true&limit=100")
        .then((r) => r.json())
        .then((d) => setDropProducts(d.products ?? []))
        .catch(() => {})
        .finally(() => setDropsLoading(false));
    }
  }, [filter]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("tab", filter);
    if (sort !== "newest") params.set("sort", sort);
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (debouncedBrand) params.set("brand", debouncedBrand);
    if (categoryFilter.length) params.set("category", categoryFilter.join(","));
    if (conditionFilter.length) params.set("condition", conditionFilter.join(","));
    if (sizeFilter.length) params.set("size", sizeFilter.join(","));
    if (priceMin) params.set("min", priceMin);
    if (priceMax) params.set("max", priceMax);
    if (pokemonTypeFilter.length) params.set("ptype", pokemonTypeFilter.join(","));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }, [filter, sort, debouncedSearch, debouncedBrand, categoryFilter, conditionFilter, sizeFilter, pokemonTypeFilter, priceMin, priceMax, router]);

  // Get unique brands from products
  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const p of initialProducts) {
      if (p.brand) brands.add(p.brand);
    }
    return Array.from(brands).sort();
  }, [initialProducts]);

  const pokemonCategoryId = useMemo(() => {
    const cat = categories.find(
      (c) => c.slug === "pokemon" || c.name.toLowerCase() === "pokemon"
    );
    return cat?.id ?? null;
  }, [categories]);

  const hasActiveFilters = brand || categoryFilter.length > 0 || conditionFilter.length > 0 || sizeFilter.length > 0 || priceMin || priceMax || pokemonTypeFilter.length > 0;

  const clearAdvancedFilters = () => {
    setBrand("");
    setCategoryFilter([]);
    setConditionFilter([]);
    setSizeFilter([]);
    setPokemonTypeFilter([]);
    setPriceMin("");
    setPriceMax("");
  };

  const toggleArrayFilter = (arr: string[], value: string, setter: (v: string[]) => void) => {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  const filterResult = useMemo(() => {
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

    // Tab filter
    switch (filter) {
      case "drops":
        // Use separately loaded drop products instead of filtering initialProducts
        products = [...dropProducts];
        break;
      case "new":
        products = products.filter((p) => p.condition === "new");
        break;
      case "used":
        products = products.filter((p) => p.condition !== "new");
        break;
      case "sneakers":
        if (pokemonCategoryId) {
          products = products.filter((p) => p.category_id !== pokemonCategoryId);
        } else {
          products = products.filter(
            (p) =>
              !p.name.toLowerCase().includes("pokemon") &&
              !p.tags?.some((t) => t.toLowerCase().includes("pokemon"))
          );
        }
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

    // Brand filter
    if (debouncedBrand) {
      const b = debouncedBrand.toLowerCase();
      products = products.filter((p) => p.brand?.toLowerCase().includes(b));
    }

    // Category filter
    if (categoryFilter.length > 0) {
      products = products.filter((p) => {
        const isPokemon = p.brand?.toLowerCase() === "pokemon tcg" ||
          p.name.toLowerCase().includes("pokemon") ||
          p.tags?.some((t) => t.toLowerCase().includes("pokemon"));
        const isSealed = p.tags?.some((t) => t.toLowerCase().includes("sealed")) ||
          p.name.toLowerCase().includes("sealed");

        if (categoryFilter.includes("pokemon") && isPokemon) return true;
        if (categoryFilter.includes("sealed") && isSealed) return true;
        if (categoryFilter.includes("sneakers") && !isPokemon && !isSealed) return true;
        return false;
      });
    }

    // Pokemon type sub-filter (raw/graded/sealed)
    if (pokemonTypeFilter.length > 0) {
      products = products.filter((p) => {
        const tags = p.tags?.map((t) => t.toLowerCase()) || [];
        if (pokemonTypeFilter.includes("raw") && !tags.includes("graded") && !tags.includes("sealed")) return true;
        if (pokemonTypeFilter.includes("graded") && tags.includes("graded")) return true;
        if (pokemonTypeFilter.includes("sealed") && tags.includes("sealed")) return true;
        return false;
      });
    }

    // Condition filter
    if (conditionFilter.length > 0) {
      products = products.filter((p) => {
        if (conditionFilter.includes("new") && p.condition === "new") return true;
        if (conditionFilter.includes("used") && p.condition !== "new") return true;
        return false;
      });
    }

    // Size filter
    if (sizeFilter.length > 0) {
      products = products.filter((p) => p.size && sizeFilter.includes(p.size));
    }

    // Price range
    const minPrice = priceMin ? parseFloat(priceMin) : null;
    const maxPrice = priceMax ? parseFloat(priceMax) : null;
    if (minPrice !== null && !isNaN(minPrice)) {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      products = products.filter((p) => p.price <= maxPrice);
    }

    // Group by product name
    const grouped = new Map<string, Product>();
    const sizesMap = new Map<string, Set<string>>();
    for (const p of products) {
      const key = p.name.toLowerCase().trim();
      const existing = grouped.get(key);
      if (!sizesMap.has(key)) sizesMap.set(key, new Set());
      if (p.size) sizesMap.get(key)!.add(p.size);
      if (!existing) {
        grouped.set(key, { ...p, quantity: p.quantity });
      } else {
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

    return { products, sizesMap };
  }, [initialProducts, dropProducts, filter, sort, debouncedSearch, debouncedBrand, pokemonCategoryId, categoryFilter, conditionFilter, sizeFilter, pokemonTypeFilter, priceMin, priceMax]);

  const filteredProducts = filterResult.products;
  const sizesByName = filterResult.sizesMap;

  // Reset page on filter/search change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setCurrentPage(1); }, [filter, sort, debouncedSearch, debouncedBrand, categoryFilter, conditionFilter, sizeFilter, pokemonTypeFilter, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Filter sidebar content (shared between desktop and mobile)
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Brand */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Brand</h3>
        <Input
          placeholder="Search brand..."
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="h-8 text-sm bg-surface-800/50 border-surface-700/50"
        />
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category</h3>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={categoryFilter.includes(opt.value)}
                onCheckedChange={() => toggleArrayFilter(categoryFilter, opt.value, setCategoryFilter)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Pokemon Type (shows when Pokemon TCG is selected or pokemon tab active) */}
      {(categoryFilter.includes("pokemon") || filter === "pokemon") && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pokemon Type</h3>
          <div className="space-y-2">
            {POKEMON_TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={pokemonTypeFilter.includes(opt.value)}
                  onCheckedChange={() => toggleArrayFilter(pokemonTypeFilter, opt.value, setPokemonTypeFilter)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Price Range</h3>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="h-8 text-sm bg-surface-800/50 border-surface-700/50 w-24"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="h-8 text-sm bg-surface-800/50 border-surface-700/50 w-24"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Condition</h3>
        <div className="space-y-2">
          {CONDITION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={conditionFilter.includes(opt.value)}
                onCheckedChange={() => toggleArrayFilter(conditionFilter, opt.value, setConditionFilter)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Size (hidden when only Pokemon is selected) */}
      {!(categoryFilter.length === 1 && categoryFilter[0] === "pokemon") && filter !== "pokemon" && (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Size</h3>
        <div className="flex flex-wrap gap-1.5">
          {SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => toggleArrayFilter(sizeFilter, size, setSizeFilter)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                sizeFilter.includes(size)
                  ? "bg-primary text-white"
                  : "bg-surface-800/50 text-muted-foreground hover:text-foreground hover:bg-surface-800"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearAdvancedFilters}>
          <X className="h-3 w-3 mr-1.5" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight">
          Shop
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Premium sneakers & collectibles, authenticated and hand-picked.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/50">
        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
                filter === f.key
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-surface-800/50 text-muted-foreground hover:text-foreground hover:bg-surface-800 border border-surface-700/50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Sort + Mobile Filter toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-surface-800/50 border-surface-700/50 focus:border-primary/50 transition-colors"
            />
          </div>
          {/* Mobile filter button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden h-9 w-9 relative">
                <SlidersHorizontal className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-surface-900 border-surface-800">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-8 pt-4">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Filters</h2>
            <FilterContent />
          </div>
        </aside>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Results info */}
          <div className="flex items-center justify-between pb-4 text-sm text-muted-foreground">
            <span>
              <span className="font-mono font-semibold text-foreground">{filteredProducts.length}</span>
              {" "}product{filteredProducts.length !== 1 ? "s" : ""}
              {debouncedSearch && <> matching &ldquo;<span className="text-primary">{debouncedSearch}</span>&rdquo;</>}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAdvancedFilters}
                className="text-xs text-primary hover:underline hidden lg:block"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Products grid */}
          <ProductGrid products={paginatedProducts} sizesByName={sizesByName} />

          {/* Pagination */}
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}
