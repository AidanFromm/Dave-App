"use client";

import { useState, useEffect, useCallback } from "react";

interface CloverStatus {
  isConnected: boolean;
  merchantId: string | null;
  lastSyncAt: string | null;
}

interface SyncResult {
  success: boolean;
  summary?: {
    total: number;
    matched: number;
    updated: number;
    created: number;
    skipped: number;
    errors: string[];
  };
  error?: string;
}

interface Mismatch {
  productId: string;
  productName: string;
  websiteStock: number;
  cloverStock: number;
  cloverItemId: string | null;
}

export default function CloverAdminPage() {
  const [status, setStatus] = useState<CloverStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [mismatches, setMismatches] = useState<Mismatch[]>([]);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    error?: string;
  } | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings/clover");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ isConnected: false, merchantId: null, lastSyncAt: null });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMismatches = useCallback(async () => {
    try {
      const res = await fetch("/api/clover/sync?action=status");
      if (res.ok) {
        const data = await res.json();
        setMismatches(data.mismatches ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchMismatches();
  }, [fetchStatus, fetchMismatches]);

  async function handleTestConnection() {
    setTestResult(null);
    try {
      const res = await fetch("/api/clover/sync?action=test");
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "Request failed" });
    }
  }

  async function handleSync(direction: "from" | "to" | "full") {
    setSyncing(direction);
    setSyncResult(null);
    try {
      const res = await fetch("/api/clover/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      setSyncResult(data);
      fetchStatus();
      fetchMismatches();
    } catch {
      setSyncResult({ success: false, error: "Request failed" });
    } finally {
      setSyncing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Clover POS</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Clover POS Integration</h1>
        <p className="text-muted-foreground mt-1">
          Sync inventory between your website and Clover POS system.
        </p>
      </div>

      {/* Connection Status */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Connection Status</h2>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              status?.isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium">
            {status?.isConnected ? "Connected" : "Not Connected"}
          </span>
          {status?.merchantId && (
            <span className="text-sm text-muted-foreground">
              Merchant: {status.merchantId}
            </span>
          )}
        </div>
        {status?.lastSyncAt && (
          <p className="text-sm text-muted-foreground">
            Last sync: {new Date(status.lastSyncAt).toLocaleString()}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleTestConnection}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Test Connection
          </button>
        </div>
        {testResult && (
          <div
            className={`rounded-md p-3 text-sm ${
              testResult.ok
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            }`}
          >
            {testResult.ok
              ? "Connection successful."
              : `Connection failed: ${testResult.error}`}
          </div>
        )}
      </section>

      {/* Sync Controls */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Sync Controls</h2>
        {!status?.isConnected ? (
          <p className="text-sm text-muted-foreground">
            Not connected -- add your Clover API keys to enable sync.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleSync("from")}
                disabled={!!syncing}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {syncing === "from" ? "Syncing..." : "Sync From Clover"}
              </button>
              <button
                onClick={() => handleSync("to")}
                disabled={!!syncing}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {syncing === "to" ? "Syncing..." : "Sync To Clover"}
              </button>
              <button
                onClick={() => handleSync("full")}
                disabled={!!syncing}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {syncing === "full" ? "Syncing..." : "Full Sync"}
              </button>
            </div>
            {syncResult && (
              <div
                className={`rounded-md p-4 text-sm space-y-2 ${
                  syncResult.success
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-red-500/10 text-red-700 dark:text-red-400"
                }`}
              >
                {syncResult.error && <p>{syncResult.error}</p>}
                {syncResult.summary && (
                  <div className="space-y-1">
                    <p>Total items: {syncResult.summary.total}</p>
                    <p>Matched: {syncResult.summary.matched}</p>
                    <p>Updated: {syncResult.summary.updated}</p>
                    <p>Created: {syncResult.summary.created}</p>
                    <p>Skipped: {syncResult.summary.skipped}</p>
                    {syncResult.summary.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc pl-5">
                          {syncResult.summary.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Inventory Mismatches */}
      {mismatches.length > 0 && (
        <section className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            Inventory Mismatches ({mismatches.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Website Stock</th>
                  <th className="pb-2 font-medium">Clover Stock</th>
                  <th className="pb-2 font-medium">Difference</th>
                </tr>
              </thead>
              <tbody>
                {mismatches.map((m) => (
                  <tr key={m.productId} className="border-b border-border/50">
                    <td className="py-2">{m.productName}</td>
                    <td className="py-2">{m.websiteStock}</td>
                    <td className="py-2">{m.cloverStock}</td>
                    <td className="py-2 font-medium">
                      {m.cloverStock - m.websiteStock > 0 ? "+" : ""}
                      {m.cloverStock - m.websiteStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Setup Instructions */}
      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Setup Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
          <li>
            Log in to your Clover Dashboard at{" "}
            <a
              href="https://www.clover.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              clover.com/dashboard
            </a>
          </li>
          <li>
            Navigate to <strong>Account &amp; Setup</strong> {">"}{" "}
            <strong>API Tokens</strong>
          </li>
          <li>
            Create a new API token with <strong>Inventory</strong>,{" "}
            <strong>Orders</strong>, and <strong>Payments</strong> read/write
            permissions
          </li>
          <li>Copy your Merchant ID (shown in the URL or under Business Information)</li>
          <li>
            Add these environment variables to your deployment:
            <pre className="mt-2 rounded bg-muted p-3 text-xs overflow-x-auto">
              {`CLOVER_MERCHANT_ID=your_merchant_id
CLOVER_API_TOKEN=your_api_token
CLOVER_ENVIRONMENT=sandbox
CLOVER_WEBHOOK_SECRET=your_webhook_secret`}
            </pre>
          </li>
          <li>
            Or use the OAuth flow: navigate to{" "}
            <strong>/api/clover/oauth</strong> to connect via Clover app
            authorization
          </li>
          <li>
            For webhooks, set your webhook URL in Clover to:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              https://your-domain.com/api/clover/webhook
            </code>
          </li>
        </ol>
      </section>
    </div>
  );
}
