"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Check,
  X,
  Loader2,
  ImagePlus,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────
interface PokemonCard {
  id: string;
  name: string;
  number: string;
  rarity: string;
  imageSmall: string;
  imageLarge: string;
  setId: string;
  setName: string;
  setSeries: string;
  setSymbol: string;
  marketPrice: number | null;
}

type CardType = "raw" | "graded" | "sealed";
type RawCondition = "NM" | "LP" | "MP" | "HP" | "DMG";
type GradingCompany = "PSA" | "BGS" | "CGC";
type SealedType = "Booster Box" | "ETB" | "Blister Pack" | "Collection Box" | "Tin" | "Bundle" | "Other";
type ActiveTab = "raw" | "graded" | "sealed";
type SortField = "name" | "selling_price" | "created_at";
type SortDir = "asc" | "desc";
type FilterType = "all" | "raw" | "graded" | "sealed";

interface PokemonInventoryItem {
  id: string;
  product_id: string;
  card_type: CardType;
  name: string;
  set_name: string | null;
  card_number: string | null;
  rarity: string | null;
  condition: RawCondition | null;
  grading_company: GradingCompany | null;
  grade: number | null;
  cert_number: string | null;
  sealed_type: SealedType | null;
  image_url: string | null;
  price_paid: number;
  selling_price: number;
  quantity: number;
  tcgplayer_price: number | null;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────
const RAW_CONDITIONS: RawCondition[] = ["NM", "LP", "MP", "HP", "DMG"];
const CONDITION_LABELS: Record<RawCondition, string> = {
  NM: "Near Mint",
  LP: "Lightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  DMG: "Damaged",
};
const GRADING_COMPANIES: GradingCompany[] = ["PSA", "BGS", "CGC"];
const SEALED_TYPES: SealedType[] = [
  "Booster Box", "ETB", "Blister Pack", "Collection Box", "Tin", "Bundle", "Other",
];
const GRADES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

// ── Card Search Component ──────────────────────────────
function CardSearch({
  onSelect,
}: {
  onSelect: (card: PokemonCard) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.cards ?? []);
      }
    } catch {
      toast.error("Search failed");
    }
    setSearching(false);
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Pokemon cards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="pl-9"
          />
        </div>
        <Button onClick={search} disabled={searching} className="bg-[#FB4F14] hover:bg-[#FB4F14]/90">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto rounded-lg border border-border p-3 bg-[#002244]/20">
          {results.map((card) => (
            <button
              key={card.id}
              onClick={() => onSelect(card)}
              className="group rounded-lg border border-border bg-card p-2 text-left hover:border-[#FB4F14] hover:ring-1 hover:ring-[#FB4F14] transition-all"
            >
              {card.imageSmall ? (
                <Image
                  src={card.imageSmall}
                  alt={card.name}
                  width={120}
                  height={168}
                  className="w-full rounded-md object-contain"
                />
              ) : (
                <div className="aspect-[5/7] bg-muted rounded-md flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <p className="mt-1 text-xs font-medium line-clamp-2">{card.name}</p>
              <p className="text-[10px] text-muted-foreground">{card.setName} #{card.number}</p>
              {card.marketPrice && (
                <p className="text-xs font-bold text-[#FB4F14]">${card.marketPrice.toFixed(2)}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Raw Card Form ──────────────────────────────────
function AddRawCardForm({ onSaved }: { onSaved: () => void }) {
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [condition, setCondition] = useState<RawCondition>("NM");
  const [pricePaid, setPricePaid] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedCard) return toast.error("Select a card first");
    if (!pricePaid || !sellingPrice) return toast.error("Fill in prices");

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pokemon-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_type: "raw",
          name: selectedCard.name,
          set_name: selectedCard.setName,
          card_number: selectedCard.number,
          rarity: selectedCard.rarity,
          image_url: selectedCard.imageLarge || selectedCard.imageSmall,
          condition,
          price_paid: parseFloat(pricePaid),
          selling_price: parseFloat(sellingPrice),
          quantity: parseInt(quantity, 10),
          tcgplayer_price: selectedCard.marketPrice,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Raw card added!");
      setSelectedCard(null);
      setPricePaid("");
      setSellingPrice("");
      setQuantity("1");
      onSaved();
    } catch {
      toast.error("Failed to save card");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <CardSearch onSelect={setSelectedCard} />
      {selectedCard && (
        <div className="rounded-lg border border-[#FB4F14]/30 bg-[#002244]/30 p-4 space-y-4">
          <div className="flex gap-4">
            {selectedCard.imageSmall && (
              <Image
                src={selectedCard.imageSmall}
                alt={selectedCard.name}
                width={80}
                height={112}
                className="rounded-md object-contain"
              />
            )}
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-[#FB4F14]">{selectedCard.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCard.setName} · #{selectedCard.number} · {selectedCard.rarity}
              </p>
              {selectedCard.marketPrice && (
                <p className="text-sm">
                  Market: <span className="font-bold">${selectedCard.marketPrice.toFixed(2)}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Condition</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as RawCondition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RAW_CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c} — {CONDITION_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Price Paid ($)</Label>
              <Input type="number" step="0.01" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Selling Price ($)</Label>
              <Input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#FB4F14] hover:bg-[#FB4F14]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Raw Card
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Add Graded Card Form ───────────────────────────────
function AddGradedCardForm({ onSaved }: { onSaved: () => void }) {
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [gradingCompany, setGradingCompany] = useState<GradingCompany>("PSA");
  const [grade, setGrade] = useState("10");
  const [certNumber, setCertNumber] = useState("");
  const [pricePaid, setPricePaid] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedCard) return toast.error("Select a card first");
    if (!pricePaid || !sellingPrice) return toast.error("Fill in prices");

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pokemon-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_type: "graded",
          name: `${selectedCard.name} [${gradingCompany} ${grade}]`,
          set_name: selectedCard.setName,
          card_number: selectedCard.number,
          rarity: selectedCard.rarity,
          image_url: selectedCard.imageLarge || selectedCard.imageSmall,
          grading_company: gradingCompany,
          grade: parseFloat(grade),
          cert_number: certNumber || null,
          price_paid: parseFloat(pricePaid),
          selling_price: parseFloat(sellingPrice),
          quantity: 1,
          tcgplayer_price: selectedCard.marketPrice,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Graded card added!");
      setSelectedCard(null);
      setPricePaid("");
      setSellingPrice("");
      setCertNumber("");
      onSaved();
    } catch {
      toast.error("Failed to save card");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <CardSearch onSelect={setSelectedCard} />
      {selectedCard && (
        <div className="rounded-lg border border-[#FB4F14]/30 bg-[#002244]/30 p-4 space-y-4">
          <div className="flex gap-4">
            {selectedCard.imageSmall && (
              <Image
                src={selectedCard.imageSmall}
                alt={selectedCard.name}
                width={80}
                height={112}
                className="rounded-md object-contain"
              />
            )}
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-[#FB4F14]">{selectedCard.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCard.setName} · #{selectedCard.number} · {selectedCard.rarity}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Grading Company</Label>
              <Select value={gradingCompany} onValueChange={(v) => setGradingCompany(v as GradingCompany)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADING_COMPANIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={String(g)}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Cert Number</Label>
              <Input value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Price Paid ($)</Label>
              <Input type="number" step="0.01" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Selling Price ($)</Label>
              <Input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-[#FB4F14] hover:bg-[#FB4F14]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Graded Card
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Add Sealed Product Form ────────────────────────────
function AddSealedForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [sealedType, setSealedType] = useState<SealedType>("Booster Box");
  const [pricePaid, setPricePaid] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
        toast.success("Image uploaded");
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Enter product name");
    if (!pricePaid || !sellingPrice) return toast.error("Fill in prices");

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pokemon-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_type: "sealed",
          name: name.trim(),
          sealed_type: sealedType,
          image_url: imageUrl || null,
          price_paid: parseFloat(pricePaid),
          selling_price: parseFloat(sellingPrice),
          quantity: parseInt(quantity, 10),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Sealed product added!");
      setName("");
      setPricePaid("");
      setSellingPrice("");
      setQuantity("1");
      setImageUrl("");
      onSaved();
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-[#FB4F14]/30 bg-[#002244]/30 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs">Product Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pokemon Scarlet & Violet Booster Box" />
        </div>
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={sealedType} onValueChange={(v) => setSealedType(v as SealedType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SEALED_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Photo</Label>
          <div className="flex gap-2 items-center">
            {imageUrl ? (
              <div className="relative w-10 h-10 rounded border">
                <Image src={imageUrl} alt="Sealed" fill className="object-contain rounded p-1" />
              </div>
            ) : null}
            <label className="cursor-pointer flex items-center gap-1 text-xs text-[#FB4F14] hover:underline">
              <ImagePlus className="h-4 w-4" />
              {uploading ? "Uploading..." : imageUrl ? "Change" : "Upload Photo"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
        <div>
          <Label className="text-xs">Price Paid ($)</Label>
          <Input type="number" step="0.01" value={pricePaid} onChange={(e) => setPricePaid(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label className="text-xs">Selling Price ($)</Label>
          <Input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label className="text-xs">Quantity</Label>
          <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full bg-[#FB4F14] hover:bg-[#FB4F14]/90">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Add Sealed Product
      </Button>
    </div>
  );
}

// ── Inventory List ─────────────────────────────────────
function InventoryList({
  items,
  onUpdate,
}: {
  items: PokemonInventoryItem[];
  onUpdate: () => void;
}) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterSet, setFilterSet] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPricePaid, setEditPricePaid] = useState("");
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const sets = useMemo(() => {
    const s = new Set(items.map((i) => i.set_name).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (filterType !== "all") list = list.filter((i) => i.card_type === filterType);
    if (filterSet) list = list.filter((i) => i.set_name === filterSet);
    if (filterCondition) list = list.filter((i) => i.condition === filterCondition);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.set_name ?? "").toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "selling_price": cmp = a.selling_price - b.selling_price; break;
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [items, filterType, filterSet, filterCondition, search, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const startEdit = (item: PokemonInventoryItem) => {
    setEditingId(item.id);
    setEditPricePaid(String(item.price_paid));
    setEditSellingPrice(String(item.selling_price));
  };

  const saveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/pokemon-inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_paid: parseFloat(editPricePaid),
          selling_price: parseFloat(editSellingPrice),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Updated");
      setEditingId(null);
      onUpdate();
    } catch {
      toast.error("Update failed");
    }
    setSavingEdit(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const typeBadgeColor = (type: CardType) => {
    switch (type) {
      case "raw": return "bg-blue-600";
      case "graded": return "bg-purple-600";
      case "sealed": return "bg-green-600";
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="raw">Raw</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="sealed">Sealed</SelectItem>
          </SelectContent>
        </Select>
        {sets.length > 0 && (
          <Select value={filterSet} onValueChange={setFilterSet}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Sets" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Sets</SelectItem>
              {sets.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Condition" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Condition</SelectItem>
            {RAW_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#002244]/50">
                <th className="px-3 py-2 text-left w-[56px]"></th>
                <th className="px-3 py-2 text-left">
                  <button onClick={() => handleSort("name")} className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground">
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Set</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Cond/Grade</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Qty</th>
                <th className="px-3 py-2 text-left">
                  <button onClick={() => handleSort("selling_price")} className="flex items-center text-xs font-medium text-muted-foreground hover:text-foreground">
                    Price <SortIcon field="selling_price" />
                  </button>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Paid</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Profit</th>
                <th className="px-3 py-2 w-[70px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const profit = item.selling_price - item.price_paid;
                  const isEditing = editingId === item.id;

                  return (
                    <tr key={item.id} className="border-b last:border-b-0 hover:bg-[#002244]/20 transition-colors">
                      <td className="px-3 py-2">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.name} width={40} height={56} className="rounded object-contain w-10 h-14" />
                        ) : (
                          <div className="w-10 h-14 rounded bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium line-clamp-1 text-xs">{item.name}</p>
                        {item.card_number && <p className="text-[10px] text-muted-foreground">#{item.card_number}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge className={`${typeBadgeColor(item.card_type)} text-white text-[10px] capitalize`}>
                          {item.card_type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground">{item.set_name || "—"}</span>
                      </td>
                      <td className="px-3 py-2">
                        {item.card_type === "graded" ? (
                          <Badge className="bg-[#FB4F14] text-white text-[10px]">
                            {item.grading_company} {item.grade}
                          </Badge>
                        ) : item.condition ? (
                          <span className="text-xs">{item.condition}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">{item.quantity}</td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editSellingPrice}
                            onChange={(e) => setEditSellingPrice(e.target.value)}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className="text-xs font-medium">{formatCurrency(item.selling_price)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editPricePaid}
                            onChange={(e) => setEditPricePaid(e.target.value)}
                            className="w-20 h-7 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{formatCurrency(item.price_paid)}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveEdit(item.id)} disabled={savingEdit}>
                              <Check className="h-3 w-3 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{filtered.length} items</span>
          <span>Total Value: <strong className="text-foreground">{formatCurrency(filtered.reduce((s, i) => s + i.selling_price * i.quantity, 0))}</strong></span>
          <span>Total Cost: <strong className="text-foreground">{formatCurrency(filtered.reduce((s, i) => s + i.price_paid * i.quantity, 0))}</strong></span>
          <span>Total Profit: <strong className="text-green-500">{formatCurrency(filtered.reduce((s, i) => s + (i.selling_price - i.price_paid) * i.quantity, 0))}</strong></span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function PokemonInventoryPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("raw");
  const [items, setItems] = useState<PokemonInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pokemon-inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } catch {
      toast.error("Failed to load inventory");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleSaved = () => {
    setShowAddDialog(false);
    loadItems();
  };

  const counts = {
    raw: items.filter((i) => i.card_type === "raw").length,
    graded: items.filter((i) => i.card_type === "graded").length,
    sealed: items.filter((i) => i.card_type === "sealed").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-80" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#FB4F14" }}>
            Pokemon Card Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            {items.length} total items · {counts.raw} raw · {counts.graded} graded · {counts.sealed} sealed
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#FB4F14] hover:bg-[#FB4F14]/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#002244] border-[#FB4F14]/30">
          <DialogHeader>
            <DialogTitle style={{ color: "#FB4F14" }}>Add Pokemon Product</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="raw" className="flex-1">Raw Cards</TabsTrigger>
              <TabsTrigger value="graded" className="flex-1">Graded Cards</TabsTrigger>
              <TabsTrigger value="sealed" className="flex-1">Sealed Product</TabsTrigger>
            </TabsList>
            <TabsContent value="raw" className="mt-4">
              <AddRawCardForm onSaved={handleSaved} />
            </TabsContent>
            <TabsContent value="graded" className="mt-4">
              <AddGradedCardForm onSaved={handleSaved} />
            </TabsContent>
            <TabsContent value="sealed" className="mt-4">
              <AddSealedForm onSaved={handleSaved} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Inventory List */}
      <InventoryList items={items} onUpdate={loadItems} />
    </div>
  );
}
