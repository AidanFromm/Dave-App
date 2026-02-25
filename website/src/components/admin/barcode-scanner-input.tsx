"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanBarcode, Loader2, Camera, CameraOff, Keyboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeScannerInputProps {
  onScan: (barcode: string) => void;
  onManualLookup?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function BarcodeScannerInput({
  onScan,
  onManualLookup,
  disabled,
  loading,
}: BarcodeScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const isRapidInputRef = useRef(false);
  const autoSubmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const lastScannedRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  const focusInput = useCallback(() => {
    if (!cameraMode) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [cameraMode]);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    if (!loading) {
      focusInput();
    }
  }, [loading, focusInput]);

  // Camera scanner setup/teardown
  useEffect(() => {
    if (!cameraMode) {
      // Cleanup scanner when switching off
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      setCameraReady(false);
      setCameraError(null);
      return;
    }

    let mounted = true;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!mounted || !cameraContainerRef.current) return;

        const scannerId = "barcode-camera-scanner";
        
        // Make sure container has the id
        cameraContainerRef.current.id = scannerId;

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 2,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.777,
            disableFlip: false,
          },
          (decodedText: string) => {
            // Deduplicate: ignore same barcode within 8 seconds
            const now = Date.now();
            if (
              decodedText === lastScannedRef.current &&
              now - lastScannedTimeRef.current < 8000
            ) {
              return;
            }
            lastScannedRef.current = decodedText;
            lastScannedTimeRef.current = now;
            onScan(decodedText);
          },
          () => {
            // Scan failure (no barcode found in frame) — ignore
          }
        );

        if (mounted) {
          setCameraReady(true);
          setCameraError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setCameraError(
            err?.message?.includes("NotAllowedError")
              ? "Camera permission denied. Please allow camera access."
              : err?.message?.includes("NotFoundError")
              ? "No camera found on this device."
              : "Could not start camera. Try the manual input."
          );
          setCameraReady(false);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [cameraMode, onScan]);

  const handleSubmit = useCallback(
    (val: string) => {
      const trimmed = val.trim();
      if (!trimmed || disabled || loading) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onScan(trimmed);
        setValue("");
        isRapidInputRef.current = false;
      }, 100);
    },
    [disabled, loading, onScan]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);

      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (timeSinceLastKey < 50 && newValue.length > 1) {
        isRapidInputRef.current = true;
      }

      const trimmed = newValue.trim();
      const isUpcLength = /^\d{12,13}$/.test(trimmed);

      if (isRapidInputRef.current || isUpcLength) {
        if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
        const delay = isUpcLength ? 150 : 300;
        autoSubmitRef.current = setTimeout(() => {
          if (newValue.trim()) {
            handleSubmit(newValue);
          }
          isRapidInputRef.current = false;
        }, delay);
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    return () => {
      if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-3">
      {/* Mode toggle — 3 equal tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCameraMode(true)}
          disabled={loading}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3.5 text-sm font-semibold transition-all",
            cameraMode
              ? "border-[#FB4F14] bg-[#FB4F14] text-white shadow-md"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
        >
          <Camera className="h-4 w-4" />
          Camera Scan
        </button>
        <button
          type="button"
          onClick={() => setCameraMode(false)}
          disabled={loading}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3.5 text-sm font-semibold transition-all",
            !cameraMode
              ? "border-[#002244] bg-[#002244] text-white shadow-md"
              : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
          )}
        >
          <Keyboard className="h-4 w-4" />
          Type / Scan Gun
        </button>
        <button
          type="button"
          onClick={() => onManualLookup?.()}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-3 py-3.5 text-sm font-semibold text-muted-foreground transition-all hover:border-foreground/30 hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          Manual Lookup
        </button>
      </div>

      {/* Camera viewfinder */}
      {cameraMode && (
        <div className="relative overflow-hidden rounded-xl border-2 border-[#FB4F14]/30 bg-black">
          {loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#FB4F14]" />
              <p className="mt-2 text-sm text-white/80">Looking up barcode...</p>
            </div>
          )}
          {cameraError && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CameraOff className="mb-3 h-10 w-10 text-red-400" />
              <p className="text-sm text-red-400">{cameraError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setCameraMode(false);
                  setTimeout(() => setCameraMode(true), 100);
                }}
              >
                Retry
              </Button>
            </div>
          )}
          <div
            ref={cameraContainerRef}
            className={cn(
              "w-full",
              cameraError && "hidden"
            )}
            style={{ minHeight: cameraReady ? undefined : "280px" }}
          />
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#FB4F14]" />
              <p className="mt-2 text-sm text-white/60">Starting camera...</p>
            </div>
          )}
        </div>
      )}

      {/* Text input (always shown as fallback, primary when not in camera mode) */}
      {!cameraMode && (
        <div className="relative">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <ScanBarcode className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
                handleSubmit(value);
              }
            }}
            placeholder={loading ? "Looking up..." : "Scan barcode or type UPC..."}
            disabled={disabled || loading}
            className="h-14 pl-11 text-lg font-mono"
            autoComplete="off"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
