"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getDeviceType(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname?.startsWith("/admin")) return;

    // Track once per page path per session
    const key = `vt_${pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
    } catch {
      // sessionStorage not available
    }

    const track = async () => {
      try {
        await fetch("/api/visitors/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page_path: pathname || "/",
            device_type: getDeviceType(),
            referrer: document.referrer || null,
            screen_width: window.screen.width,
          }),
        });
        try { sessionStorage.setItem(key, "1"); } catch {}
      } catch {
        // Fire and forget
      }
    };

    // Small delay so it doesn't block initial render
    const t = setTimeout(track, 1000);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
