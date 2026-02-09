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
  const lastKeyTimeRef = useRef<number>(0);
  const isRapidInputRef = useRef(false);
  const autoSubmitRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focusInput = useCallback(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    focusInput();
  }, [focusInput]);

  useEffect(() => {
    if (!loading) {
      focusInput();
    }
  }, [loading, focusInput]);

  const handleSubmit = useCallback((val: string) => {
    const trimmed = val.trim();
    if (!trimmed || disabled || loading) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onScan(trimmed);
      setValue("");
      isRapidInputRef.current = false;
    }, 100);
  }, [disabled, loading, onScan]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    // Detect rapid input (barcode scanner sends chars < 50ms apart)
    if (timeSinceLastKey < 50 && newValue.length > 1) {
      isRapidInputRef.current = true;
    }

    // If rapid input detected, auto-submit after 300ms of no new input
    if (isRapidInputRef.current) {
      if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
      autoSubmitRef.current = setTimeout(() => {
        if (newValue.trim()) {
          handleSubmit(newValue);
        }
        isRapidInputRef.current = false;
      }, 300);
    }
  }, [handleSubmit]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (autoSubmitRef.current) clearTimeout(autoSubmitRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
  );
}
