"use client";

import { cn } from "@/lib/utils";
import type { TimePeriod } from "@/types/admin";

interface TimeSelectorProps {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
];

export function TimeSelector({ selected, onChange }: TimeSelectorProps) {
  return (
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium transition-colors",
            selected === p.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
