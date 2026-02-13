"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link2, Copy, Loader2, DollarSign, Mail, FileText } from "lucide-react";

export default function PaymentLinksPage() {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [history, setHistory] = useState<
    Array<{ url: string; amount: string; description: string; createdAt: string }>
  >([]);

  const handleGenerate = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          description: description.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create payment link");

      setGeneratedLink(data.url);
      setHistory((prev) => [
        {
          url: data.url,
          amount: `$${amt.toFixed(2)}`,
          description: description.trim() || "Custom Order",
          createdAt: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      await navigator.clipboard.writeText(data.url);
      toast.success("Payment link created and copied to clipboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create payment link";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Payment Links
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate Stripe payment links for Instagram, DM, and phone orders.
        </p>
      </div>

      {/* Generator Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Create Quick Payment Link
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="amount" className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Amount (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.50"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <Mail className="h-3.5 w-3.5" />
              Customer Email (optional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3.5 w-3.5" />
            Description (optional)
          </Label>
          <Input
            id="description"
            placeholder="e.g. Jordan 4 Retro - Size 10"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-[#FB4F14] hover:bg-[#e04400] text-white font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              Generate Payment Link
            </>
          )}
        </Button>

        {generatedLink && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Generated Link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-primary truncate">
                {generatedLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyLink(generatedLink)}
                className="shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4">
            Recent Links (This Session)
          </h2>
          <div className="space-y-2">
            {history.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{link.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {link.amount} &middot; {link.createdAt}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyLink(link.url)}
                  className="ml-2 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
