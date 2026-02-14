"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Calendar,
  Clock,
  Flame,
  Search,
  Check,
  X,
  Loader2,
  Trash2,
  Pencil,
  DollarSign,
  Package,
  TrendingUp,
  StopCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { formatCurrency } from "@/types/product";

type DropStatus = "upcoming" | "live" | "ended" | "sold_out";

function getDropStatus(p: Product): DropStatus {
  const now = new Date();
  const startsAt = p.drop_starts_at ? new Date(p.drop_starts_at) : null;
  const endsAt = p.drop_ends_at ? new Date(p.drop_ends_at) : null;
  const qty = p.drop_quantity;
  const sold = p.drop_sold_count ?? 0;

  if (qty !== null && qty !== undefined && sold >= qty) return "sold_out";
  if (endsAt && now >= endsAt) return "ended";
  if (startsAt && now < startsAt) return "upcoming";
  return "live";
}

const STATUS_CONFIG: Record<DropStatus, { label: string; color: string; bgColor: string }> = {
  upcoming: { label: "Upcoming", color: "text-blue-400", bgColor: "bg-blue-500/15 text-blue-400" },
  live: { label: "Live", color: "text-green-400", bgColor: "bg-green-500/15 text-green-400" },
  ended: { label: "Ended", color: "text-gray-400", bgColor: "bg-gray-500/15 text-gray-400" },
  sold_out: { label: "Sold Out", color: "text-red-400", bgColor: "bg-red-500/15 text-red-400" },
};

interface CreateDropModalProps {
  onCreated: () => void;
  editProduct?: Product | null;
  onClose?: () => void;
}

function CreateDropModal({ onCreated, editProduct, onClose }: CreateDropModalProps) {
  const [open, setOpen] = useState(!!editProduct);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(editProduct ?? null);
  const [dropPrice, setDropPrice] = useState(editProduct?.drop_price?.toString() ?? "");
  const [dropQuantity, setDropQuantity] = useState(editProduct?.drop_quantity?.toString() ?? "");
  const [startDate, setStartDate] = useState(editProduct?.drop_starts_at ? new Date(editProduct.drop_starts_at).toISOString().split("T")[0] : "");
  const [startTime, setStartTime] = useState(editProduct?.drop_starts_at ? new Date(editProduct.drop_starts_at).toTimeString().slice(0, 5) : "");
  const [endDate, setEndDate] = useState(editProduct?.drop_ends_at ? new Date(editProduct.drop_ends_at).toISOString().split("T")[0] : "");
  const [endTime, setEndTime] = useState(editProduct?.drop_ends_at ? new Date(editProduct.drop_ends_at).toTimeString().slice(0, 5) : "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && !editProduct) {
      fetch("/api/admin/products")
        .then((r) => r.json())
        .then((d) => {
          const all = (d.products ?? []) as Product[];
          // Only show non-drop products for selection
          setProducts(all.filter((p: Product) => !p.is_drop));
        })
        .catch(() => {});
    }
  }, [open, editProduct]);

  useEffect(() => {
    if (editProduct) setOpen(true);
  }, [editProduct]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    const product = editProduct ?? selectedProduct;
    if (!product) {
      toast.error("Select a product");
      return;
    }
    if (!startDate || !startTime) {
      toast.error("Start date and time are required");
      return;
    }
    setSubmitting(true);
    try {
      const dropStartsAt = new Date(`${startDate}T${startTime}`).toISOString();
      const dropEndsAt = endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : null;

      const res = await fetch("/api/admin/products/drop", {
        method: editProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          dropPrice: dropPrice ? parseFloat(dropPrice) : null,
          dropQuantity: dropQuantity ? parseInt(dropQuantity) : null,
          dropStartsAt: dropStartsAt,
          dropEndsAt: dropEndsAt,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success(editProduct ? "Drop updated" : "Drop created");
      handleClose();
      onCreated();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save drop");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProduct(null);
    setProductSearch("");
    setDropPrice("");
    setDropQuantity("");
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      {!editProduct && (
        <DialogTrigger asChild>
          <Button className="bg-[#FB4F14] hover:bg-[#FB4F14]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create Drop
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg bg-[#002244] border-[#FB4F14]/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Flame className="h-5 w-5 text-[#FB4F14]" />
            {editProduct ? "Edit Drop" : "Create New Drop"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Product Selection (only for create) */}
          {!editProduct && (
            <div className="space-y-2">
              <Label className="text-gray-300">Select Product</Label>
              {selectedProduct ? (
                <div className="flex items-center gap-3 rounded-lg border border-[#FB4F14]/30 bg-[#FB4F14]/5 p-3">
                  {selectedProduct.images?.[0] && (
                    <Image src={selectedProduct.images[0]} alt="" width={40} height={40} className="rounded object-contain bg-white p-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-400">{formatCurrency(selectedProduct.price)} -- Qty: {selectedProduct.quantity}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedProduct(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10 bg-[#001a33] border-gray-700"
                    />
                  </div>
                  {productSearch && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-700 bg-[#001a33]">
                      {filteredProducts.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setSelectedProduct(p); setProductSearch(""); }}
                          className="flex w-full items-center gap-3 p-2 text-sm hover:bg-[#FB4F14]/10 text-white"
                        >
                          {p.images?.[0] && (
                            <Image src={p.images[0]} alt="" width={32} height={32} className="rounded object-contain bg-white p-0.5" />
                          )}
                          <div className="flex-1 text-left min-w-0">
                            <span className="truncate block">{p.name}</span>
                            <span className="text-xs text-gray-400">{formatCurrency(p.price)} -- Qty: {p.quantity}</span>
                          </div>
                        </button>
                      ))}
                      {filteredProducts.length === 0 && (
                        <p className="p-3 text-sm text-gray-500">No products found</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {editProduct && (
            <div className="flex items-center gap-3 rounded-lg border border-gray-700 p-3">
              {editProduct.images?.[0] && (
                <Image src={editProduct.images[0]} alt="" width={40} height={40} className="rounded object-contain bg-white p-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-white">{editProduct.name}</p>
                <p className="text-xs text-gray-400">Regular price: {formatCurrency(editProduct.price)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Drop Price (optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Special price"
                  value={dropPrice}
                  onChange={(e) => setDropPrice(e.target.value)}
                  className="pl-10 bg-[#001a33] border-gray-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Drop Quantity (optional)</Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="number"
                  placeholder="Limited qty"
                  value={dropQuantity}
                  onChange={(e) => setDropQuantity(e.target.value)}
                  className="pl-10 bg-[#001a33] border-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#001a33] border-gray-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-[#001a33] border-gray-700" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">End Date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-[#001a33] border-gray-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-[#001a33] border-gray-700" />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={(!editProduct && !selectedProduct) || !startDate || !startTime || submitting}
            className="w-full bg-[#FB4F14] hover:bg-[#FB4F14]/90"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
            {editProduct ? "Update Drop" : "Create Drop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDropsPage() {
  const [drops, setDrops] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "ended" | "sold_out">("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadDrops = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products/drop");
      if (res.ok) {
        const data = await res.json();
        setDrops(data.products ?? []);
      }
    } catch {
      toast.error("Failed to load drops");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDrops(); }, [loadDrops]);

  const handleEndDrop = async (product: Product) => {
    if (!confirm(`End drop for "${product.name}"? Remaining stock will return to regular inventory.`)) return;
    try {
      const res = await fetch("/api/admin/products/drop", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Drop ended, product returned to regular inventory");
      loadDrops();
    } catch {
      toast.error("Failed to end drop");
    }
  };

  const now = new Date();
  const filtered = drops.filter((d) => {
    if (filter === "all") return true;
    return getDropStatus(d) === filter;
  });

  const stats = {
    total: drops.length,
    active: drops.filter((d) => getDropStatus(d) === "live").length,
    upcoming: drops.filter((d) => getDropStatus(d) === "upcoming").length,
    revenue: drops.reduce((sum, d) => {
      const price = d.drop_price ?? d.price;
      return sum + price * (d.drop_sold_count ?? 0);
    }, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-[#FB4F14]" />
            Drops Manager
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage exclusive limited drops</p>
        </div>
        <CreateDropModal onCreated={loadDrops} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Drops</p>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Active Now</p>
          </div>
          <p className="text-2xl font-bold mt-1 text-green-500">{stats.active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <p className="text-sm text-muted-foreground">Upcoming</p>
          </div>
          <p className="text-2xl font-bold mt-1 text-blue-500">{stats.upcoming}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#FB4F14]" />
            <p className="text-sm text-muted-foreground">Drop Revenue</p>
          </div>
          <p className="text-2xl font-bold mt-1 text-[#FB4F14]">{formatCurrency(stats.revenue)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drops</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
            <SelectItem value="sold_out">Sold Out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Edit modal */}
      {editingProduct && (
        <CreateDropModal
          onCreated={loadDrops}
          editProduct={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {/* Drop List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Flame className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No Drops Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a drop to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const status = getDropStatus(product);
            const cfg = STATUS_CONFIG[status];
            const remaining = product.drop_quantity != null
              ? Math.max(0, product.drop_quantity - (product.drop_sold_count ?? 0))
              : null;
            const displayPrice = product.drop_price ?? product.price;

            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
              >
                {/* Image + Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                    {product.images?.[0] ? (
                      <Image src={product.images[0]} alt={product.name} fill className="object-contain p-2" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className={cfg.bgColor}>{cfg.label}</Badge>
                      {product.size && (
                        <span className="text-xs text-muted-foreground">Size {product.size}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="text-sm">
                  <span className="font-bold text-[#FB4F14]">{formatCurrency(displayPrice)}</span>
                  {product.drop_price != null && product.drop_price !== product.price && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                  )}
                </div>

                {/* Quantity */}
                <div className="text-sm text-muted-foreground">
                  {remaining !== null ? (
                    <span>
                      <span className="font-mono font-semibold text-foreground">{product.drop_sold_count ?? 0}</span>
                      /{product.drop_quantity} sold
                    </span>
                  ) : (
                    <span className="text-xs">No qty limit</span>
                  )}
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {product.drop_starts_at
                      ? new Date(product.drop_starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                      : "No start"}
                  </div>
                  {product.drop_ends_at && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {new Date(product.drop_ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProduct(product)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  {(status === "live" || status === "upcoming") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                      onClick={() => handleEndDrop(product)}
                    >
                      <StopCircle className="mr-1 h-3 w-3" />
                      End Drop
                    </Button>
                  )}
                  {(status === "ended" || status === "sold_out") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                      onClick={() => handleEndDrop(product)}
                    >
                      <Package className="mr-1 h-3 w-3" />
                      Return to Inventory
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
