"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export type ShopFilter = "all" | "drops" | "new" | "used" | "pokemon";

interface FilterTabsProps {
  selected: ShopFilter;
  onChange: (filter: ShopFilter) => void;
}

const FILTERS: { key: ShopFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "drops", label: "Drops" },
  { key: "new", label: "New" },
  { key: "used", label: "Used" },
  { key: "pokemon", label: "Pokemon" },
];

export function FilterTabs({ selected, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: All + Drops */}
      <div className="flex gap-2">
        <button
          onClick={() => onChange("all")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            selected === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-accent"
          )}
        >
          All
        </button>
        <button
          onClick={() => onChange("drops")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-colors",
            selected === "drops"
              ? "bg-primary text-primary-foreground"
              : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <Flame className="h-3.5 w-3.5" />
          DROPS
        </button>
      </div>

      {/* Row 2: New, Used, Pokemon */}
      <div className="flex gap-2">
        {FILTERS.filter((f) => !["all", "drops"].includes(f.key)).map((f) => (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              selected === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
