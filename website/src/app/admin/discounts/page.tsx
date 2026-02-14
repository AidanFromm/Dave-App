"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Tag, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatDateShort } from "@/lib/utils";

interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order: number;
  max_uses: number | null;
  uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

function getStatus(d: Discount): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!d.active) return { label: "Inactive", variant: "secondary" };
  if (d.expires_at && new Date(d.expires_at) < new Date()) return { label: "Expired", variant: "destructive" };
  if (d.max_uses !== null && d.uses >= d.max_uses) return { label: "Maxed Out", variant: "destructive" };
  return { label: "Active", variant: "default" };
}

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMinOrder, setFormMinOrder] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formExpiry, setFormExpiry] = useState("");

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts");
      const data = await res.json();
      setDiscounts(data.discounts || []);
    } catch {
      toast.error("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const handleCreate = async () => {
    if (!formCode || !formValue) {
      toast.error("Code and value are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode.toUpperCase().trim(),
          type: formType,
          value: parseFloat(formValue),
          min_order: formMinOrder ? parseFloat(formMinOrder) : 0,
          max_uses: formMaxUses ? parseInt(formMaxUses) : null,
          expires_at: formExpiry || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create discount");
        return;
      }
      toast.success("Discount code created");
      setDialogOpen(false);
      setFormCode(""); setFormValue(""); setFormMinOrder(""); setFormMaxUses(""); setFormExpiry("");
      fetchDiscounts();
    } catch {
      toast.error("Failed to create discount");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await fetch("/api/admin/discounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, active } : d)));
      toast.success(active ? "Discount activated" : "Discount deactivated");
    } catch {
      toast.error("Failed to update discount");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this discount code?")) return;
    try {
      await fetch("/api/admin/discounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      toast.success("Discount deleted");
    } catch {
      toast.error("Failed to delete discount");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" />
          Discount Codes ({discounts.length})
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="SAVE20"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as "percentage" | "fixed")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    placeholder={formType === "percentage" ? "20" : "10.00"}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Order ($)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="datetime-local"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Discount Code"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6">
        {discounts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No discount codes yet</p>
            <p className="text-sm mt-1">Create your first promo code above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discounts.map((d) => {
              const status = getStatus(d);
              return (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl border bg-card p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {d.type === "percentage" ? (
                      <Percent className="h-5 w-5 text-primary" />
                    ) : (
                      <DollarSign className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">{d.code}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.type === "percentage" ? `${d.value}% off` : `$${d.value} off`}
                      {d.min_order > 0 && ` · Min $${d.min_order}`}
                      {d.max_uses !== null && ` · ${d.uses}/${d.max_uses} used`}
                      {d.max_uses === null && ` · ${d.uses} used`}
                      {d.expires_at && ` · Expires ${formatDateShort(d.expires_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={d.active}
                      onCheckedChange={(checked) => handleToggle(d.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(d.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
