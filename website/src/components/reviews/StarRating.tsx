"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  count?: number;
}

const SIZES = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({
  rating,
  maxStars = 5,
  size = "sm",
  interactive = false,
  onChange,
  showValue = false,
  count,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const filled = starValue <= Math.round(rating);
          return (
            <button
              key={i}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              className={cn(
                "transition-colors",
                interactive && "cursor-pointer hover:scale-110"
              )}
            >
              <Star
                className={cn(
                  SIZES[size],
                  filled
                    ? "fill-[#FB4F14] text-[#FB4F14]"
                    : "fill-none text-muted-foreground/30"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="text-xs font-mono font-medium text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground ml-1">
          ({count})
        </span>
      )}
    </div>
  );
}
