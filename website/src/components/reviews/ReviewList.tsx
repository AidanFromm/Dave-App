"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./StarRating";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  admin_response: string | null;
  created_at: string;
  photos: string[];
}

export function ReviewList({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avg, setAvg] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("reviews")
      .select("id, rating, title, body, verified_purchase, admin_response, created_at, photos")
      .eq("product_id", productId)
      .eq("approved", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const items = (data ?? []) as Review[];
        setReviews(items);
        if (items.length > 0) {
          setAvg(items.reduce((s, r) => s + r.rating, 0) / items.length);
        }
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-border/50 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">
          Customer Reviews
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarRating rating={avg} size="md" showValue />
            <span className="text-xs text-muted-foreground">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No reviews yet. Be the first to review this product.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border/50 bg-surface-800/20 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    {review.verified_purchase && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-green-500/30 text-green-500 gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="mt-1.5 text-sm font-semibold text-foreground">
                      {review.title}
                    </h4>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              {review.body && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {review.body}
                </p>
              )}

              {review.photos && review.photos.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {review.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`Review photo ${i + 1}`}
                      className="h-16 w-16 rounded-lg object-cover border border-border/50"
                    />
                  ))}
                </div>
              )}

              {review.admin_response && (
                <div className="mt-3 ml-4 border-l-2 border-primary/50 pl-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Secured Tampa Response
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.admin_response}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
