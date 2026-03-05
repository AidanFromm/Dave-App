"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ScanStatus = "pending" | "priced" | "dismissed";

const STATUS_CONFIG: Record<ScanStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  priced: {
    label: "Priced",
    className: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  dismissed: {
    label: "Dismissed",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

export function ScanStatusBadge({ status }: { status: ScanStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
