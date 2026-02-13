"use client";

// Cookie consent helpers
const CONSENT_KEY = "cookie-consent";

interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export function getConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export function setConsent(consent: Omit<CookieConsent, "timestamp">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ ...consent, timestamp: Date.now() })
  );
  window.dispatchEvent(new Event("consent-updated"));
}

export function hasMarketingConsent(): boolean {
  const consent = getConsent();
  return consent?.marketing ?? false;
}

export function hasAnalyticsConsent(): boolean {
  const consent = getConsent();
  return consent?.analytics ?? false;
}

// Unified event tracking — fires to both GA4 and Meta Pixel
interface TrackEventParams {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
  metaEvent?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metaParams?: Record<string, any>;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent({ event, params, metaEvent, metaParams }: TrackEventParams) {
  if (typeof window === "undefined") return;
  if (!hasMarketingConsent()) return;

  // GA4
  if (window.gtag) {
    window.gtag("event", event, params);
  }

  // Meta Pixel
  if (window.fbq && metaEvent) {
    window.fbq("track", metaEvent, metaParams ?? params);
  }
}

// Pre-built ecommerce events

export function trackPageView(url: string) {
  trackEvent({
    event: "page_view",
    params: { page_path: url },
    metaEvent: "PageView",
  });
}

export function trackViewItem(item: {
  id: string;
  name: string;
  brand?: string;
  price: number;
  category?: string;
}) {
  trackEvent({
    event: "view_item",
    params: {
      currency: "USD",
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_brand: item.brand,
          item_category: item.category,
          price: item.price,
        },
      ],
    },
    metaEvent: "ViewContent",
    metaParams: {
      content_ids: [item.id],
      content_name: item.name,
      content_type: "product",
      value: item.price,
      currency: "USD",
    },
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
}) {
  trackEvent({
    event: "add_to_cart",
    params: {
      currency: "USD",
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_brand: item.brand,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    },
    metaEvent: "AddToCart",
    metaParams: {
      content_ids: [item.id],
      content_name: item.name,
      content_type: "product",
      value: item.price * item.quantity,
      currency: "USD",
    },
  });
}

export function trackBeginCheckout(items: { id: string; name: string; price: number; quantity: number }[], value: number) {
  trackEvent({
    event: "begin_checkout",
    params: {
      currency: "USD",
      value,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    },
    metaEvent: "InitiateCheckout",
    metaParams: {
      content_ids: items.map((i) => i.id),
      num_items: items.length,
      value,
      currency: "USD",
    },
  });
}

export function trackPurchase(
  transactionId: string,
  items: { id: string; name: string; price: number; quantity: number }[],
  value: number
) {
  trackEvent({
    event: "purchase",
    params: {
      transaction_id: transactionId,
      currency: "USD",
      value,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    },
    metaEvent: "Purchase",
    metaParams: {
      content_ids: items.map((i) => i.id),
      num_items: items.length,
      value,
      currency: "USD",
    },
  });
}
