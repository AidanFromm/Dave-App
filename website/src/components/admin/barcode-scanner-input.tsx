"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { ScanBarcode, Loader2 } from "lucide-react";

interface BarcodeScannerInputProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function BarcodeScannerInput({
  onScan,
  disabled,
  loading,
}: BarcodeScannerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on mount and after every scan
  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  // Re-focus when loading state changes (scan complete)
  useEffect(() => {
    if (!loading) {
      focusInput();
    }
  }, [loading, focusInput]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || loading) return;

    // 300ms debounce to prevent double-scans
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onScan(trimmed);
      setValue("");
    }, 100);
  }, [value, disabled, loading, onScan]);

  return (
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
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder={loading ? "Looking up..." : "Scan barcode or type UPC..."}
        disabled={disabled || loading}
        className="h-14 pl-11 text-lg font-mono"
        autoComplete="off"
        autoFocus
      />
      {value && !loading && (
        <p className="mt-1 text-xs text-muted-foreground">
          Press Enter to scan
        </p>
      )}
    </div>
  );
}
