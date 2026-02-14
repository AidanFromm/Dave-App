"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  Package,
  Truck,
  MapPin,
  Link2,
  Loader2,
  X,
  DollarSign,
  Percent,
} from "lucide-react";

interface LineItem {
  product_id: string;
  variant_id?: string;
  name: string;
  sku: string | null;
  size: string | null;
  price: number;
  quantity: number;
  image?: string;
}

interface CustomerResult {
  id: string;
  email: string;
  full_name: string | null;
}

interface ProductResult {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  size: string | null;
  quantity: number;
  images: string[];
  brand: string | null;
}

export default function NewManualOrderPage() {
  const router = useRouter();
  const [items, setItems] = useState<LineItem[]>([]);
  const [fulfillment, setFulfillment] = useState<"ship" | "pickup">("pickup");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Customer search
  useEffect(() => {
    if (customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .or(`email.ilike.%${customerSearch}%,full_name.ilike.%${customerSearch}%`)
        .limit(5);
      setCustomerResults((data ?? []) as CustomerResult[]);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Product search
  useEffect(() => {
    if (productSearch.length < 2) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, price, size, quantity, images, brand")
        .eq("is_active", true)
        .gt("quantity", 0)
        .or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%,barcode.ilike.%${productSearch}%`)
        .limit(10);
      setProductResults((data ?? []) as ProductResult[]);
      setSearchingProducts(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const addItem = (product: ProductResult) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + 1, product.quantity) }
            : i
        )
      );
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          size: product.size,
          price: product.price,
          quantity: 1,
          image: product.images?.[0],
        },
      ]);
    }
    setProductSearch("");
    setProductResults([]);
  };

  const updateQty = (productId: string, delta: number) => {
    setItems(
      items
        .map((i) =>
          i.product_id === productId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setItems(
      items.map((i) =>
        i.product_id === productId ? { ...i, price: newPrice } : i
      )
    );
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount =
    discountType === "percent"
      ? subtotal * (parseFloat(discountValue || "0") / 100)
      : parseFloat(discountValue || "0");
  const total = Math.max(0, subtotal - discountAmount);

  const customerEmail =
    selectedCustomer?.email || newCustomerEmail;
  const customerName =
    selectedCustomer?.full_name || newCustomerName;

  const buildOrderPayload = () => ({
    customer_id: selectedCustomer?.id || null,
    customer_email: customerEmail,
    customer_name: customerName,
    items: items.map((i) => ({
      product_id: i.product_id,
      variant_id: i.variant_id || null,
      name: i.name,
      sku: i.sku,
      size: i.size,
      quantity: i.quantity,
      price: i.price,
      total: i.price * i.quantity,
    })),
    subtotal,
    tax: 0,
    shipping_cost: 0,
    discount: discountAmount,
    total,
    status: "pending",
    sales_channel: "manual",
    fulfillment_type: fulfillment,
    customer_notes: customerNotes || null,
    internal_notes: internalNotes || null,
  });

  const handleSaveOrder = async () => {
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    if (!customerEmail) {
      toast.error("Customer email is required");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = buildOrderPayload();

      // Generate order number
      const orderNumber = `ST-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from("orders")
        .insert({ ...payload, order_number: orderNumber })
        .select("id")
        .single();

      if (error) throw error;
      toast.success(`Order ${orderNumber} created`);
      router.push(`/admin/orders/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndGenerateLink = async () => {
    if (items.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    if (!customerEmail) {
      toast.error("Customer email is required");
      return;
    }

    setGeneratingLink(true);
    try {
      const supabase = createClient();
      const payload = buildOrderPayload();
      const orderNumber = `ST-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from("orders")
        .insert({ ...payload, order_number: orderNumber })
        .select("id")
        .single();

      if (error) throw error;

      // Generate payment link
      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.id }),
      });
      const linkData = await res.json();
      if (!res.ok) throw new Error(linkData.error ?? "Failed to generate link");

      await navigator.clipboard.writeText(linkData.url);
      toast.success("Order created. Payment link copied to clipboard.");
      router.push(`/admin/orders/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      toast.error(message);
    } finally {
      setGeneratingLink(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight">
        Create Manual Order
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        For phone, DM, and Instagram orders.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Search */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-primary" />
              Products
            </h2>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-9"
              />
              {productResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-64 overflow-y-auto">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-surface-800/50 transition-colors text-sm"
                    >
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-10 w-10 rounded-lg object-contain bg-white border border-border p-0.5"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.sku && `${p.sku} · `}
                          {p.size && `Size ${p.size} · `}
                          {p.quantity} in stock
                        </p>
                      </div>
                      <span className="font-mono text-sm font-medium text-primary">
                        {formatCurrency(p.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Line Items */}
            {items.length > 0 && (
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt=""
                        className="h-12 w-12 rounded-lg object-contain bg-white border border-border p-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.sku && `${item.sku} · `}
                        {item.size && `Size ${item.size}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground mr-1">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) =>
                          updatePrice(item.product_id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 h-8 text-sm font-mono text-right"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => updateQty(item.product_id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => updateQty(item.product_id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-mono text-sm font-medium w-20 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {items.length === 0 && (
              <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Search and add products above
                </p>
              </div>
            )}
          </div>

          {/* Discount */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 mb-4">
              <Percent className="h-4 w-4 text-primary" />
              Discount
            </h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs mb-1.5">Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setDiscountType("flat")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    discountType === "flat"
                      ? "bg-primary text-white"
                      : "hover:bg-surface-800/50"
                  }`}
                >
                  $
                </button>
                <button
                  onClick={() => setDiscountType("percent")}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    discountType === "percent"
                      ? "bg-primary text-white"
                      : "hover:bg-surface-800/50"
                  }`}
                >
                  %
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">Notes</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5">Customer Notes</Label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Notes from the customer..."
                />
              </div>
              <div>
                <Label className="text-xs mb-1.5">Internal Notes</Label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Internal notes (not visible to customer)..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-primary" />
              Customer
            </h2>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div>
                  <p className="text-sm font-medium">
                    {selectedCustomer.full_name || "No Name"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCustomer.email}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setSelectedCustomer(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : showNewCustomer ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1.5">Name</Label>
                  <Input
                    placeholder="Customer name"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5">Email</Label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setShowNewCustomer(false)}
                >
                  Search existing instead
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9"
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-xl max-h-48 overflow-y-auto">
                      {customerResults.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                            setCustomerResults([]);
                          }}
                          className="flex flex-col w-full px-3 py-2 text-left hover:bg-surface-800/50 text-sm"
                        >
                          <span className="font-medium">
                            {c.full_name || "No Name"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {c.email}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => setShowNewCustomer(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  New Customer
                </Button>
              </div>
            )}
          </div>

          {/* Fulfillment */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Fulfillment
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setFulfillment("pickup")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                  fulfillment === "pickup"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <MapPin className="h-4 w-4" />
                Pickup
              </button>
              <button
                onClick={() => setFulfillment("ship")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                  fulfillment === "ship"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Truck className="h-4 w-4" />
                Ship
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                </span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
                <span>Total</span>
                <span className="font-mono text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleSaveOrder}
              disabled={saving || generatingLink || items.length === 0}
              className="w-full bg-[#002244] hover:bg-[#001a33] text-white font-semibold"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              Save Order
            </Button>
            <Button
              onClick={handleSaveAndGenerateLink}
              disabled={saving || generatingLink || items.length === 0}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10 font-semibold"
            >
              {generatingLink ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Save & Generate Payment Link
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
