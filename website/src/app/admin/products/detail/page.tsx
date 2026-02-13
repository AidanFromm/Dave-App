"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  getProductVariants,
  updateProductVariant,
  addProductVariant,
  type ProductVariant,
} from "@/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency }  from "@/lib/utils";
import { CONDITION_LABELS, type ProductCondition } from "@/types/product";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Package } from "lucide-react";

interface EditForm {
  price: string;
  cost: string;
  quantity: string;
  condition: ProductCondition;
  size: string;
}

interface AddForm {
  size: string;
  quantity: string;
  cost: string;
  price: string;
  condition: ProductCondition;
}

export default function ProductDetailPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
      <ProductDetailPage />
    </Suspense>
  );
}

function ProductDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productName = decodeURIComponent(searchParams.get("name") ?? "");

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    price: "", cost: "", quantity: "", condition: "new", size: "",
  });
  const [saving, setSaving] = useState(false);

  // Add state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({
    size: "", quantity: "1", cost: "", price: "", condition: "new",
  });
  const [adding, setAdding] = useState(false);

  const fetchVariants = useCallback(async () => {
    try {
      const data = await getProductVariants(productName);
      setVariants(data);
    } catch {
      toast.error("Failed to load product variants");
    } finally {
      setLoading(false);
    }
  }, [productName]);

  useEffect(() => {
    fetchVariants();
  }, [fetchVariants]);

  // Computed stats
  const totalQuantity = variants.reduce((s, v) => s + v.quantity, 0);
  const costsWithQty = variants.filter((v) => v.cost != null && v.cost > 0);
  const totalCostUnits = costsWithQty.reduce((s, v) => s + v.quantity, 0);
  const averageCost = totalCostUnits > 0
    ? costsWithQty.reduce((s, v) => s + (v.cost ?? 0) * v.quantity, 0) / totalCostUnits
    : 0;
  const totalValue = variants.reduce((s, v) => s + v.quantity * (v.cost ?? v.price), 0);
  const firstImage = variants.find((v) => v.images?.[0])?.images[0] ?? null;

  const openEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setEditForm({
      price: String(variant.price),
      cost: String(variant.cost ?? ""),
      quantity: String(variant.quantity),
      condition: variant.condition,
      size: variant.size ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVariant) return;
    setSaving(true);
    try {
      await updateProductVariant(editingVariant.id, {
        price: parseFloat(editForm.price),
        cost: editForm.cost ? parseFloat(editForm.cost) : undefined,
        quantity: parseInt(editForm.quantity, 10),
        condition: editForm.condition,
        size: editForm.size || undefined,
      });
      toast.success("Variant updated");
      setEditingVariant(null);
      fetchVariants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!addForm.size || !addForm.price) {
      toast.error("Size and price are required");
      return;
    }
    setAdding(true);
    try {
      await addProductVariant({
        name: productName,
        size: addForm.size,
        quantity: parseInt(addForm.quantity, 10) || 1,
        cost: parseFloat(addForm.cost) || 0,
        price: parseFloat(addForm.price),
        condition: addForm.condition,
      });
      toast.success("Variant added");
      setShowAdd(false);
      setAddForm({ size: "", quantity: "1", cost: "", price: "", condition: "new" });
      fetchVariants();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add variant");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/inventory")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          {firstImage ? (
            <Image src={firstImage} alt={productName} width={48} height={48} className="rounded-lg object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{productName}</h1>
            <p className="text-sm text-muted-foreground">
              {variants.length} variant{variants.length !== 1 ? "s" : ""} | {totalQuantity} total units
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{averageCost > 0 ? formatCurrency(averageCost) : "--"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Units in Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalQuantity}</p>
          </CardContent>
        </Card>
      </div>

      {/* Variants Table */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Size Variants</h2>
        <Button onClick={() => setShowAdd(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Variant
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Size</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Condition</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quantity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cost Paid</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sell Price</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {variants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No variants found. Add one to get started.
                  </td>
                </tr>
              ) : (
                variants.map((v) => (
                  <tr key={v.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{v.size ?? "--"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {CONDITION_LABELS[v.condition]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={v.quantity === 0 ? "text-destructive font-bold" : ""}>
                        {v.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.cost != null && v.cost > 0 ? formatCurrency(v.cost) : "--"}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(v.price)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(v.quantity * (v.cost ?? v.price))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {v.sku ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingVariant} onOpenChange={(open) => !open && setEditingVariant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Variant - Size {editingVariant?.size ?? "N/A"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Size</Label>
                <Input value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={editForm.condition} onValueChange={(v) => setEditForm({ ...editForm, condition: v as ProductCondition })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={0} value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Cost Paid</Label>
                <Input type="number" step="0.01" min={0} value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })} />
              </div>
              <div>
                <Label>Sell Price</Label>
                <Input type="number" step="0.01" min={0} value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVariant(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Variant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Size</Label>
                <Input placeholder="e.g. 10, 10.5" value={addForm.size} onChange={(e) => setAddForm({ ...addForm, size: e.target.value })} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={addForm.condition} onValueChange={(v) => setAddForm({ ...addForm, condition: v as ProductCondition })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={1} value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} />
              </div>
              <div>
                <Label>Cost Paid</Label>
                <Input type="number" step="0.01" min={0} placeholder="0.00" value={addForm.cost} onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })} />
              </div>
              <div>
                <Label>Sell Price</Label>
                <Input type="number" step="0.01" min={0} placeholder="0.00" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding}>
              {adding ? "Adding..." : "Add Variant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
