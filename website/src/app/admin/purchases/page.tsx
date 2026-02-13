"use client";

import { useEffect, useState, useCallback } from "react";
import { getPurchases, createPurchase, type PurchaseItem, type CreatePurchaseInput } from "@/actions/purchases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/image-upload";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  Search,
  X,
  DollarSign,
  ShoppingBag,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  User,
  Phone,
  Mail,
  Calendar,
  Filter,
} from "lucide-react";

type Category = "sneaker" | "pokemon_raw" | "pokemon_graded" | "pokemon_sealed";
type PaymentMethod = "cash" | "zelle" | "store_credit";

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: "sneaker", label: "Sneaker" },
  { value: "pokemon_raw", label: "Pokemon - Raw" },
  { value: "pokemon_graded", label: "Pokemon - Graded" },
  { value: "pokemon_sealed", label: "Pokemon - Sealed" },
];

const CONDITION_OPTIONS = ["new", "like_new", "good", "fair"];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "💵 Cash" },
  { value: "zelle", label: "⚡ Zelle" },
  { value: "store_credit", label: "🏷️ Store Credit" },
];

const GRADING_COMPANIES = ["PSA", "BGS", "CGC", "SGC", "AGS", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  sneaker: "bg-[#FB4F14]/20 text-[#FB4F14] border-[#FB4F14]/30",
  pokemon_raw: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  pokemon_graded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  pokemon_sealed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

interface ItemFormData {
  id: string;
  description: string;
  category: Category;
  condition: string;
  size: string;
  grade: string;
  cert_number: string;
  grading_company: string;
  offered_price: string;
  market_price: string;
}

function emptyItem(): ItemFormData {
  return {
    id: crypto.randomUUID(),
    description: "",
    category: "sneaker",
    condition: "new",
    size: "",
    grade: "",
    cert_number: "",
    grading_company: "PSA",
    offered_price: "",
    market_price: "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PurchaseRecord = any;

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [items, setItems] = useState<ItemFormData[]>([emptyItem()]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  // Expanded purchase detail
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    try {
      const data = await getPurchases({
        search: search || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo ? `${dateTo}T23:59:59` : undefined,
        category: categoryFilter || undefined,
        payment_method: paymentFilter || undefined,
      });
      setPurchases(data);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, categoryFilter, paymentFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const totalCalculated = items.reduce((sum, item) => {
    const price = parseFloat(item.offered_price) || 0;
    return sum + price;
  }, 0);

  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemFormData, value: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const resetForm = () => {
    setSellerName("");
    setSellerPhone("");
    setSellerEmail("");
    setItems([emptyItem()]);
    setPaymentMethod("cash");
    setNotes("");
    setPhotos([]);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!sellerName.trim()) {
      toast.error("Seller name is required");
      return;
    }
    if (items.some((i) => !i.description.trim())) {
      toast.error("All items need a description");
      return;
    }
    if (items.some((i) => !i.offered_price || parseFloat(i.offered_price) <= 0)) {
      toast.error("All items need a valid offered price");
      return;
    }

    setSubmitting(true);
    try {
      const purchaseItems: PurchaseItem[] = items.map((i) => ({
        description: i.description,
        category: i.category,
        condition: i.condition,
        size: i.category === "sneaker" ? i.size || null : null,
        grade: i.category === "pokemon_graded" ? i.grade || null : null,
        cert_number: i.category === "pokemon_graded" ? i.cert_number || null : null,
        grading_company: i.category === "pokemon_graded" ? i.grading_company || null : null,
        offered_price: parseFloat(i.offered_price),
        market_price: i.market_price ? parseFloat(i.market_price) : null,
      }));

      const input: CreatePurchaseInput = {
        seller_name: sellerName.trim(),
        seller_phone: sellerPhone.trim() || undefined,
        seller_email: sellerEmail.trim() || undefined,
        items: purchaseItems,
        total_paid: totalCalculated,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        photos: photos.length > 0 ? photos : undefined,
      };

      await createPurchase(input);
      toast.success("Purchase recorded & inventory updated!");
      resetForm();
      fetchPurchases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Walk-In Purchases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log purchases from walk-in sellers into inventory
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white"
        >
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "New Purchase"}
        </Button>
      </div>

      {/* New Purchase Form */}
      {showForm && (
        <Card className="border-[#FB4F14]/30 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#FB4F14]">
              <ShoppingBag className="h-5 w-5" />
              New Walk-In Purchase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seller Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Seller Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Name *
                  </Label>
                  <Input
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Seller name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </Label>
                  <Input
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input
                    type="email"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    placeholder="seller@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Items
                </h3>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <Card key={item.id} className="bg-muted/30 border-border/50">
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive h-7 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          placeholder="e.g. Jordan 1 Retro High OG Chicago"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.id, "category", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <select
                          value={item.condition}
                          onChange={(e) => updateItem(item.id, "condition", e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {CONDITION_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>

                      {item.category === "sneaker" && (
                        <div className="space-y-2">
                          <Label>Size</Label>
                          <Input
                            value={item.size}
                            onChange={(e) => updateItem(item.id, "size", e.target.value)}
                            placeholder="10.5"
                          />
                        </div>
                      )}

                      {item.category === "pokemon_graded" && (
                        <>
                          <div className="space-y-2">
                            <Label>Grading Company</Label>
                            <select
                              value={item.grading_company}
                              onChange={(e) => updateItem(item.id, "grading_company", e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              {GRADING_COMPANIES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Grade</Label>
                            <Input
                              value={item.grade}
                              onChange={(e) => updateItem(item.id, "grade", e.target.value)}
                              placeholder="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Cert #</Label>
                            <Input
                              value={item.cert_number}
                              onChange={(e) => updateItem(item.id, "cert_number", e.target.value)}
                              placeholder="12345678"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-2">
                        <Label>Offered Price *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.offered_price}
                            onChange={(e) => updateItem(item.id, "offered_price", e.target.value)}
                            className="pl-8"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Market Price</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.market_price}
                            onChange={(e) => updateItem(item.id, "market_price", e.target.value)}
                            className="pl-8"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment & Photos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Payment
                </h3>
                <div className="flex gap-2">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPaymentMethod(opt.value)}
                      className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                        paymentMethod === opt.value
                          ? "border-[#FB4F14] bg-[#FB4F14]/10 text-[#FB4F14]"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes about this purchase..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Photos
                </h3>
                <ImageUpload images={photos} onChange={setPhotos} maxImages={10} />
              </div>
            </div>

            {/* Total & Submit */}
            <div className="flex items-center justify-between rounded-lg bg-[#002244] p-4 border border-[#FB4F14]/20">
              <div>
                <p className="text-sm text-gray-400">Total to Pay</p>
                <p className="text-3xl font-bold text-[#FB4F14]">
                  {formatCurrency(totalCalculated)}
                </p>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="lg"
                className="bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white px-8"
              >
                {submitting ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="mr-2 h-4 w-4" />
                )}
                {submitting ? "Recording..." : "Record Purchase"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by seller name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-fit"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setLoading(true); fetchPurchases(); }}
            className="w-fit"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-lg border bg-muted/20 p-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 w-40 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 w-40 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment</Label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setCategoryFilter("");
                  setPaymentFilter("");
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Purchase History */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No purchases found</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Click &ldquo;New Purchase&rdquo; to log a walk-in buy
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => {
            const purchaseItems = purchase.items as PurchaseItem[];
            const isExpanded = expandedId === purchase.id;
            return (
              <Card
                key={purchase.id}
                className="cursor-pointer hover:border-[#FB4F14]/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : purchase.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#FB4F14]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-[#FB4F14]" />
                      </div>
                      <div>
                        <p className="font-medium">{purchase.seller_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(purchase.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {purchaseItems.length} item{purchaseItems.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-[#FB4F14]">
                          {formatCurrency(purchase.total_paid)}
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize"
                        >
                          {purchase.payment_method.replace("_", " ")}
                        </Badge>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {/* Contact info */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {purchase.seller_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {purchase.seller_phone}
                          </span>
                        )}
                        {purchase.seller_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {purchase.seller_email}
                          </span>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {purchaseItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${CATEGORY_COLORS[item.category] || ""}`}
                              >
                                {item.category.replace("_", " ")}
                              </Badge>
                              <span className="text-sm">{item.description}</span>
                              {item.size && (
                                <span className="text-xs text-muted-foreground">
                                  Size {item.size}
                                </span>
                              )}
                              {item.grade && (
                                <span className="text-xs text-muted-foreground">
                                  {item.grading_company} {item.grade}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(item.offered_price)}
                              </p>
                              {item.market_price && (
                                <p className="text-[10px] text-muted-foreground">
                                  Mkt: {formatCurrency(item.market_price)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {purchase.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          📝 {purchase.notes}
                        </p>
                      )}

                      {purchase.photos && purchase.photos.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {purchase.photos.map((url: string, i: number) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Purchase photo ${i + 1}`}
                              className="h-16 w-16 rounded-lg object-cover border border-border"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground">
            Showing {purchases.length} purchase{purchases.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
