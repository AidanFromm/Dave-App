"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Flame,
  Search,
  X,
  Loader2,
  Trash2,
  Pencil,
  Package,
  TrendingUp,
  StopCircle,
  Tag,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { formatCurrency } from "@/types/product";

/* ── Status helpers ── */
type DealStatus = "live" | "sold_out" | "ended";

function getDealStatus(p: Product): DealStatus {
  const qty = p.drop_quantity;
  const sold = p.drop_sold_count ?? 0;
  if (qty !== null && qty !== undefined && sold >= qty) return "sold_out";
  const endsAt = p.drop_ends_at ? new Date(p.drop_ends_at) : null;
  if (endsAt && new Date() >= endsAt) return "ended";
  return "live";
}

const STATUS_BADGE: Record<DealStatus, { label: string; classes: string }> = {
  live: { label: "Live", classes: "bg-green-100 text-green-700 border-green-200" },
  sold_out: { label: "Sold Out", classes: "bg-red-100 text-red-700 border-red-200" },
  ended: { label: "Ended", classes: "bg-gray-100 text-gray-600 border-gray-200" },
};

/* ── Create / Edit Panel (inline, not a modal) ── */
function DealForm({
  editProduct,
  onDone,
  onCancel,
}: {
  editProduct?: Product | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(editProduct ?? null);
  const [salePrice, setSalePrice] = useState(editProduct?.drop_price?.toString() ?? "");
  const [limitQty, setLimitQty] = useState(editProduct?.drop_quantity?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!editProduct) {
      fetch("/api/admin/products")
        .then((r) => r.json())
        .then((d) => setProducts((d.products ?? []).filter((p: Product) => !p.is_drop)))
        .catch(() => {});
    }
  }, [editProduct]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const product = editProduct ?? selected;
    if (!product) { toast.error("Select a product first"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products/drop", {
        method: editProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          dropPrice: salePrice ? parseFloat(salePrice) : null,
          dropQuantity: limitQty ? parseInt(limitQty) : null,
          dropStartsAt: new Date().toISOString(),
          dropEndsAt: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success(editProduct ? "Deal updated" : "Deal is now live!");
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-[#FB4F14]" />
          {editProduct ? "Edit Deal" : "New Daily Deal"}
        </h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Step 1: Product Selection */}
      {!editProduct && !selected && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventory to add a deal..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="pl-10"
          />
          {showDropdown && search && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border bg-card shadow-lg">
              {filtered.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelected(p); setSearch(""); setShowDropdown(false); }}
                  className="flex w-full items-center gap-3 p-3 text-sm hover:bg-accent transition-colors text-left"
                >
                  <div className="relative h-10 w-10 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {p.images?.[0] ? (
                      <Image src={p.images[0]} alt="" fill className="object-contain p-1" />
                    ) : (
                      <div className="flex h-full items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(p.price)} - {p.quantity} in stock</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No matching products</p>}
            </div>
          )}
        </div>
      )}

      {/* Selected Product Preview */}
      {(selected || editProduct) && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-accent/30">
          <div className="relative h-12 w-12 rounded bg-muted flex-shrink-0 overflow-hidden">
            {(selected || editProduct)?.images?.[0] ? (
              <Image src={(selected || editProduct)!.images![0]} alt="" fill className="object-contain p-1" />
            ) : (
              <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{(selected || editProduct)!.name}</p>
            <p className="text-xs text-muted-foreground">
              Regular: {formatCurrency((selected || editProduct)!.price)} - {(selected || editProduct)!.quantity} in stock
            </p>
          </div>
          {!editProduct && (
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-7 w-7 flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Price + Quantity */}
      {(selected || editProduct) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Sale Price
              <span className="text-[10px] font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="pl-7"
              />
            </div>
            {salePrice && selected && parseFloat(salePrice) < selected.price && (
              <p className="text-[10px] text-green-600 mt-1">
                {Math.round((1 - parseFloat(salePrice) / selected.price) * 100)}% off
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Hash className="h-3 w-3" />
              Limit Qty
              <span className="text-[10px] font-normal">(optional)</span>
            </label>
            <Input
              type="number"
              min="1"
              placeholder="Unlimited"
              value={limitQty}
              onChange={(e) => setLimitQty(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Action */}
      {(selected || editProduct) && (
        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flame className="mr-2 h-4 w-4" />}
            {editProduct ? "Save Changes" : "Go Live"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function AdminDropsPage() {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products/drop");
      if (res.ok) {
        const data = await res.json();
        setDeals(data.products ?? []);
      }
    } catch {
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDeals(); }, [loadDeals]);

  const handleEndDeal = async (product: Product) => {
    if (!confirm(`End deal for "${product.name}"? It returns to regular inventory.`)) return;
    try {
      const res = await fetch("/api/admin/products/drop", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Deal ended");
      loadDeals();
    } catch {
      toast.error("Failed to end deal");
    }
  };

  const liveDeals = deals.filter((d) => getDealStatus(d) === "live");
  const pastDeals = deals.filter((d) => getDealStatus(d) !== "live");
  const revenue = deals.reduce((sum, d) => sum + (d.drop_price ?? d.price) * (d.drop_sold_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Deals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Put products on sale instantly. Deals show in a special section on the shop.
          </p>
        </div>
        {!showForm && !editingProduct && (
          <Button onClick={() => setShowForm(true)} className="bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold mt-1">{liveDeals.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Sold</p>
          <p className="text-2xl font-bold mt-1">{deals.reduce((s, d) => s + (d.drop_sold_count ?? 0), 0)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
          <p className="text-2xl font-bold mt-1 text-[#FB4F14]">{formatCurrency(revenue)}</p>
        </div>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editingProduct) && (
        <DealForm
          editProduct={editingProduct}
          onDone={() => { setShowForm(false); setEditingProduct(null); loadDeals(); }}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}

      {/* Live Deals */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : deals.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Flame className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <h3 className="mt-3 font-semibold">No Deals Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a product, set a sale price, and it goes live instantly.
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Deal
          </Button>
        </div>
      ) : (
        <>
          {liveDeals.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live Now
              </h2>
              <div className="space-y-2">
                {liveDeals.map((product) => (
                  <DealCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onEnd={() => handleEndDeal(product)}
                  />
                ))}
              </div>
            </div>
          )}

          {pastDeals.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Past Deals</h2>
              <div className="space-y-2">
                {pastDeals.map((product) => (
                  <DealCard
                    key={product.id}
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onEnd={() => handleEndDeal(product)}
                    past
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Deal Card ── */
function DealCard({
  product,
  onEdit,
  onEnd,
  past,
}: {
  product: Product;
  onEdit: () => void;
  onEnd: () => void;
  past?: boolean;
}) {
  const status = getDealStatus(product);
  const badge = STATUS_BADGE[status];
  const displayPrice = product.drop_price ?? product.price;
  const sold = product.drop_sold_count ?? 0;
  const remaining = product.drop_quantity != null ? Math.max(0, product.drop_quantity - sold) : null;

  return (
    <div className={`flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors ${past ? "opacity-60" : ""}`}>
      {/* Image */}
      <div className="relative h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
        {product.images?.[0] ? (
          <Image src={product.images[0]} alt={product.name} fill className="object-contain p-1.5" />
        ) : (
          <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate">{product.name}</h3>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge.classes}`}>{badge.label}</Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="font-semibold text-[#FB4F14]">{formatCurrency(displayPrice)}</span>
          {product.drop_price != null && product.drop_price !== product.price && (
            <span className="line-through">{formatCurrency(product.price)}</span>
          )}
          <span className="text-muted-foreground/50">|</span>
          <span>{sold} sold</span>
          {remaining !== null && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span>{remaining} left</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {!past ? (
          <Button variant="ghost" size="icon" onClick={onEnd} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
            <StopCircle className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={onEnd} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
