"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown, Package } from "lucide-react";
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
  { key: "drops", label: "Daily Deals" },
  { key: "sneakers", label: "Sneakers" },
  { key: "new", label: "New" },
  { key: "used", label: "Preowned" },
  { key: "pokemon", label: "Pokemon" },
];

const CATEGORY_OPTIONS = [
  { value: "sneakers", label: "Sneakers" },
  { value: "pokemon", label: "Pokemon" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "used", label: "Preowned" },
];

const POKEMON_TYPE_OPTIONS = [
  { value: "raw", label: "Raw Cards" },
  { value: "graded", label: "Graded Cards" },
  { value: "sealed", label: "Sealed Product" },
];

type SizeCategory = "mens" | "womens" | "gradeSchool" | "preschool" | "toddler" | "crib";

const SIZE_CATEGORIES: Record<SizeCategory, { label: string; sizes: string[] }> = {
  mens: {
    label: "Men",
    sizes: [
      "3.5", "4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5",
      "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5",
      "12", "13", "14", "15", "16", "17", "18",
    ],
  },
  womens: {
    label: "Women",
    sizes: [
      "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5",
      "9", "9.5", "10", "10.5", "11", "12", "13", "14",
    ],
  },
  gradeSchool: {
    label: "GS",
    sizes: ["3.5Y", "4Y", "4.5Y", "5Y", "5.5Y", "6Y", "6.5Y", "7Y"],
  },
  preschool: {
    label: "PS",
    sizes: ["10.5C", "11C", "11.5C", "12C", "12.5C", "13C", "13.5C", "1Y", "1.5Y", "2Y", "2.5Y", "3Y"],
  },
  toddler: {
    label: "TD",
    sizes: ["2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C"],
  },
  crib: {
    label: "Crib",
    sizes: ["0C", "1C", "2C", "3C", "4C"],
  },
};

const SIZE_OPTIONS = SIZE_CATEGORIES.mens.sizes;

/* Collapsible filter section */
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-200/60 pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {title}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  );
}

interface ShopPageProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ShopPage({ initialProducts, categories }: ShopPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dropProducts, setDropProducts] = useState<Product[]>([]);
  const [dropsLoading, setDropsLoading] = useState(false);

  const [filter, setFilter] = useState<ShopFilter>(
    (searchParams.get("tab") as ShopFilter) || "all"
  );
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [currentPage, setCurrentPage] = useState(1);

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
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>("mens");

  const debouncedSearch = useDebounce(search, 300);
  const debouncedBrand = useDebounce(brand, 300);

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

  const activeFilterCount = [
    brand ? 1 : 0,
    categoryFilter.length,
    conditionFilter.length,
    sizeFilter.length,
    pokemonTypeFilter.length,
    priceMin ? 1 : 0,
    priceMax ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

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

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    switch (filter) {
      case "drops":
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

    if (debouncedBrand) {
      const b = debouncedBrand.toLowerCase();
      products = products.filter((p) => p.brand?.toLowerCase().includes(b));
    }

    if (categoryFilter.length > 0) {
      products = products.filter((p) => {
        const isPokemon = pokemonCategoryId
          ? p.category_id === pokemonCategoryId
          : (p.brand?.toLowerCase() === "pokemon tcg" ||
            p.name.toLowerCase().includes("pokemon") ||
            p.name.toLowerCase().includes("pokémon") ||
            p.tags?.some((t) => t.toLowerCase().includes("pokemon")));

        if (categoryFilter.includes("pokemon") && isPokemon) return true;
        if (categoryFilter.includes("sneakers") && !isPokemon) return true;
        return false;
      });
    }

    if (pokemonTypeFilter.length > 0) {
      products = products.filter((p) => {
        const tags = p.tags?.map((t) => t.toLowerCase()) || [];
        if (pokemonTypeFilter.includes("raw") && !tags.includes("graded") && !tags.includes("sealed")) return true;
        if (pokemonTypeFilter.includes("graded") && tags.includes("graded")) return true;
        if (pokemonTypeFilter.includes("sealed") && tags.includes("sealed")) return true;
        return false;
      });
    }

    if (conditionFilter.length > 0) {
      products = products.filter((p) => {
        const isPokemon = pokemonCategoryId
          ? p.category_id === pokemonCategoryId
          : (p.brand?.toLowerCase() === "pokemon tcg" ||
            p.name.toLowerCase().includes("pokemon") ||
            p.name.toLowerCase().includes("pokémon") ||
            p.tags?.some((t) => t.toLowerCase().includes("pokemon")));
        if (isPokemon) return false;
        if (conditionFilter.includes("new") && p.condition === "new") return true;
        if (conditionFilter.includes("used") && p.condition !== "new") return true;
        return false;
      });
    }

    if (sizeFilter.length > 0) {
      products = products.filter((p) => p.size && sizeFilter.includes(p.size));
    }

    const minPrice = priceMin ? parseFloat(priceMin) : null;
    const maxPrice = priceMax ? parseFloat(priceMax) : null;
    if (minPrice !== null && !isNaN(minPrice)) {
      products = products.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      products = products.filter((p) => p.price <= maxPrice);
    }

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setCurrentPage(1); }, [filter, sort, debouncedSearch, debouncedBrand, categoryFilter, conditionFilter, sizeFilter, pokemonTypeFilter, priceMin, priceMax]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const FilterContent = () => (
    <div className="space-y-1">
      {/* Brand */}
      <FilterSection title="Brand">
        <Input
          placeholder="Search brand..."
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="h-9 text-sm bg-neutral-50 border-neutral-200 rounded-lg focus-visible:ring-[#FB4F14]/30"
        />
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category">
        <div className="space-y-2.5">
          {CATEGORY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer group/label">
              <Checkbox
                checked={categoryFilter.includes(opt.value)}
                onCheckedChange={() => toggleArrayFilter(categoryFilter, opt.value, setCategoryFilter)}
              />
              <span className="text-neutral-600 group-hover/label:text-neutral-900 transition-colors">{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Sneaker Type */}
      {(categoryFilter.includes("sneakers") || filter === "sneakers" || (!categoryFilter.length && filter === "all")) && (
        <FilterSection title="Sneaker Type">
          <div className="space-y-2.5">
            {CONDITION_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer group/label">
                <Checkbox
                  checked={conditionFilter.includes(opt.value)}
                  onCheckedChange={() => toggleArrayFilter(conditionFilter, opt.value, setConditionFilter)}
                />
                <span className="text-neutral-600 group-hover/label:text-neutral-900 transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Pokemon Type */}
      {(categoryFilter.includes("pokemon") || filter === "pokemon") && (
        <FilterSection title="Pokemon Type">
          <div className="space-y-2.5">
            {POKEMON_TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer group/label">
                <Checkbox
                  checked={pokemonTypeFilter.includes(opt.value)}
                  onCheckedChange={() => toggleArrayFilter(pokemonTypeFilter, opt.value, setPokemonTypeFilter)}
                />
                <span className="text-neutral-600 group-hover/label:text-neutral-900 transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Range */}
      <FilterSection title="Price">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">$</span>
            <Input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="h-9 text-sm bg-neutral-50 border-neutral-200 rounded-lg pl-6 focus-visible:ring-[#FB4F14]/30"
            />
          </div>
          <span className="text-neutral-300 text-sm">--</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">$</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="h-9 text-sm bg-neutral-50 border-neutral-200 rounded-lg pl-6 focus-visible:ring-[#FB4F14]/30"
            />
          </div>
        </div>
      </FilterSection>

      {/* Size */}
      {!(categoryFilter.length === 1 && categoryFilter[0] === "pokemon") && filter !== "pokemon" && (
        <FilterSection title="Size" defaultOpen={false}>
          {/* Size Category Tabs */}
          <div className="flex flex-wrap gap-1 mb-3">
            {(Object.keys(SIZE_CATEGORIES) as SizeCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSizeCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  sizeCategory === cat
                    ? "bg-[#002244] text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/70"
                )}
              >
                {SIZE_CATEGORIES[cat].label}
              </button>
            ))}
          </div>

          {/* Size Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {SIZE_CATEGORIES[sizeCategory].sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleArrayFilter(sizeFilter, size, setSizeFilter)}
                className={cn(
                  "px-1 py-2 rounded-lg text-xs font-medium transition-all text-center",
                  sizeFilter.includes(size)
                    ? "bg-[#FB4F14] text-white shadow-sm ring-1 ring-[#FB4F14]"
                    : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 ring-1 ring-neutral-200/60 hover:ring-neutral-300"
                )}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Selected sizes */}
          {sizeFilter.length > 0 && (
            <div className="mt-3 pt-2 border-t border-neutral-200/60">
              <p className="text-[10px] text-neutral-400 mb-1.5 uppercase tracking-wider font-medium">Selected:</p>
              <div className="flex flex-wrap gap-1">
                {sizeFilter.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleArrayFilter(sizeFilter, size, setSizeFilter)}
                    className="px-2 py-0.5 rounded-md bg-[#FB4F14]/10 text-[#FB4F14] text-[10px] font-bold flex items-center gap-1 hover:bg-[#FB4F14]/20 transition-colors"
                  >
                    {size}
                    <X className="h-2.5 w-2.5" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </FilterSection>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-lg border-neutral-300 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            onClick={clearAdvancedFilters}
          >
            <X className="h-3 w-3 mr-1.5" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-900">
          Shop
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500 max-w-md">
          Premium sneakers and collectibles -- authenticated and hand-picked.
        </p>
      </div>

      {/* Desktop: Tabs + Search + Sort bar */}
      <div className="hidden lg:flex items-center gap-4 pb-6 border-b border-neutral-200/60">
        {/* Filter tabs */}
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                filter === f.key
                  ? "bg-[#002244] text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg bg-neutral-50 border-neutral-200 pl-9 pr-9 text-sm focus-visible:ring-[#FB4F14]/30"
          />
          {search && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <SortSelect value={sort} onChange={setSort} />
      </div>

      {/* Mobile: Search + Sort + Filter tabs */}
      <div className="lg:hidden space-y-3 pb-5 border-b border-neutral-200/60">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-xl bg-neutral-50 border-neutral-200 pl-10 pr-10 text-sm"
          />
          {search && (
            <button
              type="button"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-neutral-400 hover:text-neutral-600"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter tabs (horizontal scroll) */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all shrink-0",
                filter === f.key
                  ? "bg-[#002244] text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-500 hover:text-neutral-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort + Filter button row */}
        <div className="flex items-center gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 relative shrink-0 rounded-lg border-neutral-200">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FB4F14] text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm bg-white border-neutral-200">
              <SheetHeader>
                <SheetTitle className="text-left font-display text-lg font-bold uppercase tracking-tight">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto max-h-[calc(100vh-8rem)] pr-1">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-10 pt-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Results info */}
          <div className="flex items-center justify-between pb-5">
            <p className="text-sm text-neutral-500">
              <span className="font-bold text-neutral-900">{filteredProducts.length}</span>
              {" "}product{filteredProducts.length !== 1 ? "s" : ""}
              {debouncedSearch && <> matching &ldquo;<span className="text-[#FB4F14] font-medium">{debouncedSearch}</span>&rdquo;</>}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAdvancedFilters}
                className="text-xs font-semibold text-[#FB4F14] hover:underline hidden lg:block"
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
