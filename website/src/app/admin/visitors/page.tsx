"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import createGlobe from "cobe";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ZoomIn, ZoomOut, RotateCcw, Monitor, Smartphone, Tablet, Globe as GlobeIcon, MapPin, Clock, Eye } from "lucide-react";

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getCountryFlag(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const code = countryCode.toUpperCase();
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function getDeviceIcon(device: string | null) {
  switch (device?.toLowerCase()) {
    case "mobile": return <Smartphone className="h-3.5 w-3.5" />;
    case "tablet": return <Tablet className="h-3.5 w-3.5" />;
    default: return <Monitor className="h-3.5 w-3.5" />;
  }
}

function VisitorGlobe({ locations }: { locations: Array<{ latitude: number; longitude: number }> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const targetScaleRef = useRef(1);
  const phiRef = useRef(0);
  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null);

  const zoom = (direction: "in" | "out" | "reset") => {
    if (direction === "in") targetScaleRef.current = Math.min(targetScaleRef.current + 0.3, 3);
    else if (direction === "out") targetScaleRef.current = Math.max(targetScaleRef.current - 0.3, 0.5);
    else targetScaleRef.current = 1;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

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
      theta: 0.25,
      dark: 1,
      diffuse: 3,
      mapSamples: 40000,
      mapBrightness: 2.5,
      baseColor: [0.05, 0.2, 0.4],
      markerColor: [0.98, 0.31, 0.08],
      glowColor: [0.1, 0.3, 0.5],
      markers: locations.map((v) => ({
        location: [v.latitude, v.longitude] as [number, number],
        size: 0.07,
      })),
      scale: 1,
      onRender: (state) => {
        // Smooth zoom interpolation
        scaleRef.current += (targetScaleRef.current - scaleRef.current) * 0.1;
        state.phi = phiRef.current;
        phiRef.current += 0.003;
        state.width = width * 2;
        state.height = width * 2;
        (state as any).scale = scaleRef.current;
      },
    });
    globeRef.current = globe;

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [locations]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full max-w-[520px] aspect-square mx-auto">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", contain: "layout paint size" }}
        />
      </div>
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={() => zoom("in")}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoom("out")}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoom("reset")}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
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

      {/* Globe Section */}
      <div className="rounded-2xl shadow-card overflow-hidden border border-surface-800" style={{ background: "radial-gradient(ellipse at 50% 0%, #0a2a4a 0%, #001428 50%, #000a14 100%)" }}>
        <div className="pt-6 pb-2 px-6">
          <div className="flex items-center justify-center gap-2">
            <GlobeIcon className="h-4 w-4 text-[#FB4F14]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Live Visitor Map
            </p>
          </div>
          {stats && (
            <p className="text-center text-sm text-white/40 mt-1">
              {stats.locations.length} active location{stats.locations.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="px-4 pb-4">
          {loading || !stats ? (
            <div className="w-full max-w-[520px] aspect-square mx-auto flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-white/5 animate-pulse" />
            </div>
          ) : (
            <VisitorGlobe locations={stats.locations} />
          )}
        </div>
        {/* Globe Footer Stats */}
        {stats && (
          <div className="grid grid-cols-3 border-t border-white/10">
            <div className="p-4 text-center border-r border-white/10">
              <p className="text-2xl font-bold text-white">{stats.totalToday}</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wide">Today</p>
            </div>
            <div className="p-4 text-center border-r border-white/10">
              <p className="text-2xl font-bold text-white">{stats.uniqueIPs}</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wide">Unique IPs</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalAllTime.toLocaleString()}</p>
              <p className="text-[11px] text-white/50 uppercase tracking-wide">All Time</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card shadow-card p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl bg-card shadow-card p-4 border border-surface-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Page Views</p>
              </div>
              <p className="text-3xl font-bold">{stats.totalToday}</p>
            </div>
            <div className="rounded-xl bg-card shadow-card p-4 border border-surface-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <GlobeIcon className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unique IPs</p>
              </div>
              <p className="text-3xl font-bold">{stats.uniqueIPs}</p>
            </div>
            <div className="rounded-xl bg-card shadow-card p-4 border border-surface-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <MapPin className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top Country</p>
              </div>
              <p className="text-3xl font-bold">{getCountryFlag(stats.topCountry)} {stats.topCountry}</p>
            </div>
            <div className="rounded-xl bg-card shadow-card p-4 border border-surface-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <MapPin className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top City</p>
              </div>
              <p className="text-2xl font-bold truncate">{stats.topCity}</p>
            </div>
          </>
        )}
      </div>

      {/* Visitor Log Table */}
      <div className="rounded-xl bg-card shadow-card overflow-hidden border border-surface-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-800">
          <h2 className="text-sm font-semibold">Recent Visitors</h2>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by country (e.g. US)"
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
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Page</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {isTableLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-800/50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <GlobeIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">No visitors recorded yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Visitors will appear here as they browse the store</p>
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="border-b border-surface-800/50 hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-surface-800 px-2 py-1 rounded">{v.ip || "Unknown"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getCountryFlag(v.country)}</span>
                        <div>
                          <p className="text-sm font-medium">{v.city || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{v.country || "Unknown"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs max-w-[200px] truncate block">{v.page_path || "/"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {getDeviceIcon(v.device_type)}
                        <span className="capitalize text-xs">{v.device_type || "Desktop"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs whitespace-nowrap">{timeAgo(v.created_at)}</span>
                      </div>
                    </td>
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
