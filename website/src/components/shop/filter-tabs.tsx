"use client";

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
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            selected === f.key
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
