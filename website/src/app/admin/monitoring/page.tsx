"use client";

import { useEffect, useState } from "react";
import { Activity, Server, Shield, ExternalLink, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface HealthData {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

export default function AdminMonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      setHealth(data);
      setHealthError(false);
    } catch {
      setHealthError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkHealth(); }, []);

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System health, error tracking, and uptime status
          </p>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#FB4F14] px-4 py-2 text-sm font-medium text-white hover:bg-[#FB4F14]/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* App Version */}
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#002244] p-2">
              <Server className="h-5 w-5 text-[#FB4F14]" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              App Version
            </h3>
          </div>
          <p className="text-2xl font-mono font-bold">{health?.version ?? "--"}</p>
          <p className="text-xs text-muted-foreground">
            Environment: <span className="font-medium text-foreground">{health?.environment ?? "--"}</span>
          </p>
        </div>

        {/* Uptime Check */}
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#002244] p-2">
              <Activity className="h-5 w-5 text-[#FB4F14]" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Health Check
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {healthError ? (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <span className="text-xl font-bold text-red-500">DOWN</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold text-green-500">HEALTHY</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Last check: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "--"}
          </p>
          <p className="text-xs text-muted-foreground">
            Endpoint: <code className="text-[#FB4F14]">/api/health</code>
          </p>
        </div>

        {/* Sentry */}
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#002244] p-2">
              <Shield className="h-5 w-5 text-[#FB4F14]" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Error Tracking
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {sentryDsn ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold text-green-500">ACTIVE</span>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-yellow-500" />
                <span className="text-xl font-bold text-yellow-500">NOT CONFIGURED</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {sentryDsn ? "Sentry is capturing errors" : "Set NEXT_PUBLIC_SENTRY_DSN to enable"}
          </p>
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#FB4F14] hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Open Sentry Dashboard
          </a>
        </div>
      </div>

      {/* Deploy Info */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Deployment Info
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Platform</p>
            <p className="text-sm font-medium">Vercel</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Region</p>
            <p className="text-sm font-medium">{process.env.NEXT_PUBLIC_VERCEL_REGION ?? "iad1"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commit</p>
            <p className="text-sm font-mono font-medium">{process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Branch</p>
            <p className="text-sm font-medium">{process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? "main"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
