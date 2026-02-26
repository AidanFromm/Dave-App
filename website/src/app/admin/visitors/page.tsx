"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import createGlobe from "cobe";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

type FilterPeriod = "1" | "7" | "30";

interface Visitor {
  id: string;
  ip: string;
  city: string | null;
  country: string | null;
  device_type: string | null;
  page_path: string | null;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

interface Stats {
  totalToday: number;
  uniqueIPs: number;
  topCountry: string;
  topCity: string;
  totalAllTime: number;
  locations: Array<{ latitude: number; longitude: number }>;
}

function maskIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  return ip.replace(/:[\da-f]+:[\da-f]+$/, ":x:x");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function VisitorGlobe({ locations }: { locations: Array<{ latitude: number; longitude: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    let width = 0;

    const onResize = () => {
      if (containerRef.current) {
        width = containerRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.0, 0.13, 0.27],
      markerColor: [0.98, 0.31, 0.08],
      glowColor: [0.0, 0.08, 0.16],
      markers: locations.map((v) => ({
        location: [v.latitude, v.longitude] as [number, number],
        size: 0.06,
      })),
      onRender: (state) => {
        state.phi = phi;
        phi += 0.004;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [locations]);

  return (
    <div ref={containerRef} className="w-full max-w-[500px] aspect-square mx-auto">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", contain: "layout paint size" }}
      />
    </div>
  );
}

export default function VisitorsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [filter, setFilter] = useState<FilterPeriod>("1");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [countrySearch, setCountrySearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchVisitors = useCallback(async (days: string, pg: number, country: string) => {
    const params = new URLSearchParams({ days, page: String(pg) });
    if (country) params.set("country", country);
    const res = await fetch(`/api/admin/visitors?${params}`);
    const data = await res.json();
    setVisitors(data.visitors || []);
    setTotal(data.total || 0);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/visitors/stats").then((r) => r.json()),
      fetchVisitors(filter, 0, countrySearch),
    ])
      .then(([statsData]) => {
        setStats(statsData);
        setPage(0);
      })
      .finally(() => setLoading(false));
  }, [filter, fetchVisitors, countrySearch]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setTableLoading(true);
    fetchVisitors(filter, newPage, countrySearch).finally(() => setTableLoading(false));
  };

  const handleCountrySearch = (value: string) => {
    setCountrySearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(0);
    }, 300);
  };

  const totalPages = Math.ceil(total / 50);
  const isTableLoading = loading || tableLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visitors</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time visitor tracking and geolocation</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-800 p-1">
          {([["1", "Today"], ["7", "7 Days"], ["30", "30 Days"]] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === val
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Globe */}
      <div className="rounded-xl shadow-card overflow-hidden" style={{ backgroundColor: "#002244" }}>
        <div className="p-6 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50 text-center">
            Visitor Locations — Last 24 Hours
          </p>
        </div>
        <div className="px-4 pb-6">
          {loading || !stats ? (
            <div className="w-full max-w-[500px] aspect-square mx-auto flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-white/5 animate-pulse" />
            </div>
          ) : (
            <VisitorGlobe locations={stats.locations} />
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading || !stats ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card shadow-card p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard label="Visitors Today" value={stats.totalToday} />
            <StatCard label="Unique IPs" value={stats.uniqueIPs} />
            <StatCard label="Top Country" value={stats.topCountry} />
            <StatCard label="Top City" value={stats.topCity} />
            <StatCard label="All-Time Total" value={stats.totalAllTime.toLocaleString()} />
          </>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        {/* Search */}
        <div className="px-4 py-3 border-b border-surface-800">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by country code (e.g. US)"
              value={countrySearch}
              onChange={(e) => handleCountrySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-surface-800 border border-surface-700 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {isTableLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-800/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No visitors recorded yet
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{maskIP(v.ip || "")}</td>
                    <td className="px-4 py-3">{v.city || "Unknown"}</td>
                    <td className="px-4 py-3">{v.country || "Unknown"}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate">{v.page_path || "/"}</td>
                    <td className="px-4 py-3 capitalize">{v.device_type || "Unknown"}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{timeAgo(v.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-800">
            <span className="text-sm text-muted-foreground">
              {total.toLocaleString()} total visitors
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-md bg-surface-800 text-foreground disabled:opacity-40 hover:bg-surface-700 transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-md bg-surface-800 text-foreground disabled:opacity-40 hover:bg-surface-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-card shadow-card p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
