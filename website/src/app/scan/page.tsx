"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ScanBarcode, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScanEntry {
  id: string;
  upc: string;
  created_at: string;
}

export default function PhoneScannerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [scannerReady, setScannerReady] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);
  const [inserting, setInserting] = useState(false);

  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScannedRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/sign-in?redirect=/scan");
    }
  }, [authLoading, user, router]);

  const handleScan = useCallback(
    async (upc: string) => {
      if (!user || inserting) return;

      // Deduplicate: ignore same barcode within 5 seconds
      const now = Date.now();
      if (upc === lastScannedRef.current && now - lastScannedTimeRef.current < 5000) {
        return;
      }
      lastScannedRef.current = upc;
      lastScannedTimeRef.current = now;

      // Vibration feedback
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      setInserting(true);
      const { data, error } = await supabase
        .from("scans")
        .insert({ upc, user_id: user.id })
        .select("id, upc, created_at")
        .single();

      setInserting(false);

      if (error) {
        toast.error("Failed to save scan");
        return;
      }

      toast.success(`Scanned: ${upc}`);
      setRecentScans((prev) => [data, ...prev].slice(0, 20));
    },
    [user, inserting, supabase]
  );

  // Initialize camera scanner
  useEffect(() => {
    if (!user || authLoading) return;

    let mounted = true;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !containerRef.current) return;

        const scannerId = "phone-barcode-scanner";
        containerRef.current.id = scannerId;

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 5,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          (decodedText: string) => {
            handleScan(decodedText);
          },
          () => {}
        );

        if (mounted) {
          setScannerReady(true);
          setScannerError(null);
        }
      } catch (err: any) {
        if (mounted) {
          const msg = err?.message ?? "";
          setScannerError(
            msg.includes("NotAllowedError")
              ? "Camera access denied. Please allow camera permissions and reload."
              : msg.includes("NotFoundError")
              ? "No camera found on this device."
              : "Could not start camera. Please check permissions."
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [user, authLoading, handleScan]);

  if (authLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ScanBarcode className="h-5 w-5 text-[#FB4F14]" />
          <span className="font-display text-lg font-bold uppercase tracking-tight">
            Scanner
          </span>
        </div>
        <div className="flex items-center gap-2">
          {inserting && <Loader2 className="h-4 w-4 animate-spin text-[#FB4F14]" />}
          <span className="text-xs text-zinc-400">
            {recentScans.length} scanned
          </span>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative flex-1 bg-black">
        {scannerError ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <ScanBarcode className="mb-4 h-12 w-12 text-red-400" />
            <p className="text-sm text-red-400">{scannerError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div ref={containerRef} className="h-full w-full" />
            {!scannerReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-[#FB4F14]" />
                <p className="mt-3 text-sm text-zinc-400">Starting camera...</p>
              </div>
            )}
            {/* Scan overlay guide */}
            {scannerReady && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="rounded-full bg-black/60 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-sm">
                    Point at barcode to scan
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent scans list */}
      {recentScans.length > 0 && (
        <div className="max-h-[30dvh] overflow-y-auto border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recent Scans
          </div>
          <div className="divide-y divide-zinc-800">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="font-mono text-sm text-white flex-1">{scan.upc}</span>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {new Date(scan.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
