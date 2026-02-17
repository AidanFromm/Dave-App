"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  ArrowUpFromLine,
  ArrowDownToLine,
  Loader2,
  CheckCircle2,
  XCircle,
  Store,
  Wifi,
  WifiOff,
  Clock,
  Package,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface StatusData {
  connected: boolean;
  merchant: { id: string; environment: string } | null;
  cloverItemCount: number;
  websiteItemCount: number;
  lastSyncAt: string | null;
  error?: string;
}

interface SyncReport {
  total: number;
  matched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface SyncLog {
  direction: string;
  report: SyncReport;
  timestamp: string;
  success: boolean;
}

export default function CloverAdminPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/clover/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({
        connected: false,
        merchant: null,
        cloverItemCount: 0,
        websiteItemCount: 0,
        lastSyncAt: null,
        error: "Failed to check connection",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleSync(direction: "push" | "pull" | "full") {
    setSyncing(direction);
    try {
      const res = await fetch("/api/admin/clover/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();

      const log: SyncLog = {
        direction: data.direction ?? direction,
        report: data.report ?? { total: 0, matched: 0, created: 0, updated: 0, skipped: 0, errors: [] },
        timestamp: data.timestamp ?? new Date().toISOString(),
        success: data.success ?? false,
      };

      setSyncLogs((prev) => [log, ...prev].slice(0, 20));

      if (data.success) {
        toast.success(`Sync complete: ${log.report.updated} updated, ${log.report.created} created`);
      } else {
        toast.error(data.error ?? "Sync encountered errors");
      }

      fetchStatus();
    } catch {
      toast.error("Sync request failed");
    } finally {
      setSyncing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Clover POS</h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Clover POS Integration</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sync inventory between SecuredTampa and your Clover POS
            </p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 self-start"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Connection Status Card */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status?.connected ? (
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-green-500/10">
                <Wifi className="h-5 w-5 text-green-500" />
              </div>
            ) : (
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-red-500/10">
                <WifiOff className="h-5 w-5 text-red-500" />
              </div>
            )}
            <div>
              <p className="font-semibold">
                {status?.connected ? "Connected" : "Not Connected"}
              </p>
              {status?.merchant && (
                <p className="text-xs text-muted-foreground">
                  Merchant: {status.merchant.id} -- {status.merchant.environment}
                </p>
              )}
              {status?.error && !status.connected && (
                <p className="text-xs text-red-400 mt-1">{status.error}</p>
              )}
            </div>
          </div>
          {status?.lastSyncAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Last sync: {new Date(status.lastSyncAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Item Count Comparison */}
      {status?.connected && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Package className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Website Items</span>
            </div>
            <p className="text-2xl font-mono font-bold">{status.websiteItemCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Store className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Clover Items</span>
            </div>
            <p className="text-2xl font-mono font-bold">{status.cloverItemCount}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-5 transition-colors hover:border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Difference</span>
            </div>
            <p className="text-2xl font-mono font-bold">
              {Math.abs(status.websiteItemCount - status.cloverItemCount)}
            </p>
          </div>
        </div>
      )}

      {/* Sync Controls */}
      {status?.connected && (
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Sync Controls
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleSync("push")}
              disabled={!!syncing}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/85 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {syncing === "push" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4" />
              )}
              Push to Clover
            </button>
            <button
              onClick={() => handleSync("pull")}
              disabled={!!syncing}
              className="flex items-center gap-2 rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {syncing === "pull" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
              Pull from Clover
            </button>
            <button
              onClick={() => handleSync("full")}
              disabled={!!syncing}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {syncing === "full" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Full Sync
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Push sends website inventory to Clover. Pull imports Clover items into the website. Full Sync does both, with Clover as stock source of truth.
          </p>
        </div>
      )}

      {/* Sync History */}
      {syncLogs.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Sync History</h2>
          <div className="space-y-3">
            {syncLogs.map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-background p-4"
              >
                {log.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{log.direction} Sync</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.report.total} total / {log.report.updated} updated / {log.report.created} created / {log.report.skipped} skipped
                  </p>
                  {log.report.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {log.report.errors.map((err, j) => (
                        <p key={j} className="text-xs text-red-400">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
