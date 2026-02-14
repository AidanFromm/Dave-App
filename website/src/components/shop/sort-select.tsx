"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-full sm:w-[160px] rounded-full h-9 text-xs sm:text-sm">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="price_asc">Price: Low → High</SelectItem>
        <SelectItem value="price_desc">Price: High → Low</SelectItem>
        <SelectItem value="name_asc">Name: A → Z</SelectItem>
        <SelectItem value="name_desc">Name: Z → A</SelectItem>
      </SelectContent>
    </Select>
  );
}
