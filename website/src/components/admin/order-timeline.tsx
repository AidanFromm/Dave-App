"use client";

import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/types/order";

const DOT_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  paid: "bg-blue-500",
  processing: "bg-orange-500",
  shipped: "bg-purple-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  returned: "bg-gray-500",
  refunded: "bg-gray-500",
};

interface TimelineEvent {
  status: string;
  date: string;
  note?: string;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  // Most recent first
  const sorted = [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="relative space-y-0">
      {sorted.map((event, index) => {
        const isLast = index === sorted.length - 1;
        const dotColor = DOT_COLORS[event.status] ?? "bg-gray-400";
        const label =
          ORDER_STATUS_LABELS[event.status as OrderStatus] ?? event.status;

        return (
          <div key={`${event.status}-${event.date}`} className="relative flex gap-3 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
            )}

            {/* Dot */}
            <div className="relative z-10 mt-1 flex-shrink-0">
              <div className={`h-[15px] w-[15px] rounded-full ${dotColor} ring-2 ring-background`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(event.date)}
              </p>
              {event.note && (
                <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
