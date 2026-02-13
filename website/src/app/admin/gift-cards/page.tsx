"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  CreditCard,
  Search,
  Loader2,
  Copy,
  Eye,
  Power,
  PowerOff,
} from "lucide-react";

interface GiftCard {
  id: string;
  code: string;
  initial_amount: number;
  remaining_balance: number;
  recipient_email: string | null;
  recipient_name: string | null;
  message: string | null;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  transaction_count: number;
}

interface Transaction {
  id: string;
  gift_card_id: string;
  order_id: string | null;
  amount: number;
  type: string;
  note: string | null;
  created_at: string;
}

function CreateGiftCardModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, recipientEmail, recipientName, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Gift card created: ${data.giftCard.code}`);
      setOpen(false);
      setAmount("");
      setRecipientEmail("");
      setRecipientName("");
      setMessage("");
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Gift Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Create Manual Gift Card
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="50.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Recipient Name (optional)</Label>
            <Input
              placeholder="Customer name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Recipient Email (optional)</Label>
            <Input
              type="email"
              placeholder="customer@email.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">If provided, the gift card will be emailed</p>
          </div>
          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder="Personal message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Gift Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TransactionsModal({ giftCardId, code }: { giftCardId: string; code: string }) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gift-cards/${giftCardId}/transactions`);
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions ?? []);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) loadTransactions(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View usage history">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usage History - {code}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium capitalize">{txn.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.created_at).toLocaleString()}</p>
                    {txn.note && <p className="text-xs text-muted-foreground mt-1">{txn.note}</p>}
                  </div>
                  <span className={`font-mono font-bold ${txn.type === "redemption" ? "text-red-500" : "text-green-500"}`}>
                    {txn.type === "redemption" ? "-" : "+"}${txn.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminGiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCards = async () => {
    try {
      const res = await fetch("/api/admin/gift-cards");
      const data = await res.json();
      if (res.ok) setCards(data.giftCards ?? []);
    } catch {
      toast.error("Failed to load gift cards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCards(); }, []);

  const handleToggleActive = async (card: GiftCard) => {
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, isActive: !card.is_active }),
      });
      if (!res.ok) throw new Error();
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(card.is_active ? "Gift card deactivated" : "Gift card reactivated");
    } catch {
      toast.error("Failed to update gift card");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const filtered = cards.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.recipient_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.recipient_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: cards.length,
    active: cards.filter((c) => c.is_active).length,
    totalValue: cards.reduce((s, c) => s + c.initial_amount, 0),
    outstanding: cards.reduce((s, c) => s + (c.is_active ? c.remaining_balance : 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Gift Cards
          </h1>
          <p className="text-muted-foreground mt-1">Manage digital gift cards</p>
        </div>
        <CreateGiftCardModal onCreated={loadCards} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Cards</p>
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold mt-1 text-green-500">{stats.active}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Sold</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className="text-2xl font-bold mt-1 text-[#FB4F14]">{formatCurrency(stats.outstanding)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by code, email, name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h3 className="mt-4 font-semibold">No Gift Cards Found</h3>
          <p className="text-sm text-muted-foreground mt-1">Create one to get started</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Code</th>
                  <th className="px-4 py-3 text-left font-medium">Recipient</th>
                  <th className="px-4 py-3 text-right font-medium">Initial</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((card) => (
                  <tr key={card.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyCode(card.code)}
                        className="flex items-center gap-1.5 font-mono text-xs hover:text-primary transition-colors"
                        title="Click to copy"
                      >
                        {card.code}
                        <Copy className="h-3 w-3 opacity-50" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {card.recipient_name && <p className="font-medium">{card.recipient_name}</p>}
                        <p className="text-xs text-muted-foreground">{card.recipient_email || "N/A"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(card.initial_amount)}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      <span className={card.remaining_balance > 0 ? "text-green-500" : "text-muted-foreground"}>
                        {formatCurrency(card.remaining_balance)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={card.is_active ? "default" : "secondary"} className={card.is_active ? "bg-green-500" : ""}>
                        {card.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(card.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <TransactionsModal giftCardId={card.id} code={card.code} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(card)}
                          title={card.is_active ? "Deactivate" : "Reactivate"}
                        >
                          {card.is_active ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
