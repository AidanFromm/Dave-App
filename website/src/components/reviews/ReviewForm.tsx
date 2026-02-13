"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ReviewFormProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewFormProps) {
  const [canReview, setCanReview] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Check if user already reviewed
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setLoading(false);
        return;
      }

      // Check if user purchased this product
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("customer_id", user.id)
        .eq("status", "delivered")
        .limit(100);

      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { data: items } = await supabase
          .from("order_items")
          .select("id")
          .eq("product_id", productId)
          .in("order_id", orderIds)
          .limit(1);

        if (items && items.length > 0) {
          setCanReview(true);
          setIsVerified(true);
        }
      }

      // Allow non-purchasers to review too (without verified badge)
      setCanReview(true);
      setLoading(false);
    }

    check();
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: userId,
      rating,
      title,
      body,
      verified_purchase: isVerified,
      approved: false,
    });

    if (error) {
      toast.error("Failed to submit review. Please try again.");
      setSubmitting(false);
      return;
    }

    toast.success("Review submitted! It will appear after approval.");
    setSubmitted(true);
    setSubmitting(false);
  }

  if (loading) return null;
  if (!userId) return null;
  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-sm font-medium text-primary">
          Thank you for your review! It will be visible after approval.
        </p>
      </div>
    );
  }
  if (!canReview) return null;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-border/50 bg-surface-800/20 p-5"
    >
      <h3 className="font-display text-base font-bold uppercase tracking-tight mb-4">
        Write a Review
      </h3>

      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
          Rating
        </label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div className="mb-3">
        <Input
          placeholder="Review title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-surface-900 border-border/50"
        />
      </div>

      <div className="mb-4">
        <Textarea
          placeholder="Share your experience with this product..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="bg-surface-900 border-border/50 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting || rating === 0}
        className="bg-primary hover:bg-primary/90 text-white"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
