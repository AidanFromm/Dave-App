"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { getInventoryList } from "@/actions/admin";
import { getInventoryStats, type InventoryStats } from "@/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  RefreshCw,
  Package,
  Search,
  DollarSign,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

type CategoryFilter = "all" | "sneaker" | "pokemon";
type ConditionFilter = "all" | "new" | "used";

interface GroupedRow {
  name: string;
  image: string | null;
  totalQuantity: number;
  variantCount: number;
  averageCost: number;
  sellPrice: number;
  totalValue: number;
  category: "sneaker" | "pokemon" | "other";
  conditions: Set<string>;
}

type SortField = "name" | "totalQuantity" | "totalValue";
type SortDir = "asc" | "desc";

const POKEMON_KEYWORDS = [
  "pokemon", "pokémon", "pikachu", "charizard", "mewtwo", "booster",
  "etb", "elite trainer", "trainer box", "paldea", "obsidian", "scarlet",
  "violet", "prismatic", "surging sparks", "twilight masquerade",
  "temporal forces", "paldean fates", "paradox rift", "raging surf",
  "lost origin", "astral radiance", "brilliant stars", "evolving skies",
  "fusion strike", "celebrations", "vivid voltage", "darkness ablaze",
  "rebel clash", "sword", "shield", "vmax", "vstar", "ex box",
];

function isPokemonProduct(name: string, tags: string[]): boolean {
  const lowerName = name.toLowerCase();
  const lowerTags = tags.map((t) => t.toLowerCase());
  return POKEMON_KEYWORDS.some(
    (kw) => lowerName.includes(kw) || lowerTags.some((t) => t.includes(kw))
  );
}

function classifyProductClient(product: Product): "sneaker" | "pokemon" | "other" {
  const tags = product.tags ?? [];
  if (isPokemonProduct(product.name, tags)) return "pokemon";

  const lowerTags = tags.map((t) => t.toLowerCase());
  if (
    lowerTags.includes("sneaker") ||
    lowerTags.includes("sneakers") ||
    lowerTags.includes("shoe") ||
    lowerTags.includes("shoes")
  )
    return "sneaker";

  return "sneaker"; // default same as server
}

const PRIMARY_TABS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sneaker", label: "Sneakers" },
  { value: "pokemon", label: "Pokemon" },
];

const CONDITION_TABS: { value: ConditionFilter; label: string }[] = [
  { value: "all", label: "All Conditions" },
  { value: "new", label: "New" },
  { value: "used", label: "Used" },
];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("all");
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchData = useCallback(async () => {
    try {
      const [data, invStats] = await Promise.all([
        getInventoryList(),
        getInventoryStats(),
      ]);
      setProducts(data as Product[]);
      setStats(invStats);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const grouped: GroupedRow[] = useMemo(() => {
    const groups = new Map<string, Product[]>();
    products.forEach((p) => {
      const key = p.name.trim().toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    });

    const rows: GroupedRow[] = [];
    groups.forEach((variants) => {
      const first = variants[0];
      const totalQty = variants.reduce((s, v) => s + v.quantity, 0);
      const costsWithQty = variants.filter((v) => v.cost != null && v.cost! > 0);
      const totalCostUnits = costsWithQty.reduce((s, v) => s + v.quantity, 0);
      const avgCost =
        totalCostUnits > 0
          ? costsWithQty.reduce((s, v) => s + (v.cost ?? 0) * v.quantity, 0) / totalCostUnits
          : 0;
      const totalValue = variants.reduce(
        (s, v) => s + v.quantity * (v.cost ?? v.price),
        0
      );

      const conditions = new Set<string>();
      variants.forEach((v) => {
        if (v.condition) conditions.add(v.condition);
      });

      rows.push({
        name: first.name.trim(),
        image: first.images?.[0] ?? null,
        totalQuantity: totalQty,
        variantCount: variants.length,
        averageCost: Math.round(avgCost * 100) / 100,
        sellPrice: first.price,
        totalValue: Math.round(totalValue * 100) / 100,
        category: classifyProductClient(first),
        conditions,
      });
    });

    return rows;
  }, [products]);

  const filtered = useMemo(() => {
    let list = grouped;

    // Category filter
    if (activeFilter === "sneaker") {
      list = list.filter((r) => r.category === "sneaker");
    } else if (activeFilter === "pokemon") {
      list = list.filter((r) => r.category === "pokemon");
    }

    // Condition sub-filter (only when a specific category is selected)
    if (activeFilter !== "all" && conditionFilter !== "all") {
      list = list.filter((r) => r.conditions.has(conditionFilter));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "totalQuantity":
          cmp = a.totalQuantity - b.totalQuantity;
          break;
        case "totalValue":
          cmp = a.totalValue - b.totalValue;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [grouped, search, activeFilter, conditionFilter, sortField, sortDir]);

  const filterCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: grouped.length,
      sneaker: 0,
      pokemon: 0,
    };
    grouped.forEach((r) => {
      if (r.category === "sneaker") counts.sneaker++;
      if (r.category === "pokemon") counts.pokemon++;
    });
    return counts;
  }, [grouped]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product stock levels and inventory
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unique Products
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Units
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalUnits}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inventory Value
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalValue)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-80" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Filter Tabs + Search */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
                {PRIMARY_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setActiveFilter(tab.value);
                      setConditionFilter("all");
                    }}
                    aria-label={`Filter by ${tab.label}`}
                    aria-pressed={activeFilter === tab.value}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-all
                      ${
                        activeFilter === tab.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs opacity-60">
                      {filterCounts[tab.value]}
                    </span>
                  </button>
                ))}
              </div>
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {activeFilter !== "all" && (
              <div className="flex items-center gap-1 rounded-full border bg-muted/20 p-0.5 w-fit">
                {CONDITION_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setConditionFilter(tab.value)}
                    aria-label={`Filter by condition: ${tab.label}`}
                    aria-pressed={conditionFilter === tab.value}
                    className={`
                      px-2.5 py-1 text-xs font-medium rounded-full transition-all
                      ${
                        conditionFilter === tab.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground w-[100px]">
                      Image
                    </th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Product <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Variants
                    </th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort("totalQuantity")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Total Qty <SortIcon field="totalQuantity" />
                      </button>
                    </th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Avg Cost
                    </th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      Sell Price
                    </th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort("totalValue")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Value <SortIcon field="totalValue" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center text-muted-foreground"
                      >
                        <Package className="mx-auto h-8 w-8 mb-3 opacity-40" />
                        <p className="text-sm">No products found</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => (
                      <Link
                        key={row.name}
                        href={`/admin/products/detail?name=${encodeURIComponent(row.name)}`}
                        className="contents"
                      >
                        <tr className="border-b last:border-b-0 hover:bg-muted/20 transition-colors cursor-pointer">
                          <td className="px-5 py-4 align-middle">
                            {row.image ? (
                              <div className="w-[76px] h-[76px] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-2 shadow-sm border border-gray-100 dark:border-gray-700">
                                <Image
                                  src={row.image}
                                  alt={row.name}
                                  width={76}
                                  height={76}
                                  className="rounded-md object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal"
                                />
                              </div>
                            ) : (
                              <div className="w-[76px] h-[76px] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                                <Package className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <span className="font-medium text-sm leading-tight">
                              {row.name}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-middle text-muted-foreground">
                            {row.variantCount}
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <span
                              className={
                                row.totalQuantity === 0
                                  ? "text-destructive font-semibold"
                                  : "font-medium"
                              }
                            >
                              {row.totalQuantity}
                            </span>
                          </td>
                          <td className="px-5 py-4 align-middle text-muted-foreground">
                            {row.averageCost > 0
                              ? formatCurrency(row.averageCost)
                              : "--"}
                          </td>
                          <td className="px-5 py-4 align-middle">
                            {formatCurrency(row.sellPrice)}
                          </td>
                          <td className="px-5 py-4 align-middle font-medium">
                            {formatCurrency(row.totalValue)}
                          </td>
                        </tr>
                      </Link>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer count */}
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {grouped.length} products
          </p>
        </div>
      )}
    </div>
  );
}
