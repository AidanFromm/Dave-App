"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ScanCard, type Scan } from "@/components/scanner/scan-card";
import { ScanStatusBadge } from "@/components/scanner/scan-status-badge";
import { toast } from "sonner";
import {
  Loader2,
  ScanBarcode,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
} from "lucide-react";

export default function ScannerDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const pendingCount = scans.filter((s) => s.status === "pending").length;
  const pricedCount = scans.filter((s) => s.status === "priced").length;

  // Load existing scans from today
  useEffect(() => {
    if (!user) return;

    async function fetchScans() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("user_id", user!.id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

      if (!error && data) {
        setScans(data as Scan[]);
      }
      setLoading(false);
    }

    fetchScans();
  }, [user, supabase]);

  // Subscribe to Realtime INSERT events
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("scans-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newScan = payload.new as Scan;
          setScans((prev) => {
            // Avoid duplicates
            if (prev.some((s) => s.id === newScan.id)) return prev;
            return [newScan, ...prev];
          });

          toast.success(`New scan: ${newScan.upc}`, {
            description: newScan.product_name ?? "Pending product lookup",
          });

          // Auto-scroll to top
          feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const handlePrice = useCallback(
    async (id: string, price: number) => {
      const { error } = await supabase
        .from("scans")
        .update({ final_price: price, status: "priced" })
        .eq("id", id);

      if (error) {
        toast.error("Failed to update price");
        return;
      }

      setScans((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, final_price: price, status: "priced" as const } : s
        )
      );
      toast.success("Price saved");
    },
    [supabase]
  );

  const handleDismiss = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("scans")
        .update({ status: "dismissed" })
        .eq("id", id);

      if (error) {
        toast.error("Failed to dismiss");
        return;
      }

      setScans((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "dismissed" as const } : s
        )
      );
    },
    [supabase]
  );

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">
            Live Scanner
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Scan barcodes on your phone, price them here
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={cn_status(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
              connected
                ? "bg-green-500/15 text-green-400"
                : "bg-red-500/15 text-red-400"
            )}
          >
            {connected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {connected ? "Live" : "Connecting..."}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Scans" value={scans.length} icon={ScanBarcode} />
        <StatCard
          label="Pending"
          value={pendingCount}
          icon={Smartphone}
          highlight={pendingCount > 0}
        />
        <StatCard label="Priced" value={pricedCount} icon={Monitor} />
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 p-4">
          <p className="text-xs text-muted-foreground mb-1">Phone scanner</p>
          <code className="text-xs font-mono text-primary break-all text-center">
            securedtampa.com/scan
          </code>
        </div>
      </div>

      {/* Scan feed */}
      <div ref={feedRef} className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : scans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScanBarcode className="mb-4 h-12 w-12 text-surface-700" />
            <h3 className="text-lg font-medium text-foreground">No scans yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Open{" "}
              <code className="rounded bg-surface-800 px-1.5 py-0.5 text-xs font-mono text-primary">
                securedtampa.com/scan
              </code>{" "}
              on your phone to start scanning
            </p>
          </div>
        ) : (
          scans.map((scan) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onPrice={handlePrice}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>
    </div>
  );
}

function cn_status(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn_status(
        "rounded-xl border p-4",
        highlight
          ? "border-yellow-500/30 bg-yellow-500/5"
          : "border-surface-800 bg-surface-900"
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p
        className={cn_status(
          "mt-1 text-2xl font-bold",
          highlight ? "text-yellow-400" : "text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}
