"use client";

import { ScanOut } from "@/components/admin/scan-out";

export default function POSPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Point of Sale</h1>
        <p className="text-base text-muted-foreground">
          Scan product, collect payment, print receipt
        </p>
      </div>
      <ScanOut />
    </div>
  );
}
