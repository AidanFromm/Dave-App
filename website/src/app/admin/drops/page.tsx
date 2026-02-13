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
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

interface Drop {
  id: string;
  title: string;
  description: string | null;
  drop_date: string;
  image_url: string | null;
  product_id: string | null;
  is_active: boolean;
  notify_count: number;
  subscriber_count: number;
  products: { id: string; name: string; price: number; images: string[] } | null;
  created_at: string;
}

function CreateDropModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/admin/products")
        .then((r) => r.json())
        .then((d) => setProducts(d.products ?? []))
        .catch(() => {});
    }
  }, [open]);

  const filteredProducts = products.filter(
    (p: any) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!title || !date || !time) {
      toast.error("Title, date, and time are required");
      return;
    }
    setSubmitting(true);
    try {
      const dropDate = new Date(`${date}T${time}`).toISOString();
      const res = await fetch("/api/admin/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          dropDate,
          productId: productId || null,
          imageUrl: imageUrl || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Drop created!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setDate("");
      setTime("");
      setImageUrl("");
      setProductId("");
      onCreated();
    } catch {
      toast.error("Failed to create drop");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Drop
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Create New Drop
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Air Jordan 4 Retro 'Bred'" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Details about this drop..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Drop Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Drop Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Image URL (optional)</Label>
            <Input placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Link to Product (optional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {productSearch && (
              <div className="max-h-32 overflow-y-auto rounded-lg border">
                {filteredProducts.slice(0, 5).map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setProductId(p.id); setProductSearch(p.name); }}
                    className={cn(
                      "flex w-full items-center justify-between p-2 text-sm hover:bg-muted",
                      productId === p.id && "bg-primary/10"
                    )}
                  >
                    <span className="truncate">{p.name}</span>
                    {productId === p.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSubmit} disabled={!title || !date || !time || submitting} className="w-full">
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
            Create Drop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDropsPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "past">("all");

  const loadDrops = async () => {
    try {
      const res = await fetch("/api/admin/drops");
      if (res.ok) {
        const data = await res.json();
        setDrops(data.drops ?? []);
      }
    } catch {
      toast.error("Failed to load drops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrops(); }, []);

  const handleToggle = async (drop: Drop) => {
    try {
      const res = await fetch("/api/admin/drops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: drop.id, isActive: !drop.is_active }),
      });
      if (!res.ok) throw new Error();
      setDrops((prev) => prev.map((d) => (d.id === drop.id ? { ...d, is_active: !d.is_active } : d)));
      toast.success("Drop status updated");
    } catch {
      toast.error("Failed to update drop");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this drop?")) return;
    try {
      const res = await fetch("/api/admin/drops", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setDrops((prev) => prev.filter((d) => d.id !== id));
      toast.success("Drop deleted");
    } catch {
      toast.error("Failed to delete drop");
    }
  };

  const now = new Date();
  const getStatus = (d: Drop) => {
    if (!d.is_active) return "inactive";
    if (new Date(d.drop_date) > now) return "upcoming";
    return "live";
  };

  const filtered = drops.filter((d) => {
    if (filter === "all") return true;
    const status = getStatus(d);
    if (filter === "upcoming") return status === "upcoming";
    if (filter === "live") return status === "live";
    if (filter === "past") return status === "inactive";
    return true;
  });

  const stats = {
    total: drops.length,
    upcoming: drops.filter((d) => d.is_active && new Date(d.drop_date) > now).length,
    live: drops.filter((d) => d.is_active && new Date(d.drop_date) <= now).length,
    subscribers: drops.reduce((s, d) => s + (d.subscriber_count || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            Drop Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Schedule and manage product drops</p>
        </div>
        <CreateDropModal onCreated={loadDrops} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Drops</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          <p className="text-2xl font-bold mt-1 text-blue-500">{stats.upcoming}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Live</p>
          <p className="text-2xl font-bold mt-1 text-green-500">{stats.live}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Subscribers</p>
          <p className="text-2xl font-bold mt-1 text-primary">{stats.subscribers}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drops</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="past">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No Drops Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a drop to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((drop) => {
            const status = getStatus(drop);
            return (
              <div
                key={drop.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                    {(drop.image_url || drop.products?.images?.[0]) ? (
                      <Image
                        src={drop.image_url || drop.products!.images[0]}
                        alt={drop.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Flame className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold line-clamp-1">{drop.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {drop.products && (
                        <span className="text-sm text-muted-foreground">{drop.products.name}</span>
                      )}
                      <Badge
                        variant={status === "live" ? "default" : status === "upcoming" ? "secondary" : "outline"}
                        className={cn(
                          status === "live" && "bg-green-500",
                          status === "upcoming" && "bg-blue-500 text-white"
                        )}
                      >
                        {status === "live" ? "Live" : status === "upcoming" ? "Upcoming" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(drop.drop_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{drop.subscriber_count || 0} subscribers</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggle(drop)}>
                    {drop.is_active ? (
                      <><X className="mr-1 h-3 w-3" /> Deactivate</>
                    ) : (
                      <><Check className="mr-1 h-3 w-3" /> Activate</>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(drop.id)}
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
  );
}
