"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Package,
  Truck,
  Printer,
  Loader2,
  CheckCircle,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface ShippingRate {
  id: string;
  provider: string;
  servicelevel: string;
  amount: string;
  currency: string;
  estimated_days: number | null;
  duration_terms: string | null;
}

interface TrackingEvent {
  status: string;
  status_details: string;
  status_date: string;
  location?: { city?: string; state?: string };
}

interface ShippingSectionProps {
  orderId: string;
  trackingNumber?: string | null;
  labelUrl?: string | null;
  carrier?: string | null;
  shippingRate?: number | null;
  trackingStatus?: string | null;
  trackingHistory?: TrackingEvent[];
  onLabelCreated?: () => void;
}

const TRACKING_STATUS_COLORS: Record<string, string> = {
  UNKNOWN: "bg-gray-500/20 text-gray-400",
  PRE_TRANSIT: "bg-yellow-500/20 text-yellow-400",
  TRANSIT: "bg-blue-500/20 text-blue-400",
  DELIVERED: "bg-green-500/20 text-green-400",
  RETURNED: "bg-red-500/20 text-red-400",
  FAILURE: "bg-red-500/20 text-red-400",
};

export function ShippingSection({
  orderId,
  trackingNumber,
  labelUrl,
  carrier,
  shippingRate,
  trackingStatus,
  trackingHistory = [],
  onLabelCreated,
}: ShippingSectionProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const hasLabel = !!trackingNumber && !!labelUrl;

  const fetchRates = async () => {
    setLoadingRates(true);
    try {
      const res = await fetch(`/api/admin/shipping/rates?orderId=${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRates(data.rates);
      if (data.rates.length > 0) {
        setSelectedRate(data.rates[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch rates");
    } finally {
      setLoadingRates(false);
    }
  };

  const createLabel = async () => {
    if (!selectedRate) {
      toast.error("Select a shipping rate first");
      return;
    }
    setCreatingLabel(true);
    try {
      const res = await fetch("/api/admin/shipping/create-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rateId: selectedRate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Label created! Tracking: ${data.trackingNumber}`);
      onLabelCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to create label");
    } finally {
      setCreatingLabel(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-[#FB4F14]" />
        Shipping
      </h2>

      {/* Label already exists */}
      {hasLabel ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">Label Created</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carrier</span>
              <span className="font-medium">{carrier || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tracking</span>
              <span className="font-mono text-xs">{trackingNumber}</span>
            </div>
            {shippingRate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-medium">${Number(shippingRate).toFixed(2)}</span>
              </div>
            )}
          </div>

          <Button
            size="sm"
            className="w-full bg-[#FB4F14] hover:bg-[#e04400]"
            onClick={() => window.open(labelUrl!, "_blank")}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Print Label
          </Button>

          {/* Tracking status */}
          {trackingStatus && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`border-0 text-xs ${TRACKING_STATUS_COLORS[trackingStatus] || ""}`}
                >
                  {trackingStatus}
                </Badge>
              </div>

              {/* Tracking timeline */}
              {trackingHistory.length > 0 && (
                <div className="space-y-2 mt-2">
                  {trackingHistory.slice(0, 5).map((event, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-2 w-2 rounded-full mt-1 ${
                            i === 0 ? "bg-[#FB4F14]" : "bg-muted-foreground/30"
                          }`}
                        />
                        {i < Math.min(trackingHistory.length, 5) - 1 && (
                          <div className="w-px h-full bg-muted-foreground/20 my-0.5" />
                        )}
                      </div>
                      <div className="pb-2">
                        <p className="font-medium">{event.status_details || event.status}</p>
                        <p className="text-muted-foreground">
                          {event.location?.city && `${event.location.city}, ${event.location.state} · `}
                          {new Date(event.status_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* No label yet — show rate selection */
        <div className="space-y-3">
          {rates.length === 0 ? (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={fetchRates}
              disabled={loadingRates}
            >
              {loadingRates ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Fetching Rates...
                </>
              ) : (
                <>
                  <Package className="mr-1.5 h-4 w-4" />
                  Get Shipping Rates
                </>
              )}
            </Button>
          ) : (
            <>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rates.map((rate) => (
                  <button
                    key={rate.id}
                    onClick={() => setSelectedRate(rate.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedRate === rate.id
                        ? "border-[#FB4F14] bg-[#FB4F14]/10"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{rate.provider}</p>
                        <p className="text-xs text-muted-foreground">{rate.servicelevel}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${rate.amount}</p>
                        {rate.estimated_days && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {rate.estimated_days}d
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                className="w-full bg-[#FB4F14] hover:bg-[#e04400]"
                onClick={createLabel}
                disabled={creatingLabel || !selectedRate}
              >
                {creatingLabel ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Creating Label...
                  </>
                ) : (
                  <>
                    <Printer className="mr-1.5 h-4 w-4" />
                    Generate Label
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
