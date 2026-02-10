"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Flame,
  Search,
  Check,
  X,
  Mail,
  ChevronDown,
  Loader2,
  Sparkles,
  Trash2
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

interface Drop {
  id: string;
  product: Product;
  dropDate: Date;
  status: "scheduled" | "live" | "ended";
  notifyCount: number;
}

interface Subscriber {
  id: string;
  email: string;
  dropId: string;
  productName: string;
  createdAt: Date;
}

function ScheduleDropModal({ 
  products, 
  onSchedule 
}: { 
  products: Product[]; 
  onSchedule: (productId: string, date: Date) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedProduct || !date || !time) {
      toast.error("Please fill all fields");
      return;
    }

    setSubmitting(true);
    try {
      const dropDate = new Date(`${date}T${time}`);
      await onSchedule(selectedProduct, dropDate);
      setOpen(false);
      setSelectedProduct("");
      setDate("");
      setTime("");
      toast.success("Drop scheduled successfully!");
    } catch {
      toast.error("Failed to schedule drop");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Drop
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Schedule New Drop
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Search */}
          <div className="space-y-2">
            <Label>Select Product</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Product list */}
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No products found
                </div>
              ) : (
                filteredProducts.slice(0, 10).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProduct(product.id)}
                    className={cn(
                      "flex w-full items-center gap-3 p-3 text-left hover:bg-muted transition-colors",
                      selectedProduct === product.id && "bg-primary/10"
                    )}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Sparkles className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(product.price)}
                        {product.size && ` • Size ${product.size}`}
                      </p>
                    </div>
                    {selectedProduct === product.id && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected product preview */}
          {selectedProductData && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium text-primary">Selected:</p>
              <p className="font-semibold mt-1">{selectedProductData.name}</p>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Drop Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Drop Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!selectedProduct || !date || !time || submitting}
            className="w-full"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Schedule Drop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SubscribersModal({ subscribers }: { subscribers: Subscriber[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          View List ({subscribers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notification Subscribers
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {subscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-2">No subscribers yet</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2">
              {subscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{sub.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Subscribed {sub.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "scheduled" | "live" | "ended">("all");

  useEffect(() => {
    async function loadData() {
      try {
        // Load products
        const productsRes = await fetch("/api/admin/products");
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products ?? []);
          
          // Get drops from products with is_drop=true
          const dropsData: Drop[] = (data.products ?? [])
            .filter((p: Product) => p.is_drop)
            .map((p: Product) => {
              const dropDate = p.drop_date ? new Date(p.drop_date) : new Date();
              const now = new Date();
              let status: "scheduled" | "live" | "ended";
              
              if (dropDate > now) {
                status = "scheduled";
              } else if (p.quantity > 0) {
                status = "live";
              } else {
                status = "ended";
              }

              return {
                id: p.id,
                product: p,
                dropDate,
                status,
                notifyCount: Math.floor(Math.random() * 200) + 10, // TODO: Real count
              };
            });

          setDrops(dropsData);
        }

        // Load subscribers
        const subsRes = await fetch("/api/admin/drop-subscribers");
        if (subsRes.ok) {
          const data = await subsRes.json();
          setSubscribers(
            (data.subscribers ?? []).map((s: { id: string; email: string; drop_id: string; product_name: string; created_at: string }) => ({
              ...s,
              dropId: s.drop_id,
              productName: s.product_name,
              createdAt: new Date(s.created_at),
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load drops data", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleScheduleDrop = async (productId: string, dropDate: Date) => {
    const res = await fetch("/api/admin/products/drop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, dropDate: dropDate.toISOString() }),
    });

    if (!res.ok) throw new Error();

    // Add to local state
    const product = products.find((p) => p.id === productId);
    if (product) {
      setDrops((prev) => [
        ...prev,
        {
          id: productId,
          product,
          dropDate,
          status: "scheduled",
          notifyCount: 0,
        },
      ]);
    }
  };

  const handleToggleDropStatus = async (drop: Drop) => {
    try {
      const res = await fetch("/api/admin/products/drop", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId: drop.product.id, 
          isDrop: drop.status === "ended" 
        }),
      });

      if (res.ok) {
        setDrops((prev) =>
          prev.map((d) =>
            d.id === drop.id
              ? { ...d, status: d.status === "ended" ? "live" : "ended" }
              : d
          )
        );
        toast.success("Drop status updated");
      }
    } catch {
      toast.error("Failed to update drop status");
    }
  };

  const handleRemoveDrop = async (dropId: string) => {
    try {
      const res = await fetch("/api/admin/products/drop", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: dropId }),
      });

      if (res.ok) {
        setDrops((prev) => prev.filter((d) => d.id !== dropId));
        toast.success("Drop removed");
      }
    } catch {
      toast.error("Failed to remove drop");
    }
  };

  const filteredDrops = drops.filter((d) => {
    if (filter === "all") return true;
    return d.status === filter;
  });

  const stats = {
    total: drops.length,
    scheduled: drops.filter((d) => d.status === "scheduled").length,
    live: drops.filter((d) => d.status === "live").length,
    subscribers: subscribers.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            Drops Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage product drops
          </p>
        </div>
        <ScheduleDropModal products={products.filter(p => !p.is_drop)} onSchedule={handleScheduleDrop} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Drops</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Scheduled</p>
          <p className="text-2xl font-bold mt-1 text-blue-500">{stats.scheduled}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Live Now</p>
          <p className="text-2xl font-bold mt-1 text-green-500">{stats.live}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Subscribers</p>
          <p className="text-2xl font-bold mt-1 text-primary">{stats.subscribers}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drops</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>

        <SubscribersModal subscribers={subscribers} />
      </div>

      {/* Drops List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filteredDrops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No Drops Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule a drop to get started
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrops.map((drop) => (
            <div
              key={drop.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              {/* Product info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                  {drop.product.images?.[0] ? (
                    <Image
                      src={drop.product.images[0]}
                      alt={drop.product.name}
                      fill
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Sparkles className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold line-clamp-1">{drop.product.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm font-medium">
                      {formatCurrency(drop.product.price)}
                    </span>
                    <Badge
                      variant={
                        drop.status === "live"
                          ? "default"
                          : drop.status === "scheduled"
                          ? "secondary"
                          : "outline"
                      }
                      className={cn(
                        drop.status === "live" && "bg-green-500",
                        drop.status === "scheduled" && "bg-blue-500 text-white"
                      )}
                    >
                      {drop.status.charAt(0).toUpperCase() + drop.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Drop date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {drop.dropDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>

              {/* Notify count */}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{drop.notifyCount} waiting</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleDropStatus(drop)}
                >
                  {drop.status === "ended" ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Reactivate
                    </>
                  ) : (
                    <>
                      <X className="mr-1 h-3 w-3" />
                      End Drop
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveDrop(drop.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
