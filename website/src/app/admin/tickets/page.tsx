"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  customer_email: string;
  customer_name: string | null;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  ticket_messages: { count: number }[];
}

interface Message {
  id: string;
  sender_type: string;
  sender_name: string | null;
  message: string;
  attachments: string[];
  created_at: string;
}

interface TicketDetail extends Ticket {
  messages: Message[];
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/10 text-yellow-500",
  in_progress: "bg-blue-500/10 text-blue-500",
  resolved: "bg-green-500/10 text-green-500",
  closed: "bg-muted text-muted-foreground",
};

const CATEGORY_LABELS: Record<string, string> = {
  order_issue: "Order Issue",
  product_question: "Product Question",
  authentication: "Authentication",
  general: "General",
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchTickets = useCallback(async () => {
    const res = await fetch("/api/tickets");
    if (res.ok) setTickets(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openTicket = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    const res = await fetch(`/api/tickets/${id}`);
    if (res.ok) setDetail(await res.json());
    setDetailLoading(false);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${selectedId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    if (res.ok) {
      setReply("");
      await openTicket(selectedId);
      fetchTickets();
    }
    setSending(false);
  };

  const updateStatus = async (status: string) => {
    if (!selectedId) return;
    setStatusUpdating(true);
    const res = await fetch(`/api/tickets/${selectedId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      if (detail) setDetail({ ...detail, status });
      fetchTickets();
    }
    setStatusUpdating(false);
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage customer support requests</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-surface-900 p-1 w-fit">
        {[
          { value: "all", label: "All" },
          { value: "open", label: "Open" },
          { value: "in_progress", label: "In Progress" },
          { value: "resolved", label: "Resolved" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "rounded-md px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
              filter === tab.value
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1 opacity-60">
                {tickets.filter((t) => t.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        {/* Ticket list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-surface-800 bg-surface-900 p-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            filtered.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => openTicket(ticket.id)}
                className={cn(
                  "w-full text-left rounded-lg border border-surface-800 bg-surface-900 p-4 min-h-[72px] transition-colors hover:border-primary/30",
                  selectedId === ticket.id && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ticket.customer_name || "Unknown"} — {ticket.customer_email}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(ticket.created_at)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[ticket.status])}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span className="rounded bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {CATEGORY_LABELS[ticket.category] || ticket.category}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="rounded-lg border border-surface-800 bg-surface-900 flex flex-col min-h-[500px]">
          {!selectedId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a ticket to view details
            </div>
          ) : detailLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <>
              {/* Detail header */}
              <div className="border-b border-surface-800 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{detail.subject}</h3>
                    <p className="text-xs text-muted-foreground">
                      {detail.customer_name} — {detail.customer_email}
                    </p>
                  </div>
                  <select
                    value={detail.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    disabled={statusUpdating}
                    className="rounded-md border border-surface-800 bg-background px-2 py-1 text-xs font-medium outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {detail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "max-w-[85%] rounded-lg p-3",
                      msg.sender_type === "admin"
                        ? "ml-auto bg-primary/10 text-foreground"
                        : "bg-surface-800 text-foreground"
                    )}
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {msg.sender_name || (msg.sender_type === "admin" ? "Support" : "Customer")}
                      <span className="ml-2 opacity-60">{timeAgo(msg.created_at)}</span>
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

              {/* Reply */}
              <div className="border-t border-surface-800 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 rounded-lg border border-surface-800 bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendReply();
                    }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
