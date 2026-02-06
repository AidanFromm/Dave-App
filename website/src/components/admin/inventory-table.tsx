"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Product, formatCurrency, CONDITION_LABELS } from "@/types/product";
import { adjustStock, deleteProduct } from "@/actions/admin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StockAdjustModal } from "./stock-adjust-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Package,
  Trash2,
} from "lucide-react";

type SortField = "name" | "price" | "quantity";
type SortDirection = "asc" | "desc";

interface InventoryTableProps {
  products: Product[];
  onRefresh?: () => void;
}

function getStockBadge(qty: number) {
  if (qty === 0) {
    return (
      <Badge variant="outline" className="bg-gray-900 text-white dark:bg-gray-700 border-gray-900 dark:border-gray-600">
        Out
      </Badge>
    );
  }
  if (qty <= 2) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-800">
        Critical
      </Badge>
    );
  }
  if (qty <= 10) {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800">
        Low
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800">
      In Stock
    </Badge>
  );
}

export function InventoryTable({ products, onRefresh }: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField]
  );

  const filteredAndSorted = useMemo(() => {
    let filtered = products;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
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
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [products, search, sortField, sortDirection]);

  const startEditing = useCallback((product: Product) => {
    setEditingId(product.id);
    setEditValue(String(product.quantity));
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const saveEditing = useCallback(
    async (product: Product) => {
      const newQty = parseInt(editValue, 10);
      if (isNaN(newQty) || newQty < 0) {
        toast.error("Please enter a valid non-negative number");
        return;
      }

      const change = newQty - product.quantity;
      if (change === 0) {
        cancelEditing();
        return;
      }

      try {
        await adjustStock(product.id, change, "adjustment", "Inline quantity edit");
        toast.success(
          `Updated ${product.name}: ${product.quantity} -> ${newQty}`
        );
        cancelEditing();
        onRefresh?.();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update stock"
        );
      }
    },
    [editValue, cancelEditing, onRefresh]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, onRefresh]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[60px]">
                  Image
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  SKU
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Size
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Condition
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("quantity")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Qty
                    <SortIcon field="quantity" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  <button
                    onClick={() => handleSort("price")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Price
                    <SortIcon field="price" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    {search
                      ? "No products match your search."
                      : "No products found."}
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                      {product.name}
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {product.sku ?? "---"}
                    </td>

                    {/* Size */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.size ?? "---"}
                    </td>

                    {/* Condition */}
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {CONDITION_LABELS[product.condition]}
                      </Badge>
                    </td>

                    {/* Qty - Inline editable */}
                    <td className="px-4 py-3">
                      {editingId === product.id ? (
                        <Input
                          ref={editInputRef}
                          type="number"
                          min={0}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEditing(product);
                            } else if (e.key === "Escape") {
                              cancelEditing();
                            }
                          }}
                          onBlur={() => cancelEditing()}
                          className="w-20 h-8 text-sm"
                        />
                      ) : (
                        <button
                          onClick={() => startEditing(product)}
                          className="font-mono text-sm hover:bg-muted px-2 py-1 rounded cursor-pointer transition-colors"
                          title="Click to edit quantity"
                        >
                          {product.quantity}
                        </button>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(product.price)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {getStockBadge(product.quantity)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustProduct(product)}
                        >
                          Adjust
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteTarget(product)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjust Modal */}
      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          open={!!adjustProduct}
          onOpenChange={(open) => {
            if (!open) setAdjustProduct(null);
          }}
          onAdjusted={() => {
            setAdjustProduct(null);
            onRefresh?.();
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
