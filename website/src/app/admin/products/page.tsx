"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGroupedProducts, type GroupedProduct } from "@/actions/inventory";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Search, Package, ArrowUpDown, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

type SortField = "name" | "totalQuantity" | "averageCost" | "sellPrice" | "variantCount";
type SortDir = "asc" | "desc";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getGroupedProducts();
        setProducts(data);
      } catch (err) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "all") {
      list = list.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "totalQuantity": cmp = a.totalQuantity - b.totalQuantity; break;
        case "averageCost": cmp = a.averageCost - b.averageCost; break;
        case "sellPrice": cmp = a.sellPrice - b.sellPrice; break;
        case "variantCount": cmp = a.variantCount - b.variantCount; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [products, category, search, sortField, sortDir]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page when search/category changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { setCurrentPage(1); }, [search, category]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sneakerCount = products.filter((p) => p.category === "sneaker").length;
  const pokemonCount = products.filter((p) => p.category === "pokemon").length;

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          {products.length} unique products across all categories
        </p>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="all">All ({products.length})</TabsTrigger>
          <TabsTrigger value="sneaker">Sneakers ({sneakerCount})</TabsTrigger>
          <TabsTrigger value="pokemon">Pokemon ({pokemonCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[80px]"></th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors">
                        Product <SortIcon field="name" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort("variantCount")} className="flex items-center hover:text-foreground transition-colors">
                        Variants <SortIcon field="variantCount" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort("totalQuantity")} className="flex items-center hover:text-foreground transition-colors">
                        Total Qty <SortIcon field="totalQuantity" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort("averageCost")} className="flex items-center hover:text-foreground transition-colors">
                        Avg Cost <SortIcon field="averageCost" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort("sellPrice")} className="flex items-center hover:text-foreground transition-colors">
                        Sell Price <SortIcon field="sellPrice" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Package className="h-7 w-7 text-primary" />
                          </div>
                          <p className="text-sm font-medium">{search ? "No products match your search" : "No products yet"}</p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                            {search ? "Try a different search term." : "Add your first product to get started selling."}
                          </p>
                          {!search && (
                            <Link href="/admin/products/new" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                              <Plus className="h-4 w-4" />
                              Add Your First Product
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((product) => (
                      <Link
                        key={product.name}
                        href={`/admin/products/detail?name=${encodeURIComponent(product.name)}`}
                        className="contents"
                      >
                        <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={64}
                                height={64}
                                className="rounded-lg object-contain w-16 h-16 bg-white p-1"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {product.category === "pokemon" ? "Pokemon" : "Sneaker"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {product.variantCount} size{product.variantCount !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3">
                            <span className={product.totalQuantity === 0 ? "text-destructive font-bold" : ""}>
                              {product.totalQuantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {product.averageCost > 0 ? formatCurrency(product.averageCost) : "--"}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {formatCurrency(product.sellPrice)}
                          </td>
                        </tr>
                      </Link>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Showing {((safePage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</span>
          </div>
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
