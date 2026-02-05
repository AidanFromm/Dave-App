"use client";

import { Badge } from "@/components/ui/badge";
import { CONDITION_LABELS } from "@/types/product";
import type { ScanHistoryEntry } from "@/types/barcode";

interface ScanHistoryTableProps {
  entries: ScanHistoryEntry[];
}

export function ScanHistoryTable({ entries }: ScanHistoryTableProps) {
  if (!entries.length) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No scans yet this session. Scan a barcode to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Time</th>
            <th className="px-3 py-2 text-left font-medium">Barcode</th>
            <th className="px-3 py-2 text-left font-medium">Product</th>
            <th className="px-3 py-2 text-left font-medium">Size</th>
            <th className="px-3 py-2 text-left font-medium">Condition</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-border last:border-0">
              <td className="px-3 py-2 text-muted-foreground">
                {new Date(entry.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                {entry.barcode}
              </td>
              <td className="max-w-48 truncate px-3 py-2 font-medium">
                {entry.productName}
              </td>
              <td className="px-3 py-2">{entry.size ?? "--"}</td>
              <td className="px-3 py-2">
                {CONDITION_LABELS[entry.condition]}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                ${entry.price.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-center">
                <Badge
                  variant={entry.status === "added" ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {entry.status === "added" ? "Added" : "Failed"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
