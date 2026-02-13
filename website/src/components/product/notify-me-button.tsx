"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { subscribeStockAlert, unsubscribeStockAlert, checkStockAlert } from "@/actions/stock-alerts";
import { toast } from "sonner";

interface NotifyMeButtonProps {
  productId: string;
  variantId?: string | null;
}

export function NotifyMeButton({ productId, variantId }: NotifyMeButtonProps) {
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    checkStockAlert(productId, variantId)
      .then((res) => setSubscribed(res.subscribed))
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [user, productId, variantId]);

  const handleClick = async () => {
    if (!user) {
      toast.error("Sign in to get notified when this item is back in stock.");
      return;
    }

    setLoading(true);
    try {
      if (subscribed) {
        const result = await unsubscribeStockAlert(productId, variantId);
        if (result.error) {
          toast.error(result.error);
        } else {
          setSubscribed(false);
          toast.success("You will no longer be notified for this item.");
        }
      } else {
        const result = await subscribeStockAlert(productId, variantId);
        if (result.error) {
          toast.error(result.error);
        } else {
          setSubscribed(true);
          toast.success("We will email you when this item is back in stock.");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Button size="lg" variant="outline" className="w-full h-13" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      variant={subscribed ? "outline" : "default"}
      className="w-full h-13 text-sm font-semibold uppercase tracking-wider"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : subscribed ? (
        <BellOff className="mr-2 h-4 w-4" />
      ) : (
        <Bell className="mr-2 h-4 w-4" />
      )}
      {subscribed ? "Notifications On" : "Notify Me When Available"}
    </Button>
  );
}
