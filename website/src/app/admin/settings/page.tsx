"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Users,
  Link2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Bell,
  Pencil,
  Shield,
  Clock,
  ExternalLink,
  ScanBarcode,
  Database,
  Key,
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

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
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

  // Placeholder staff data
  const staffMembers: StaffMember[] = [
    { id: "1", name: "Store Owner", email: "owner@securedtampa.com", role: "owner" },
  ];

  useEffect(() => {
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
        // Clover settings not available yet, that's OK
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

  function getRoleBadgeClasses(role: string): string {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "staff":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
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
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Store Settings */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Store Settings</h3>
          </div>
          <button
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
            onClick={() => toast.info("Store settings editing coming soon")}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Store className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Store Name</p>
                <p className="font-medium">Secured Tampa</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">Tampa, FL</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">--</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">contact@securedtampa.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Management */}
      <div className="rounded-xl shadow-card bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Staff Management</h3>
          </div>
          <button
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => toast.info("Staff invitations coming soon")}
          >
            Invite Staff
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="pb-3 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="pb-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((member) => (
                <tr key={member.id} className="border-b border-border/50">
                  <td className="py-3 font-medium">{member.name}</td>
                  <td className="py-3 text-muted-foreground">{member.email}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getRoleBadgeClasses(member.role)}`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => toast.info("Staff management coming soon")}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Staff management and role-based permissions are coming soon.
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
                
                const clientId = "6iancV9MkHjtn9dIE8VoflhwK0H3jCFc";
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
                onClick={() =>
                  toast.info("Notification settings will be saved automatically in a future update")
                }
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Email and push notification preferences are coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
