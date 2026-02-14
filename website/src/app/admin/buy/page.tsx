"use client";

import { useState, useRef, useCallback } from "react";
import { createPurchase, type PurchaseItem, type CreatePurchaseInput } from "@/actions/purchases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/image-upload";
import { BarcodeScannerInput } from "@/components/admin/barcode-scanner-input";
import { StockXSearchModal } from "@/components/admin/stockx-search-modal";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  X,
  DollarSign,
  ShoppingBag,
  Trash2,
  RefreshCw,
  User,
  Phone,
  Mail,
  ScanBarcode,
  Search,
  Printer,
  CheckCircle2,
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
  { value: "cash", label: "Cash" },
  { value: "zelle", label: "Zelle" },
  { value: "store_credit", label: "Store Credit" },
];
const GRADING_COMPANIES = ["PSA", "BGS", "CGC", "SGC", "AGS", "Other"];

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
  brand: string;
  image_url: string;
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
    brand: "",
    image_url: "",
  };
}

interface CompletedPurchase {
  id: string;
  seller_name: string;
  seller_phone?: string;
  seller_email?: string;
  items: PurchaseItem[];
  total_paid: number;
  payment_method: string;
  notes?: string;
  created_at: string;
}

export default function BuyPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [items, setItems] = useState<ItemFormData[]>([emptyItem()]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [stockxOpen, setStockxOpen] = useState(false);
  const [stockxItemId, setStockxItemId] = useState<string | null>(null);
  const [completedPurchase, setCompletedPurchase] = useState<CompletedPurchase | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalCalculated = items.reduce((sum, item) => sum + (parseFloat(item.offered_price) || 0), 0);

  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== id));
  };
  const updateItem = (id: string, field: keyof ItemFormData, value: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    setBarcodeLoading(true);
    try {
      const res = await fetch(`/api/upc-lookup?upc=${encodeURIComponent(barcode)}`);
      const data = await res.json();
      if (data.product) {
        const newItem = emptyItem();
        newItem.description = data.product.name || barcode;
        newItem.brand = data.product.brand || "";
        if (data.product.size) newItem.size = data.product.size;
        setItems((prev) => [...prev, newItem]);
        toast.success(`Found: ${data.product.name || barcode}`);
      } else {
        const newItem = emptyItem();
        newItem.description = `UPC: ${barcode}`;
        setItems((prev) => [...prev, newItem]);
        toast.info("Barcode not in database — added manually");
      }
    } catch {
      toast.error("Barcode lookup failed");
    } finally {
      setBarcodeLoading(false);
    }
  }, []);

  const openStockxForItem = (itemId: string) => {
    setStockxItemId(itemId);
    setStockxOpen(true);
  };

  const handleStockxSelect = (product: { name: string; brand: string; retailPrice: number; imageUrl: string }) => {
    if (stockxItemId) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === stockxItemId
            ? {
                ...i,
                description: product.name,
                brand: product.brand,
                market_price: product.retailPrice > 0 ? String(product.retailPrice) : i.market_price,
                image_url: product.imageUrl || i.image_url,
              }
            : i
        )
      );
      toast.success("StockX data applied");
    }
    setStockxOpen(false);
    setStockxItemId(null);
  };

  const resetForm = () => {
    setSellerName("");
    setSellerPhone("");
    setSellerEmail("");
    setItems([emptyItem()]);
    setPaymentMethod("cash");
    setNotes("");
    setPhotos([]);
  };

  const handleSubmit = async () => {
    if (!sellerName.trim()) { toast.error("Seller name is required"); return; }
    if (items.some((i) => !i.description.trim())) { toast.error("All items need a description"); return; }
    if (items.some((i) => !i.offered_price || parseFloat(i.offered_price) <= 0)) { toast.error("All items need a valid offered price"); return; }

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

      const result = await createPurchase(input);
      setCompletedPurchase({
        id: result.id,
        seller_name: sellerName.trim(),
        seller_phone: sellerPhone.trim() || undefined,
        seller_email: sellerEmail.trim() || undefined,
        items: purchaseItems,
        total_paid: totalCalculated,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
        created_at: new Date().toISOString(),
      });
      toast.success("Purchase recorded & inventory updated!");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create purchase");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Purchase Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
        .header h1 { margin: 0; font-size: 20px; }
        .header p { margin: 2px 0; font-size: 11px; color: #555; }
        .info { margin: 10px 0; font-size: 12px; }
        .info span { font-weight: bold; }
        .items { border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 8px 0; margin: 10px 0; }
        .item { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
        .item-desc { max-width: 250px; }
        .total { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; padding: 8px 0; }
        .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #777; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  // Show receipt if purchase was just completed
  if (completedPurchase) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">Purchase Recorded!</h1>
          <p className="text-muted-foreground">Items have been added to inventory</p>
        </div>

        <Card className="border-[#FB4F14]/30">
          <CardContent className="pt-6">
            <div ref={receiptRef}>
              <div className="header" style={{ textAlign: "center", borderBottom: "2px dashed #555", paddingBottom: 12, marginBottom: 12 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: "bold" }}>SECURED TAMPA</h1>
                <p style={{ margin: "2px 0", fontSize: 11, color: "#999" }}>Walk-In Purchase Receipt</p>
                <p style={{ margin: "2px 0", fontSize: 11, color: "#999" }}>
                  {new Date(completedPurchase.created_at).toLocaleString()}
                </p>
                <p style={{ margin: "2px 0", fontSize: 10, color: "#999" }}>
                  ID: {completedPurchase.id.slice(0, 8).toUpperCase()}
                </p>
              </div>

              <div style={{ margin: "10px 0", fontSize: 12 }}>
                <p><strong>Seller:</strong> {completedPurchase.seller_name}</p>
                {completedPurchase.seller_phone && <p><strong>Phone:</strong> {completedPurchase.seller_phone}</p>}
                {completedPurchase.seller_email && <p><strong>Email:</strong> {completedPurchase.seller_email}</p>}
                <p><strong>Payment:</strong> {completedPurchase.payment_method.replace("_", " ").toUpperCase()}</p>
              </div>

              <div style={{ borderTop: "1px dashed #555", borderBottom: "1px dashed #555", padding: "8px 0", margin: "10px 0" }}>
                {completedPurchase.items.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                    <span style={{ maxWidth: 250 }}>
                      {item.description}
                      {item.size ? ` (${item.size})` : ""}
                      {item.grade ? ` [${item.grading_company} ${item.grade}]` : ""}
                    </span>
                    <span style={{ fontWeight: "bold" }}>${item.offered_price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: "bold", padding: "8px 0" }}>
                <span>TOTAL PAID</span>
                <span>${completedPurchase.total_paid.toFixed(2)}</span>
              </div>

              {completedPurchase.notes && (
                <p style={{ fontSize: 11, color: "#999", fontStyle: "italic" }}>Notes: {completedPurchase.notes}</p>
              )}

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#777" }}>
                <p>Thank you for selling to Secured Tampa!</p>
                <p>securedtampa.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center">
          <Button onClick={handlePrint} variant="outline" size="lg" className="min-w-[160px]">
            <Printer className="mr-2 h-5 w-5" /> Print Receipt
          </Button>
          <Button
            onClick={() => setCompletedPurchase(null)}
            size="lg"
            className="bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white min-w-[160px]"
          >
            <Plus className="mr-2 h-5 w-5" /> New Purchase
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buy from Customer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record walk-in purchases — items auto-add to inventory
        </p>
      </div>

      {/* Barcode Scanner */}
      <Card className="border-[#002244]/50 bg-[#002244]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScanBarcode className="h-4 w-4 text-[#FB4F14]" />
            Quick Add — Scan Barcode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BarcodeScannerInput onScan={handleBarcodeScan} loading={barcodeLoading} />
        </CardContent>
      </Card>

      {/* Seller Info */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Name *</Label>
              <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Seller name" className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</Label>
              <Input value={sellerPhone} onChange={(e) => setSellerPhone(e.target.value)} placeholder="(555) 555-5555" className="h-12 text-base" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
              <Input type="email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} placeholder="seller@email.com" className="h-12 text-base" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Items ({items.length})
          </h3>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" /> Add Item
          </Button>
        </div>

        {items.map((item, idx) => (
          <Card key={item.id} className="bg-muted/30 border-border/50">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Item #{idx + 1}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openStockxForItem(item.id)}
                    className="text-[#FB4F14] hover:text-[#FB4F14] h-7 px-2 text-xs"
                  >
                    <Search className="h-3 w-3 mr-1" /> StockX
                  </Button>
                  {items.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive h-7 px-2">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="e.g. Jordan 1 Retro High OG Chicago" className="h-11" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select value={item.category} onChange={(e) => updateItem(item.id, "category", e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      {CATEGORY_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <select value={item.condition} onChange={(e) => updateItem(item.id, "condition", e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      {CONDITION_OPTIONS.map((c) => (<option key={c} value={c}>{c.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {item.category === "sneaker" && (
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Input value={item.size} onChange={(e) => updateItem(item.id, "size", e.target.value)} placeholder="10.5" className="h-11" />
                  </div>
                )}
                {item.category === "pokemon_graded" && (
                  <>
                    <div className="space-y-2">
                      <Label>Grading Co.</Label>
                      <select value={item.grading_company} onChange={(e) => updateItem(item.id, "grading_company", e.target.value)} className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        {GRADING_COMPANIES.map((g) => (<option key={g} value={g}>{g}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Grade</Label>
                      <Input value={item.grade} onChange={(e) => updateItem(item.id, "grade", e.target.value)} placeholder="10" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cert #</Label>
                      <Input value={item.cert_number} onChange={(e) => updateItem(item.id, "cert_number", e.target.value)} placeholder="12345678" className="h-11" />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Offer Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="number" step="0.01" min="0" value={item.offered_price} onChange={(e) => updateItem(item.id, "offered_price", e.target.value)} className="pl-8 h-11" placeholder="0.00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Market Value</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input type="number" step="0.01" min="0" value={item.market_price} onChange={(e) => updateItem(item.id, "market_price", e.target.value)} className="pl-8 h-11" placeholder="0.00" />
                  </div>
                </div>
              </div>

              {item.image_url && (
                <div className="flex items-center gap-2">
                  <img src={item.image_url} alt="" className="h-10 w-10 rounded object-contain border" />
                  <span className="text-xs text-muted-foreground">StockX image</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment & Photos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => setPaymentMethod(opt.value)}
                  className={`flex-1 rounded-lg border-2 px-3 py-3 text-sm font-medium transition-all ${
                    paymentMethod === opt.value
                      ? "border-[#FB4F14] bg-[#FB4F14]/10 text-[#FB4F14]"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload images={photos} onChange={setPhotos} maxImages={10} />
          </CardContent>
        </Card>
      </div>

      {/* Total & Submit */}
      <div className="flex items-center justify-between rounded-xl bg-[#002244] p-5 border border-[#FB4F14]/20">
        <div>
          <p className="text-sm text-gray-400">Total to Pay</p>
          <p className="text-4xl font-bold text-[#FB4F14]">{formatCurrency(totalCalculated)}</p>
          <p className="text-xs text-gray-500 mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} size="lg" className="bg-[#FB4F14] hover:bg-[#FB4F14]/90 text-white px-10 h-14 text-lg">
          {submitting ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingBag className="mr-2 h-5 w-5" />}
          {submitting ? "Recording..." : "Record Purchase"}
        </Button>
      </div>

      {/* StockX Modal */}
      <StockXSearchModal
        open={stockxOpen}
        onClose={() => { setStockxOpen(false); setStockxItemId(null); }}
        onSelect={handleStockxSelect}
        initialQuery={stockxItemId ? items.find((i) => i.id === stockxItemId)?.description || "" : ""}
      />
    </div>
  );
}
