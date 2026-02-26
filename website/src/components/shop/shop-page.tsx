"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { Product, Category } from "@/types/product";
import { isActiveDrop } from "@/types/product";
import { ProductGrid } from "@/components/product/product-grid";
import { SortSelect, type SortOption } from "./sort-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 24;

/* Clean category tabs */
type CategoryTab = "all" | "sneakers" | "pokemon" | "deals";

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sneakers", label: "Sneakers" },
  { key: "pokemon", label: "Pokemon" },
  { key: "deals", label: "Daily Deals" },
];

type SizeCategory = "mens" | "womens" | "gs" | "ps" | "td";

const SIZE_CATEGORIES: Record<SizeCategory, { label: string; sizes: string[] }> = {
  mens: {
    label: "Men",
    sizes: ["3.5","4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","13","14","15","16"],
  },
  womens: {
    label: "Women",
    sizes: ["5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","12"],
  },
  gs: { label: "GS", sizes: ["3.5Y","4Y","4.5Y","5Y","5.5Y","6Y","6.5Y","7Y"] },
  ps: { label: "PS", sizes: ["10.5C","11C","11.5C","12C","12.5C","13C","13.5C","1Y","1.5Y","2Y","2.5Y","3Y"] },
  td: { label: "TD", sizes: ["2C","3C","4C","5C","6C","7C","8C","9C","10C"] },
};

/* Collapsible filter section */
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-neutral-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 hover:text-neutral-600 transition-colors"
      >
        {title}
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && <div className="pt-3">{children}</div>}
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

  const [tab, setTab] = useState<CategoryTab>(
    (searchParams.get("tab") as CategoryTab) || "all"
  );
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "newest"
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [currentPage, setCurrentPage] = useState(1);

  /* Sidebar filters */
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [sizeFilter, setSizeFilter] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [pokemonTypeFilter, setPokemonTypeFilter] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sizeCategory, setSizeCategory] = useState<SizeCategory>("mens");

  const debouncedSearch = useDebounce(search, 300);

  /* Fetch daily deals */
  useEffect(() => {
    fetch("/api/products?drops=true&limit=100")
      .then((r) => r.json())
      .then((d) => setDropProducts(d.products ?? []))
      .catch(() => {});
  }, []);

  /* URL sync */
  useEffect(() => {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (sort !== "newest") params.set("sort", sort);
    if (debouncedSearch) params.set("q", debouncedSearch);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/", { scroll: false });
  }, [tab, sort, debouncedSearch, router]);

  const pokemonCategoryId = useMemo(() => {
    const cat = categories.find(
      (c) => c.slug === "pokemon" || c.name.toLowerCase() === "pokemon"
    );
    return cat?.id ?? null;
  }, [categories]);

  const dealProductIds = useMemo(() => new Set(dropProducts.map((p) => p.id)), [dropProducts]);

  const allBrands = useMemo(() => {
    const brands = new Set<string>();
    for (const p of initialProducts) {
      if (p.brand) brands.add(p.brand);
    }
    return Array.from(brands).sort();
  }, [initialProducts]);

  const hasActiveFilters = conditionFilter.length > 0 || sizeFilter.length > 0 || priceMin || priceMax || brandFilter || pokemonTypeFilter.length > 0;

  const activeFilterCount = [
    conditionFilter.length,
    sizeFilter.length,
    pokemonTypeFilter.length,
    priceMin ? 1 : 0,
    priceMax ? 1 : 0,
    brandFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setConditionFilter([]);
    setSizeFilter([]);
    setPokemonTypeFilter([]);
    setPriceMin("");
    setPriceMax("");
    setBrandFilter("");
  };

  const toggleArray = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  /* Filter + sort products */
  const filterResult = useMemo(() => {
    let products = [...initialProducts];

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    // Category tab
    if (tab === "sneakers") {
      if (pokemonCategoryId) {
        products = products.filter((p) => p.category_id !== pokemonCategoryId);
      }
    } else if (tab === "pokemon") {
      if (pokemonCategoryId) {
        products = products.filter((p) => p.category_id === pokemonCategoryId);
      }
    } else if (tab === "deals") {
      products = products.filter((p) => dealProductIds.has(p.id));
    }

    // Brand
    if (brandFilter) {
      products = products.filter((p) => p.brand === brandFilter);
    }

    // Pokemon type
    if (pokemonTypeFilter.length > 0) {
      products = products.filter((p) => {
        const tags = p.tags?.map((t) => t.toLowerCase()) || [];
        const name = p.name.toLowerCase();
        if (pokemonTypeFilter.includes("sealed") && (tags.includes("sealed") || name.includes("booster") || name.includes("elite trainer") || name.includes("etb") || name.includes("box"))) return true;
        if (pokemonTypeFilter.includes("graded") && (tags.includes("graded") || tags.includes("slab") || name.includes("psa") || name.includes("bgs") || name.includes("cgc") || name.includes("graded") || name.includes("slab"))) return true;
        if (pokemonTypeFilter.includes("raw") && !tags.includes("graded") && !tags.includes("slab") && !tags.includes("sealed") && !name.includes("booster") && !name.includes("elite trainer") && !name.includes("etb")) return true;
        return false;
      });
    }

    // Condition
    if (conditionFilter.length > 0) {
      products = products.filter((p) => {
        if (conditionFilter.includes("new") && p.condition === "new") return true;
        if (conditionFilter.includes("used") && p.condition !== "new") return true;
        return false;
      });
    }

    // Size
    if (sizeFilter.length > 0) {
      products = products.filter((p) => p.size && sizeFilter.includes(p.size));
    }

    // Price
    const minP = priceMin ? parseFloat(priceMin) : null;
    const maxP = priceMax ? parseFloat(priceMax) : null;
    if (minP !== null && !isNaN(minP)) products = products.filter((p) => p.price >= minP);
    if (maxP !== null && !isNaN(maxP)) products = products.filter((p) => p.price <= maxP);

    // Group by name (aggregate sizes)
    const grouped = new Map<string, Product>();
    const sizesMap = new Map<string, Set<string>>();
    for (const p of products) {
      const key = p.name.toLowerCase().trim();
      if (!sizesMap.has(key)) sizesMap.set(key, new Set());
      if (p.size) sizesMap.get(key)!.add(p.size);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, { ...p, quantity: p.quantity });
      } else {
        grouped.set(key, p.price < existing.price
          ? { ...p, quantity: existing.quantity + p.quantity }
          : { ...existing, quantity: existing.quantity + p.quantity }
        );
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
  }, [initialProducts, tab, sort, debouncedSearch, brandFilter, pokemonCategoryId, conditionFilter, sizeFilter, priceMin, priceMax, dealProductIds, pokemonTypeFilter]);

  const filteredProducts = filterResult.products;
  const sizesByName = filterResult.sizesMap;

  // Reset page on filter change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setCurrentPage(1); }, [tab, sort, debouncedSearch, brandFilter, conditionFilter, sizeFilter, priceMin, priceMax, pokemonTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  /* Sidebar filter content */
  const FilterContent = () => (
    <div className="space-y-0">
      {/* Pokemon Type (only on Pokemon tab) */}
      {tab === "pokemon" && (
        <FilterSection title="Type">
          <div className="space-y-2.5">
            {[
              { value: "sealed", label: "Sealed Product" },
              { value: "raw", label: "Raw Cards" },
              { value: "graded", label: "Slabs / Graded" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer group/label">
                <Checkbox
                  checked={pokemonTypeFilter.includes(opt.value)}
                  onCheckedChange={() => toggleArray(pokemonTypeFilter, opt.value, setPokemonTypeFilter)}
                />
                <span className="text-neutral-600 group-hover/label:text-neutral-900 transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Condition (sneakers only) */}
      {tab !== "pokemon" && tab !== "deals" && (
        <FilterSection title="Condition">
          <div className="space-y-2.5">
            {[{ value: "new", label: "New" }, { value: "used", label: "Preowned" }].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2.5 text-sm cursor-pointer group/label">
                <Checkbox
                  checked={conditionFilter.includes(opt.value)}
                  onCheckedChange={() => toggleArray(conditionFilter, opt.value, setConditionFilter)}
                />
                <span className="text-neutral-600 group-hover/label:text-neutral-900 transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brand dropdown (sneakers only) */}
      {tab !== "pokemon" && (
        <FilterSection title="Brand">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="w-full h-9 text-sm bg-neutral-50 border border-neutral-200 rounded-lg px-3 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#FB4F14]/20 appearance-none cursor-pointer"
          >
            <option value="">All Brands</option>
            {allBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
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
          <span className="text-neutral-300 text-xs">-</span>
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

      {/* Size (sneakers only, not deals) */}
      {tab !== "pokemon" && tab !== "deals" && (
        <FilterSection title="Size" defaultOpen={false}>
          <div className="flex flex-wrap gap-1 mb-3">
            {(Object.keys(SIZE_CATEGORIES) as SizeCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSizeCategory(cat)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-all",
                  sizeCategory === cat
                    ? "bg-[#002244] text-white"
                    : "bg-neutral-100 text-neutral-400 hover:text-neutral-600"
                )}
              >
                {SIZE_CATEGORIES[cat].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {SIZE_CATEGORIES[sizeCategory].sizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleArray(sizeFilter, size, setSizeFilter)}
                className={cn(
                  "py-1.5 rounded text-xs font-medium transition-all text-center",
                  sizeFilter.includes(size)
                    ? "bg-[#FB4F14] text-white"
                    : "bg-neutral-50 text-neutral-500 hover:bg-neutral-100 border border-neutral-200"
                )}
              >
                {size}
              </button>
            ))}
          </div>
          {sizeFilter.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {sizeFilter.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleArray(sizeFilter, s, setSizeFilter)}
                  className="px-2 py-0.5 rounded bg-[#FB4F14]/10 text-[#FB4F14] text-[10px] font-bold flex items-center gap-0.5 hover:bg-[#FB4F14]/20"
                >
                  {s} <X className="h-2.5 w-2.5" />
                </button>
              ))}
            </div>
          )}
        </FilterSection>
      )}

      {/* Clear */}
      {hasActiveFilters && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-lg text-xs border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Header bar: Category tabs + Search + Sort — one clean row */}
      <div className="flex items-center gap-6 pb-6 border-b border-neutral-200/60 mb-6">
        {/* Category tabs */}
        <div className="hidden md:flex items-center gap-1">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                tab === t.key
                  ? "bg-[#002244] text-white"
                  : "text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-full bg-neutral-50 border-neutral-200 pl-10 pr-10 text-sm focus-visible:ring-[#FB4F14]/20"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="hidden md:block">
          <SortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Mobile: Category tabs + Sort/Filter */}
      <div className="md:hidden space-y-3 -mt-3 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all shrink-0",
                tab === t.key
                  ? "bg-[#002244] text-white"
                  : "bg-neutral-100 text-neutral-400"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SortSelect value={sort} onChange={setSort} />
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 shrink-0 rounded-full border-neutral-200 text-sm">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FB4F14] text-[9px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm bg-white">
              <SheetHeader>
                <SheetTitle className="text-left text-lg font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main: Sidebar + Grid */}
      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24">
            <FilterContent />
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Count */}
          <div className="flex items-center justify-between pb-4">
            <p className="text-sm text-neutral-400">
              <span className="font-semibold text-neutral-700">{filteredProducts.length}</span>
              {" "}product{filteredProducts.length !== 1 ? "s" : ""}
              {debouncedSearch && (
                <> for &ldquo;<span className="text-[#FB4F14]">{debouncedSearch}</span>&rdquo;</>
              )}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs font-medium text-[#FB4F14] hover:underline hidden lg:block">
                Clear filters
              </button>
            )}
          </div>

          <ProductGrid products={paginatedProducts} sizesByName={sizesByName} />
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}
