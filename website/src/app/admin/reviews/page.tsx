"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Search,
  Loader2,
} from "lucide-react";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  photos: string[];
  verified_purchase: boolean;
  approved: boolean;
  admin_response: string | null;
  created_at: string;
  products?: { name: string; images: string[] } | null;
}

type FilterTab = "pending" | "approved" | "rejected";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createClient();

  async function fetchReviews() {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("*, products(name, images)")
      .order("created_at", { ascending: false });

    if (tab === "pending") {
      query = query.eq("approved", false);
    } else if (tab === "approved") {
      query = query.eq("approved", true);
    }

    const { data } = await query;
    setReviews((data as Review[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    const { error } = await supabase
      .from("reviews")
      .update({ approved: true })
      .eq("id", id);
    if (error) {
      toast.error("Failed to approve review");
    } else {
      toast.success("Review approved");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
    setActionLoading(null);
  }

  async function handleReject(id: string) {
    setActionLoading(id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete review");
    } else {
      toast.success("Review removed");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    }
    setActionLoading(null);
  }

  async function handleRespond(id: string) {
    if (!responseText.trim()) return;
    setActionLoading(id);
    const { error } = await supabase
      .from("reviews")
      .update({ admin_response: responseText.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to save response");
    } else {
      toast.success("Response saved");
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, admin_response: responseText.trim() } : r
        )
      );
      setRespondingId(null);
      setResponseText("");
    }
    setActionLoading(null);
  }

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q) ||
      r.products?.name?.toLowerCase().includes(q)
    );
  });

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">
          Reviews
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage customer reviews. Approve, reject, or respond.
        </p>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-surface-900 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${
                tab === t.key
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface-900 border-border/50"
          />
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">
            No {tab} reviews found.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border/50 bg-card p-5"
            >
              <div className="flex items-start gap-4">
                {/* Product thumbnail */}
                {review.products?.images?.[0] && (
                  <img
                    src={review.products.images[0]}
                    alt=""
                    className="h-14 w-14 rounded-lg object-contain bg-white border border-border/50 shrink-0 p-1"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating rating={review.rating} size="sm" />
                    {review.verified_purchase && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-green-500/30 text-green-500 gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {review.products?.name && (
                    <p className="text-[10px] uppercase tracking-wider text-primary font-medium mt-1">
                      {review.products.name}
                    </p>
                  )}

                  {review.title && (
                    <h4 className="text-sm font-semibold mt-1">{review.title}</h4>
                  )}
                  {review.body && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.body}
                    </p>
                  )}

                  {review.admin_response && (
                    <div className="mt-3 ml-4 border-l-2 border-primary/50 pl-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Your Response
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {review.admin_response}
                      </p>
                    </div>
                  )}

                  {/* Response form */}
                  {respondingId === review.id && (
                    <div className="mt-3 flex gap-2">
                      <Textarea
                        placeholder="Write a response..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={2}
                        className="bg-surface-900 border-border/50 resize-none text-sm flex-1"
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          className="bg-primary text-white text-xs"
                          onClick={() => handleRespond(review.id)}
                          disabled={actionLoading === review.id}
                        >
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => {
                            setRespondingId(null);
                            setResponseText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2 border-t border-border/30 pt-3">
                {!review.approved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                    onClick={() => handleApprove(review.id)}
                    disabled={actionLoading === review.id}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleReject(review.id)}
                  disabled={actionLoading === review.id}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {review.approved ? "Remove" : "Reject"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={() => {
                    setRespondingId(review.id);
                    setResponseText(review.admin_response ?? "");
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Respond
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
