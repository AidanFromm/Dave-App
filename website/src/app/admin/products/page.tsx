"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGroupedProducts, type GroupedProduct, createProduct } from "@/actions/inventory";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Search,
  Package,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  ScanBarcode,
  Upload,
  Loader2,
  Footprints,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 20;

type InventoryMode = "sneakers" | "pokemon";
type SneakerFilter = "all" | "new" | "used";
type PokemonFilter = "all" | "raw" | "graded" | "sealed";
type SortField = "name" | "totalQuantity" | "averageCost" | "sellPrice" | "variantCount";
type SortDir = "asc" | "desc";

function getPokemonSubType(product: GroupedProduct): "raw" | "graded" | "sealed" {
  // We don't have tags on GroupedProduct, so we'll use name-based heuristics
  const name = product.name.toLowerCase();
  if (name.includes("graded") || name.includes("psa") || name.includes("bgs") || name.includes("cgc")) return "graded";
  if (name.includes("sealed") || name.includes("booster") || name.includes("etb") || name.includes("box")) return "sealed";
  return "raw";
}

function getSneakerCondition(product: GroupedProduct): "new" | "used" {
  if (product.condition && product.condition !== "new") return "used";
  return "new";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState<GroupedProduct | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggle state with localStorage persistence
  const [mode, setMode] = useState<InventoryMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("inventory-mode") as InventoryMode) || "sneakers";
    }
    return "sneakers";
  });

  const [sneakerFilter, setSneakerFilter] = useState<SneakerFilter>("all");
  const [pokemonFilter, setPokemonFilter] = useState<PokemonFilter>("all");

  // Modal state
  const [addSneakerOpen, setAddSneakerOpen] = useState(false);
  const [addPokemonOpen, setAddPokemonOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("inventory-mode", mode);
  }, [mode]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getGroupedProducts();
        setProducts(data);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sneakerProducts = useMemo(() => products.filter((p) => p.category === "sneaker"), [products]);
  const pokemonProducts = useMemo(() => products.filter((p) => p.category === "pokemon"), [products]);

  const filtered = useMemo(() => {
    let list = mode === "sneakers" ? sneakerProducts : pokemonProducts;

    // Sub-filters
    if (mode === "sneakers" && sneakerFilter !== "all") {
      list = list.filter((p) => getSneakerCondition(p) === sneakerFilter);
    }
    if (mode === "pokemon" && pokemonFilter !== "all") {
      list = list.filter((p) => getPokemonSubType(p) === pokemonFilter);
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
  }, [mode, sneakerProducts, pokemonProducts, sneakerFilter, pokemonFilter, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // Reset page on filter changes
  useEffect(() => { setCurrentPage(1); }, [search, mode, sneakerFilter, pokemonFilter]);

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

  const refreshProducts = useCallback(async () => {
    try {
      const data = await getGroupedProducts();
      setProducts(data);
    } catch {
      // silent
    }
  }, []);

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName: deleteTarget.name }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      refreshProducts();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-14 w-80" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all your sneakers and Pokemon products
          </p>
        </div>
        <button
          onClick={() => mode === "sneakers" ? setAddSneakerOpen(true) : setAddPokemonOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          {mode === "sneakers" ? "Add Sneaker" : "Add Pokemon"}
        </button>
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("sneakers")}
          className={cn(
            "flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all border-2",
            mode === "sneakers"
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Footprints className="h-5 w-5" />
          Sneakers
          <Badge variant="secondary" className="ml-1 text-xs">{sneakerProducts.length}</Badge>
        </button>
        <button
          onClick={() => setMode("pokemon")}
          className={cn(
            "flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all border-2",
            mode === "pokemon"
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Sparkles className="h-5 w-5" />
          Pokemon
          <Badge variant="secondary" className="ml-1 text-xs">{pokemonProducts.length}</Badge>
        </button>
      </div>

      {/* Sub-filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {mode === "sneakers" ? (
          <>
            {(["all", "new", "used"] as SneakerFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setSneakerFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors border",
                  sneakerFilter === f
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                {f === "all" ? "All" : f === "new" ? "New" : "Used"}
              </button>
            ))}
          </>
        ) : (
          <>
            {(["all", "raw", "graded", "sealed"] as PokemonFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setPokemonFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-colors border",
                  pokemonFilter === f
                    ? "bg-primary/15 border-primary/50 text-primary"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </>
        )}

        {/* Search */}
        <div className="relative ml-auto w-full sm:w-auto sm:min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${mode}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[80px]"></th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground transition-colors">
                    Name <SortIcon field="name" />
                  </button>
                </th>
                {mode === "sneakers" ? (
                  <>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => handleSort("variantCount")} className="flex items-center hover:text-foreground transition-colors">
                        Sizes <SortIcon field="variantCount" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condition</th>
                  </>
                ) : (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort("totalQuantity")} className="flex items-center hover:text-foreground transition-colors">
                    Qty <SortIcon field="totalQuantity" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort("averageCost")} className="flex items-center hover:text-foreground transition-colors">
                    Cost <SortIcon field="averageCost" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button onClick={() => handleSort("sellPrice")} className="flex items-center hover:text-foreground transition-colors">
                    Price <SortIcon field="sellPrice" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                        <Package className="h-7 w-7 text-primary" />
                      </div>
                      <p className="text-sm font-medium">
                        {search ? `No ${mode} match your search` : `No ${mode} in inventory yet`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search ? "Try a different search term." : `Add your first ${mode === "sneakers" ? "sneaker" : "Pokemon product"} to get started.`}
                      </p>
                      {!search && (
                        <button
                          onClick={() => mode === "sneakers" ? setAddSneakerOpen(true) : setAddPokemonOpen(true)}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add {mode === "sneakers" ? "Sneaker" : "Pokemon"}
                        </button>
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
                            className={cn(
                              "rounded-lg w-16 h-16",
                              getSneakerCondition(product) !== "new" && mode === "sneakers"
                                ? "object-cover"
                                : "object-contain bg-white p-1"
                            )}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      {mode === "sneakers" ? (
                        <>
                          <td className="px-4 py-3 text-muted-foreground">
                            {product.variantCount} size{product.variantCount !== 1 ? "s" : ""}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs font-medium",
                                getSneakerCondition(product) === "new"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              )}
                            >
                              {getSneakerCondition(product) === "new" ? "New" : "Used"}
                            </Badge>
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs capitalize font-medium",
                              getPokemonSubType(product) === "graded"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : getPokemonSubType(product) === "sealed"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground"
                            )}
                          >
                            {getPokemonSubType(product)}
                          </Badge>
                        </td>
                      )}
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
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs font-medium",
                            product.totalQuantity === 0
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : product.totalQuantity <= 3
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          )}
                        >
                          {product.totalQuantity === 0 ? "Out of Stock" : product.totalQuantity <= 3 ? "Low Stock" : "In Stock"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(product); }}
                          className="rounded p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  </Link>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <p className="text-sm font-medium">
              {search ? `No ${mode} match your search` : `No ${mode} yet`}
            </p>
            {!search && (
              <button
                onClick={() => mode === "sneakers" ? setAddSneakerOpen(true) : setAddPokemonOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add {mode === "sneakers" ? "Sneaker" : "Pokemon"}
              </button>
            )}
          </div>
        ) : (
          paginatedProducts.map((product) => (
            <Link
              key={product.name}
              href={`/admin/products/detail?name=${encodeURIComponent(product.name)}`}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={56}
                  height={56}
                  className={cn(
                    "rounded-lg w-14 h-14 flex-shrink-0",
                    getSneakerCondition(product) !== "new" && mode === "sneakers"
                      ? "object-cover"
                      : "object-contain bg-white p-0.5"
                  )}
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {mode === "sneakers" ? (
                    <>
                      <span className="text-xs text-muted-foreground">{product.variantCount} size{product.variantCount !== 1 ? "s" : ""}</span>
                      <Badge variant="secondary" className={cn("text-[10px] font-medium", getSneakerCondition(product) === "new" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400")}>
                        {getSneakerCondition(product) === "new" ? "New" : "Used"}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="secondary" className={cn("text-[10px] capitalize font-medium", getPokemonSubType(product) === "graded" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : getPokemonSubType(product) === "sealed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground")}>
                      {getPokemonSubType(product)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium">{formatCurrency(product.sellPrice)}</p>
                  <p className={cn("text-xs", product.totalQuantity === 0 ? "text-destructive" : "text-muted-foreground")}>
                    Qty: {product.totalQuantity}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(product); }}
                  className="rounded p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {((safePage - 1) * ITEMS_PER_PAGE) + 1}--{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
          </div>
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Delete Product</h3>
                <p className="text-sm text-muted-foreground">This cannot be undone.</p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? All variants and inventory data will be permanently removed.
            </p>
            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sneaker Modal */}
      <AddSneakerModal
        open={addSneakerOpen}
        onOpenChange={setAddSneakerOpen}
        onSuccess={refreshProducts}
      />

      {/* Add Pokemon Modal */}
      <AddPokemonModal
        open={addPokemonOpen}
        onOpenChange={setAddPokemonOpen}
        onSuccess={refreshProducts}
      />
    </div>
  );
}

// ─── Add Sneaker Modal ───

function AddSneakerModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [form, setForm] = useState({
    name: "",
    brand: "",
    sku: "",
    size: "",
    condition: "new" as "new" | "used_like_new" | "used_good" | "used_fair",
    cost: "",
    price: "",
    quantity: "1",
    sellerName: "",
    paymentMethod: "",
  });

  const resetForm = () => {
    setBarcode("");
    setForm({ name: "", brand: "", sku: "", size: "", condition: "new", cost: "", price: "", quantity: "1", sellerName: "", paymentMethod: "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.price) {
      toast.error("Price is required");
      return;
    }
    setSaving(true);
    try {
      const result = await createProduct({
        name: form.name.trim(),
        brand: form.brand || null,
        sku: form.sku || null,
        size: form.size || null,
        condition: form.condition,
        cost: form.cost ? parseFloat(form.cost) : null,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 1,
        tags: ["sneaker"],
        images: [],
        is_active: true,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Sneaker added to inventory");
        resetForm();
        onOpenChange(false);
        onSuccess();
      }
    } catch {
      toast.error("Failed to add sneaker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Footprints className="h-5 w-5 text-primary" />
            Add Sneaker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Barcode scan */}
          <div>
            <Label>Barcode Scan</Label>
            <div className="relative mt-1">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Scan barcode or enter UPC..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Scan a barcode to auto-fill, or enter details manually below</p>
          </div>

          <div className="h-px bg-border" />

          {/* Manual entry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input
                className="mt-1"
                placeholder="Nike Air Jordan 1 Retro High OG"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Brand</Label>
              <Input
                className="mt-1"
                placeholder="Nike"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              />
            </div>
            <div>
              <Label>SKU</Label>
              <Input
                className="mt-1"
                placeholder="DZ5485-612"
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </div>
            <div>
              <Label>Size</Label>
              <Input
                className="mt-1"
                placeholder="10.5"
                value={form.size}
                onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              />
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v as typeof f.condition }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used_like_new">Preowned</SelectItem>
                  <SelectItem value="used_good">Used - Good</SelectItem>
                  <SelectItem value="used_fair">Used - Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cost</Label>
              <Input
                className="mt-1"
                type="number"
                placeholder="120.00"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
            <div>
              <Label>Price *</Label>
              <Input
                className="mt-1"
                type="number"
                placeholder="180.00"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                className="mt-1"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
          </div>

          {/* Used sneaker: photo upload note */}
          {form.condition !== "new" && (
            <div>
              <Label>Photos</Label>
              <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Upload photos of used sneaker</p>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Walk-in buy fields */}
          <details className="group">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Walk-in purchase details (optional)
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>Seller Name</Label>
                <Input
                  className="mt-1"
                  placeholder="Customer name"
                  value={form.sellerName}
                  onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </details>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving..." : "Add to Inventory"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Pokemon Modal ───

function AddPokemonModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [cardSearch, setCardSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "raw" as "raw" | "graded" | "sealed",
    grade: "",
    gradingCompany: "",
    certNumber: "",
    cost: "",
    price: "",
    quantity: "1",
    sellerName: "",
    paymentMethod: "",
  });

  const resetForm = () => {
    setCardSearch("");
    setForm({ name: "", description: "", type: "raw", grade: "", gradingCompany: "", certNumber: "", cost: "", price: "", quantity: "1", sellerName: "", paymentMethod: "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.price) {
      toast.error("Price is required");
      return;
    }
    setSaving(true);
    try {
      const tags = ["pokemon", form.type];
      const result = await createProduct({
        name: form.name.trim(),
        brand: "Pokemon TCG",
        description: form.description || null,
        cost: form.cost ? parseFloat(form.cost) : null,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 1,
        tags,
        images: [],
        is_active: true,
        condition: "new",
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Pokemon product added to inventory");
        resetForm();
        onOpenChange(false);
        onSuccess();
      }
    } catch {
      toast.error("Failed to add Pokemon product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add Pokemon Product
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Card search */}
          <div>
            <Label>Search Pokemon TCG</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type a card name to search..."
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Search for a card, or enter details manually below</p>
          </div>

          <div className="h-px bg-border" />

          {/* Manual entry */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input
                className="mt-1"
                placeholder="Charizard VMAX Secret Rare"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                className="mt-1"
                placeholder="Set, card number, details..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as typeof f.type }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw Card</SelectItem>
                  <SelectItem value="graded">Graded Card</SelectItem>
                  <SelectItem value="sealed">Sealed Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                className="mt-1"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>

            {/* Graded fields */}
            {form.type === "graded" && (
              <>
                <div>
                  <Label>Grading Company</Label>
                  <Select value={form.gradingCompany} onValueChange={(v) => setForm((f) => ({ ...f, gradingCompany: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PSA">PSA</SelectItem>
                      <SelectItem value="BGS">BGS</SelectItem>
                      <SelectItem value="CGC">CGC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grade</Label>
                  <Input
                    className="mt-1"
                    placeholder="10"
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Cert Number</Label>
                  <Input
                    className="mt-1"
                    placeholder="Certification number"
                    value={form.certNumber}
                    onChange={(e) => setForm((f) => ({ ...f, certNumber: e.target.value }))}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Cost</Label>
              <Input
                className="mt-1"
                type="number"
                placeholder="50.00"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              />
            </div>
            <div>
              <Label>Price *</Label>
              <Input
                className="mt-1"
                type="number"
                placeholder="89.99"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <Label>Photo</Label>
            <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <div className="text-center">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Upload product photo</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Walk-in buy fields */}
          <details className="group">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Walk-in purchase details (optional)
            </summary>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <Label>Seller Name</Label>
                <Input
                  className="mt-1"
                  placeholder="Customer name"
                  value={form.sellerName}
                  onChange={(e) => setForm((f) => ({ ...f, sellerName: e.target.value }))}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </details>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "Saving..." : "Add to Inventory"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
