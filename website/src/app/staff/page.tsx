"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Clock,
  LogIn,
  LogOut,
  ScanBarcode,
  Package,
  Bell,
  CheckCircle2,
  AlertCircle,
  Camera,
  ClipboardList,
} from "lucide-react";

function StockXStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/stockx/search?q=test")
      .then((r) => setConnected(r.ok))
      .catch(() => setConnected(false));
  }, []);

  if (connected === null) return null;

  return (
    <div className="rounded-xl border border-surface-800 bg-surface-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${connected ? "bg-green-900/30" : "bg-yellow-900/30"}`}>
            <Package className={`h-5 w-5 ${connected ? "text-green-400" : "text-yellow-400"}`} />
          </div>
          <div>
            <h3 className="font-medium text-sm">StockX Product Database</h3>
            <p className="text-xs text-muted-foreground">
              {connected ? "Connected — scan to auto-fill products" : "Not connected — connect to enable product lookups"}
            </p>
          </div>
        </div>
        {!connected && (
          <a
            href="/api/stockx/auth"
            className="rounded-lg bg-primary hover:bg-brand-orange-600 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Connect StockX
          </a>
        )}
        {connected && (
          <span className="text-xs font-medium text-green-400 bg-green-900/20 px-3 py-1 rounded-full">
            Connected
          </span>
        )}
      </div>
    </div>
  );
}

interface ClockEntry {
  id: string;
  clock_in: string;
  clock_out: string | null;
  hours: number | null;
  notes: string | null;
}

interface OrderTask {
  id: string;
  order_number?: string;
  status: string;
  created_at: string;
  total: number;
}

export default function StaffPortal() {
  const { user } = useAuth();
  const supabase = createClient();
  const [currentEntry, setCurrentEntry] = useState<ClockEntry | null>(null);
  const [todayHours, setTodayHours] = useState(0);
  const [clockLoading, setClockLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [orders, setOrders] = useState<OrderTask[]>([]);
  const [now, setNow] = useState(new Date());

  const loadClockStatus = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("staff_clock_entries")
      .select("*")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setCurrentEntry(data[0]);
    else setCurrentEntry(null);

    // Today's total hours
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayEntries } = await supabase
      .from("staff_clock_entries")
      .select("hours")
      .eq("user_id", user.id)
      .gte("clock_in", todayStart.toISOString())
      .not("hours", "is", null);
    if (todayEntries) {
      setTodayHours(todayEntries.reduce((sum, e) => sum + (e.hours || 0), 0));
    }
  }, [user, supabase]);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at, total")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setOrders(data);
  }, [supabase]);

  useEffect(() => {
    loadClockStatus();
    loadOrders();
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [loadClockStatus, loadOrders]);

  const handleClockIn = async () => {
    if (!user) return;
    setClockLoading(true);
    await supabase.from("staff_clock_entries").insert({ user_id: user.id, clock_in: new Date().toISOString() });
    await supabase.from("staff_activity_log").insert({ user_id: user.id, action: "clock_in" });
    await loadClockStatus();
    setClockLoading(false);
  };

  const handleClockOut = async () => {
    if (!user || !currentEntry) return;
    setClockLoading(true);
    const clockOut = new Date();
    const clockIn = new Date(currentEntry.clock_in);
    const hours = Math.round(((clockOut.getTime() - clockIn.getTime()) / 3600000) * 100) / 100;
    await supabase
      .from("staff_clock_entries")
      .update({ clock_out: clockOut.toISOString(), hours })
      .eq("id", currentEntry.id);
    await supabase.from("staff_activity_log").insert({ user_id: user.id, action: "clock_out", details: { hours } });
    await loadClockStatus();
    setClockLoading(false);
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .or(`sku.eq.${scanInput},barcode.eq.${scanInput}`)
      .limit(1);
    setScanResult(data && data.length > 0 ? data[0] : { error: "Product not found" });
    if (user) {
      await supabase.from("staff_activity_log").insert({
        user_id: user.id,
        action: "product_scan",
        details: { query: scanInput },
      });
    }
  };

  const elapsed = currentEntry
    ? Math.round((now.getTime() - new Date(currentEntry.clock_in).getTime()) / 1000)
    : 0;
  const elapsedStr = `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m ${elapsed % 60}s`;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight">
            Staff Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-primary tabular-nums">
            {now.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Clock In/Out Card */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold uppercase">Time Clock</h2>
            <p className="text-xs text-muted-foreground">
              Today: {todayHours.toFixed(2)}h logged
            </p>
          </div>
        </div>

        {currentEntry ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-secured-success">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Clocked in since {new Date(currentEntry.clock_in).toLocaleTimeString()}</span>
            </div>
            <p className="font-mono text-3xl font-bold text-center py-4 tabular-nums">{elapsedStr}</p>
            <button
              onClick={handleClockOut}
              disabled={clockLoading}
              className="w-full rounded-lg bg-red-600 hover:bg-red-700 text-white font-display font-bold uppercase tracking-wider py-4 text-lg transition-colors disabled:opacity-50"
            >
              <LogOut className="inline h-5 w-5 mr-2" />
              Clock Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleClockIn}
            disabled={clockLoading}
            className="w-full rounded-lg bg-primary hover:bg-brand-orange-600 text-white font-display font-bold uppercase tracking-wider py-4 text-lg transition-colors disabled:opacity-50"
          >
            <LogIn className="inline h-5 w-5 mr-2" />
            Clock In
          </button>
        )}
      </div>

      {/* StockX Connection */}
      <StockXStatus />

      {/* Quick Scan */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <ScanBarcode className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold uppercase">Quick Scan</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="Scan barcode or enter SKU..."
            className="flex-1 rounded-lg border border-surface-700 bg-surface-850 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus={scanMode}
          />
          <button
            onClick={handleScan}
            className="rounded-lg bg-primary hover:bg-brand-orange-600 text-white px-6 py-3 font-medium transition-colors"
          >
            Search
          </button>
        </div>
        {scanResult && (
          <div className="mt-4 rounded-lg border border-surface-700 bg-surface-850 p-4">
            {scanResult.error ? (
              <div className="flex items-center gap-2 text-secured-error">
                <AlertCircle className="h-4 w-4" />
                <span>{scanResult.error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {scanResult.images?.[0] && (
                  <img src={scanResult.images[0]} alt="" className="h-16 w-16 rounded-lg object-contain bg-white p-1" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{scanResult.name}</p>
                  <p className="text-sm text-muted-foreground">SKU: {scanResult.sku || "N/A"}</p>
                  <p className="text-lg font-bold text-primary">${scanResult.price?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="text-xl font-bold">{scanResult.stock ?? "—"}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Today's Tasks */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold uppercase">Today&apos;s Tasks</h2>
          {orders.length > 0 && (
            <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
              {orders.length}
            </span>
          )}
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-lg border border-surface-700 bg-surface-850 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Order #{order.order_number || order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold">${order.total?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Order Notifications */}
      <div className="rounded-xl border border-surface-800 bg-surface-900 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold uppercase">Notifications</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time order notifications will appear here when connected to Supabase Realtime.
        </p>
      </div>
    </div>
  );
}
