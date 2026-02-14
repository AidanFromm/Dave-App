"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Link2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Bell,
  Pencil,
  Clock,
  ExternalLink,
  ScanBarcode,
  Database,
  Key,
  DollarSign,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getBarcodeCatalogCount } from "@/actions/barcode";
import { checkStockXConnection } from "@/actions/stockx-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STOCKX_AUTH_URL,
  STOCKX_REDIRECT_URI,
  STOCKX_AUDIENCE,
} from "@/lib/constants";

interface CloverStatus {
  isConnected: boolean;
  merchantId: string | null;
  lastSyncAt: string | null;
}

const CLOVER_APP_ID = process.env.NEXT_PUBLIC_CLOVER_APP_ID ?? "";

export default function SettingsPage() {
  const [cloverStatus, setCloverStatus] = useState<CloverStatus>({
    isConnected: false,
    merchantId: null,
    lastSyncAt: null,
  });
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [stockxConnected, setStockxConnected] = useState<boolean | null>(null);

  // Store settings state
  const [storeEditing, setStoreEditing] = useState(false);
  const [storeName, setStoreName] = useState("Secured Tampa");
  const [storeAddress, setStoreAddress] = useState("Tampa, FL");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("securedtampa.llc@gmail.com");

  // Tax & shipping
  const [taxRate, setTaxRate] = useState(7.5);
  const [shippingFlat, setShippingFlat] = useState(9.99);
  const [freeShippingMin, setFreeShippingMin] = useState(150);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);

  useEffect(() => {
    // Load store settings from localStorage
    try {
      const saved = localStorage.getItem("secured_store_settings");
      if (saved) {
        const s = JSON.parse(saved);
        if (s.storeName) setStoreName(s.storeName);
        if (s.storeAddress) setStoreAddress(s.storeAddress);
        if (s.storePhone !== undefined) setStorePhone(s.storePhone);
        if (s.storeEmail) setStoreEmail(s.storeEmail);
      }
      const notifSaved = localStorage.getItem("secured_notification_prefs");
      if (notifSaved) {
        const n = JSON.parse(notifSaved);
        if (n.emailNotifications !== undefined) setEmailNotifications(n.emailNotifications);
        if (n.orderAlerts !== undefined) setOrderAlerts(n.orderAlerts);
        if (n.lowStockThreshold !== undefined) setLowStockThreshold(n.lowStockThreshold);
      }
      const taxSaved = localStorage.getItem("secured_tax_shipping");
      if (taxSaved) {
        const t = JSON.parse(taxSaved);
        if (t.taxRate !== undefined) setTaxRate(t.taxRate);
        if (t.shippingFlat !== undefined) setShippingFlat(t.shippingFlat);
        if (t.freeShippingMin !== undefined) setFreeShippingMin(t.freeShippingMin);
      }
    } catch {
      // localStorage parse error — safe to ignore
    }

    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings/clover");
        if (res.ok) {
          const data = await res.json();
          setCloverStatus({
            isConnected: data.isConnected ?? false,
            merchantId: data.merchantId ?? null,
            lastSyncAt: data.lastSyncAt ?? null,
          });
        }
      } catch {
        toast.error("Failed to load Clover settings");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
    getBarcodeCatalogCount().then(setCatalogCount).catch(() => {});
    checkStockXConnection().then(setStockxConnected).catch(() => setStockxConnected(false));

    // Check URL params for Clover callback result
    const params = new URLSearchParams(window.location.search);
    if (params.get("clover") === "connected") {
      toast.success("Clover connected successfully!");
      window.history.replaceState({}, "", "/admin/settings");
    }
    if (params.get("stockx") === "connected") {
      toast.success("StockX connected successfully!");
      setStockxConnected(true);
      window.history.replaceState({}, "", "/admin/settings");
    }
    if (params.get("stockx") === "error") {
      const stockxErr = params.get("error");
      toast.error(`StockX connection failed: ${(stockxErr ?? "unknown").replace(/_/g, " ")}`);
      window.history.replaceState({}, "", "/admin/settings");
    }
    const error = params.get("error");
    if (error && !params.get("stockx")) {
      toast.error(`Clover connection failed: ${error.replace(/_/g, " ")}`);
      window.history.replaceState({}, "", "/admin/settings");
    }
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/clover/sync", { method: "POST" });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          `Sync complete: ${data.summary.updated} updated, ${data.summary.matched} matched`
        );
        setCloverStatus((prev) => ({
          ...prev,
          lastSyncAt: new Date().toISOString(),
        }));
      } else {
        toast.error(data.error ?? "Sync failed");
      }
    } catch {
      toast.error("Failed to connect to sync endpoint");
    } finally {
      setSyncing(false);
    }
  }

  function handleCloverConnect() {
    if (!CLOVER_APP_ID) {
      toast.error("Clover App ID not configured");
      return;
    }
    const redirectUri = `${window.location.origin}/api/clover/oauth`;
    const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${CLOVER_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = authUrl;
  }

  function formatLastSync(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl shadow-card bg-card p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your store info, tax rates, integrations, and notifications.</p>
      </div>

      {/* Store Settings */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Store Settings</h3>
              <p className="text-xs text-muted-foreground">Your store name and contact info shown on receipts and emails.</p>
            </div>
          </div>
          {!storeEditing ? (
            <button
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
              onClick={() => setStoreEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                onClick={() => setStoreEditing(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={() => {
                  const settings = { storeName, storeAddress, storePhone, storeEmail };
                  localStorage.setItem("secured_store_settings", JSON.stringify(settings));
                  setStoreEditing(false);
                  toast.success("Store settings saved!");
                }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {storeEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground flex items-center gap-2"><Store className="h-4 w-4" /> Store Name</label>
                <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> Address</label>
                <input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</label>
                <input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="(555) 555-5555" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4" /> Email</label>
                <input value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Store className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Store Name</p>
                  <p className="font-medium">{storeName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{storeAddress}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{storePhone || "--"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{storeEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tax & Shipping Rates */}
      <div className="rounded-xl shadow-card bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Tax &amp; Shipping</h3>
            <p className="text-xs text-muted-foreground">These rates apply to all online orders. Florida default tax is 7.5%.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Flat Shipping Rate ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={shippingFlat}
              onChange={(e) => setShippingFlat(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Free Shipping Minimum ($)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={freeShippingMin}
              onChange={(e) => setFreeShippingMin(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => {
              localStorage.setItem("secured_tax_shipping", JSON.stringify({ taxRate, shippingFlat, freeShippingMin }));
              toast.success("Tax & shipping rates saved!");
            }}
          >
            Save Rates
          </button>
        </div>
      </div>

      {/* Staff Management */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Staff Management</h3>
          </div>
          <Link
            href="/admin/staff"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Manage Staff
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Add or remove team members, manage roles, and view time clock reports.
        </p>
      </div>

      {/* Clover Integration */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Clover Integration</h3>
        </div>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {cloverStatus.isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium">
                  {cloverStatus.isConnected ? "Connected" : "Not Connected"}
                </p>
                {cloverStatus.merchantId && (
                  <p className="text-sm text-muted-foreground">
                    Merchant ID: {cloverStatus.merchantId}
                  </p>
                )}
              </div>
            </div>

            {!cloverStatus.isConnected ? (
              <button
                onClick={handleCloverConnect}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Connect Clover
              </button>
            ) : (
              <button
                onClick={handleCloverConnect}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>

          {/* Sync Status */}
          {cloverStatus.isConnected && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Last Synced</p>
                  <p className="text-sm text-muted-foreground">
                    {formatLastSync(cloverStatus.lastSyncAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                />
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* StockX Integration */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <ExternalLink className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">StockX Integration</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {stockxConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {stockxConnected === null
                    ? "Checking..."
                    : stockxConnected
                      ? "Connected"
                      : "Not Connected"}
                </p>
                {!stockxConnected && stockxConnected !== null && (
                  <p className="text-xs text-muted-foreground">
                    Connect your StockX account to enable barcode lookups
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                // Use proper OAuth flow - redirects to StockX login
                const state = crypto.randomUUID();
                sessionStorage.setItem("stockx_state", state);
                
                const clientId = process.env.NEXT_PUBLIC_STOCKX_CLIENT_ID ?? "";
                const params = new URLSearchParams({
                  response_type: "code",
                  client_id: clientId,
                  redirect_uri: STOCKX_REDIRECT_URI,
                  scope: "offline_access openid",
                  audience: STOCKX_AUDIENCE,
                  state,
                });
                
                window.location.href = `${STOCKX_AUTH_URL}?${params}`;
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {stockxConnected ? "Reconnect" : "Connect StockX"}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">API Key</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Configured
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Barcode Catalog</span>
            </div>
            <span className="text-sm font-medium">
              {catalogCount !== null ? `${catalogCount} entries` : "Loading..."}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <ScanBarcode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Barcode Scanner</span>
            </div>
            <Link
              href="/admin/scan"
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Open Scanner
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important updates
              </p>
            </div>
            <button
              onClick={() => {
                const next = !emailNotifications;
                setEmailNotifications(next);
                const prefs = { emailNotifications: next, orderAlerts, lowStockThreshold };
                localStorage.setItem("secured_notification_prefs", JSON.stringify(prefs));
                toast.success(next ? "Email notifications enabled" : "Email notifications disabled");
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailNotifications ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order Alerts</p>
              <p className="text-sm text-muted-foreground">
                Get notified when new orders come in
              </p>
            </div>
            <button
              onClick={() => {
                const next = !orderAlerts;
                setOrderAlerts(next);
                const prefs = { emailNotifications, orderAlerts: next, lowStockThreshold };
                localStorage.setItem("secured_notification_prefs", JSON.stringify(prefs));
                toast.success(next ? "Order alerts enabled" : "Order alerts disabled");
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${orderAlerts ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${orderAlerts ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alert Threshold</p>
              <p className="text-sm text-muted-foreground">
                Get notified when product stock falls below this number
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={lowStockThreshold}
                onChange={(e) =>
                  setLowStockThreshold(parseInt(e.target.value, 10) || 1)
                }
                className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={() => {
                  const prefs = { emailNotifications, orderAlerts, lowStockThreshold };
                  localStorage.setItem("secured_notification_prefs", JSON.stringify(prefs));
                  toast.success("Threshold saved!");
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
