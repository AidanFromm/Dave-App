"use client";

import { useState } from "react";
import { Search, Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface TicketMessage {
  id: string;
  sender_type: string;
  sender_name: string | null;
  message: string;
  attachments: string[];
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  messages: TicketMessage[];
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  resolved: "bg-green-500/10 text-green-500",
  closed: "bg-neutral-500/10 text-neutral-400",
};

const CATEGORY_LABELS: Record<string, string> = {
  order_issue: "Order Issue",
  product_question: "Product Question",
  authentication: "Authentication",
  general: "General",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CustomerTicketsPage() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setSelectedTicket(null);

    try {
      const res = await fetch(`/api/tickets/lookup?email=${encodeURIComponent(email.trim())}`);
      if (!res.ok) throw new Error("Failed to look up tickets");
      const data = await res.json();
      setTickets(data);
    } catch {
      setError("Something went wrong. Please try again.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Store
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">My Support Tickets</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Enter your email to view your support history
        </p>

        <form onSubmit={lookup} className="flex gap-2 mb-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="flex-1 rounded-lg border border-surface-800 bg-surface-900 px-4 py-2.5 text-sm outline-none focus:border-[#FB4F14] transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#FB4F14] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FB4F14]/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </form>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {selectedTicket ? (
          <div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to tickets
            </button>

            <div className="rounded-lg border border-surface-800 bg-surface-900 overflow-hidden">
              <div className="border-b border-surface-800 p-4">
                <h2 className="text-sm font-semibold">{selectedTicket.subject}</h2>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[selectedTicket.status])}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(selectedTicket.created_at)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] rounded-lg p-3",
                      msg.sender_type === "admin"
                        ? "ml-auto bg-[#FB4F14]/10 text-foreground"
                        : "bg-surface-800 text-foreground"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {msg.sender_name || (msg.sender_type === "admin" ? "Support" : "You")}
                      <span className="ml-2 opacity-60">{formatDate(msg.created_at)}</span>
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt="attachment" className="h-20 w-20 rounded object-cover border border-surface-800" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : searched && !loading ? (
          tickets.length === 0 ? (
            <div className="rounded-lg border border-surface-800 bg-surface-900 p-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tickets found for this email</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left rounded-lg border border-surface-800 bg-surface-900 p-4 transition-colors hover:border-[#FB4F14]/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(ticket.created_at)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[ticket.status])}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className="rounded bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {CATEGORY_LABELS[ticket.category] || ticket.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
