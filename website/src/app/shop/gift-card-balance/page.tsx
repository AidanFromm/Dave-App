"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Loader2, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BalanceResult {
  code: string;
  initialAmount: number;
  remainingBalance: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function GiftCardBalancePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BalanceResult | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/gift-cards/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gift card not found";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FB4F14]/10 mb-4">
          <CreditCard className="h-8 w-8 text-[#FB4F14]" />
        </div>
        <h1 className="text-2xl font-bold">Check Gift Card Balance</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your gift card code to view your remaining balance.
        </p>
      </div>

      <form onSubmit={handleCheck} className="rounded-2xl border bg-card p-6">
        <div className="flex gap-3">
          <Input
            placeholder="SEC-XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono text-center tracking-wider"
          />
          <Button type="submit" disabled={loading || !code.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {result && (
          <div className="mt-6 rounded-xl border bg-muted/50 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Remaining Balance</p>
            <p className="text-4xl font-bold text-[#FB4F14]">
              {formatCurrency(result.remainingBalance)}
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Original Value</span>
                <span>{formatCurrency(result.initialAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={result.isActive ? "text-green-500" : "text-red-500"}>
                  {result.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {result.expiresAt && (
                <div className="flex justify-between">
                  <span>Expires</span>
                  <span>{new Date(result.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Issued</span>
                <span>{new Date(result.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
