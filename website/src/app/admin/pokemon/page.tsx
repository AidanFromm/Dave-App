"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Product } from "@/types/product";

type PokemonFilter = "all" | "raw" | "graded" | "sealed";
type SortField = "name" | "price" | "quantity" | "created_at";
type SortDir = "asc" | "desc";

function isGraded(p: Product): boolean {
  return (
    p.tags?.includes("graded") === true ||
    /\[(PSA|BGS|CGC|SGC|ACE|TAG)\s/i.test(p.name)
  );
}

function isSealed(p: Product): boolean {
  return p.tags?.includes("sealed") === true;
}

function getGradeBadge(p: Product): string | null {
  const m = p.name.match(/\[([A-Z]{2,3}\s+\d+(?:\.\d+)?(?:\s+.*?)?)\]/);
  return m ? m[1] : null;
}

export default function AdminPokemonPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PokemonFilter>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/products?category=pokemon");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products ?? []);
        }
      } catch {
        toast.error("Failed to load Pokemon products");
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];

    // Filter
    switch (filter) {
      case "raw":
        list = list.filter((p) => !isSealed(p) && !isGraded(p));
        break;
      case "graded":
        list = list.filter((p) => isGraded(p));
        break;
      case "sealed":
        list = list.filter((p) => isSealed(p));
        break;
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "quantity":
          cmp = a.quantity - b.quantity;
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [products, filter, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const counts = {
    all: products.length,
    raw: products.filter((p) => !isSealed(p) && !isGraded(p)).length,
    graded: products.filter((p) => isGraded(p)).length,
    sealed: products.filter((p) => isSealed(p)).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-80" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pokemon Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} Pokemon products in inventory
          </p>
        </div>
        <Link href="/admin/scan">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Pokemon
          </Button>
        </Link>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as PokemonFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="raw">Raw ({counts.raw})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({counts.graded})</TabsTrigger>
          <TabsTrigger value="sealed">Sealed ({counts.sealed})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Pokemon inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[72px]"></th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Product <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Grade / Condition
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort("quantity")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Qty <SortIcon field="quantity" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort("price")}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        Price <SortIcon field="price" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[80px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        {search
                          ? "No Pokemon products match your search."
                          : "No Pokemon products found."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product) => {
                      const grade = getGradeBadge(product);
                      const sealed = isSealed(product);
                      const graded = isGraded(product);

                      return (
                        <tr
                          key={product.id}
                          className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={56}
                                height={56}
                                className="rounded-lg object-contain w-14 h-14 bg-white p-0.5"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium line-clamp-1">
                              {product.name}
                            </p>
                            {product.colorway && (
                              <p className="text-xs text-muted-foreground">
                                {product.colorway}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {sealed ? "Sealed" : graded ? "Graded" : "Raw"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {grade ? (
                              <Badge className="bg-black text-white text-xs">
                                {grade}
                              </Badge>
                            ) : sealed ? (
                              <Badge className="bg-green-600 text-white text-xs">
                                Sealed
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {product.tags
                                  ?.find((t) =>
                                    ["NM", "LP", "MP", "HP", "DMG"].includes(t)
                                  ) ?? "Raw"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                product.quantity === 0
                                  ? "text-destructive font-bold"
                                  : ""
                              }
                            >
                              {product.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
