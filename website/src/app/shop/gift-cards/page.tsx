"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Gift, Loader2, CreditCard, Check, ArrowRight } from "lucide-react";

const PRESET_AMOUNTS = [25, 50, 100, 250];

export default function GiftCardsPage() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";
  const successAmount = searchParams.get("amount");

  const [selectedAmount, setSelectedAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const activeAmount = isCustom ? Number(customAmount) : selectedAmount;

  const handlePurchase = async () => {
    if (!activeAmount || activeAmount < 5 || activeAmount > 500) {
      toast.error("Amount must be between $5 and $500");
      return;
    }
    if (!senderEmail || !senderEmail.includes("@")) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: activeAmount,
          recipientEmail,
          recipientName,
          message,
          senderEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to purchase gift card";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">Gift Card Purchased!</h1>
          <p className="mt-2 text-muted-foreground">
            {successAmount
              ? `Your $${Number(successAmount).toFixed(2)} gift card has been created.`
              : "Your gift card has been created."}
            {" "}If you provided a recipient email, they will receive it shortly.
          </p>
          <Button asChild className="mt-6">
            <a href="/shop/gift-cards">Purchase Another</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#FB4F14]/10 px-4 py-2 text-sm font-medium text-[#FB4F14] mb-4">
          <Gift className="h-4 w-4" />
          Digital Gift Cards
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Give the Gift of Heat
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Send a Secured Tampa digital gift card. Perfect for sneakerheads and collectors.
          Delivered instantly via email.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left - Configuration */}
        <div className="space-y-6">
          {/* Amount Selection */}
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold text-lg mb-4">Select Amount</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setIsCustom(false);
                  }}
                  className={cn(
                    "rounded-xl border-2 p-4 text-center font-bold text-lg transition-all",
                    !isCustom && selectedAmount === amt
                      ? "border-[#FB4F14] bg-[#FB4F14]/10 text-[#FB4F14]"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={cn(
                  "rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
                  isCustom
                    ? "border-[#FB4F14] bg-[#FB4F14]/10 text-[#FB4F14]"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                Custom Amount
              </button>
              {isCustom && (
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <Input
                    type="number"
                    min={5}
                    max={500}
                    placeholder="5 - 500"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-7"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold text-lg mb-4">Recipient Details (Optional)</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Leave blank to receive the gift card yourself.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input
                  placeholder="Their name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="their@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Personal Message</Label>
                <Textarea
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={400}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/400</p>
              </div>
            </div>
          </div>

          {/* Sender Email */}
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-bold text-lg mb-4">Your Email</h2>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="you@email.com"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">We'll send your receipt here</p>
            </div>
          </div>
        </div>

        {/* Right - Preview & Purchase */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-4">
          {/* Card Preview */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #002244, #003366)" }}>
            <div className="p-8 text-white text-center">
              <p className="text-xs uppercase tracking-widest opacity-60 mb-2">Gift Card</p>
              <p className="text-4xl font-bold">
                ${(activeAmount || 0).toFixed(2)}
              </p>
              <div className="mt-4 inline-block bg-white/15 rounded-lg px-4 py-2">
                <p className="text-xs opacity-60 uppercase tracking-wider">Code</p>
                <p className="font-mono text-sm tracking-wider">SEC-XXXX-XXXX-XXXX</p>
              </div>
              <p className="mt-4 text-xs opacity-50 uppercase tracking-widest">Secured Tampa</p>
            </div>
            <div className="h-1 bg-[#FB4F14]" />
          </div>

          {/* Summary */}
          <div className="rounded-2xl border bg-card p-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gift Card Value</span>
                <span className="font-semibold">${(activeAmount || 0).toFixed(2)}</span>
              </div>
              {recipientName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient</span>
                  <span>{recipientName}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(activeAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={loading || !activeAmount || activeAmount < 5}
              className="w-full mt-4 h-12 text-base font-semibold"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-5 w-5" />
              )}
              Purchase Gift Card
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Delivered instantly via email. No expiration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
