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
    const key = `visitor_tracked_${pathname}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;

    const track = async () => {
      try {
        // Get IP
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipRes.json();

        // Get geo data
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geo = await geoRes.json();

        await fetch("/api/visitors/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ip,
            city: geo.city || null,
            country: geo.country_name || null,
            region: geo.region || null,
            latitude: geo.latitude || null,
            longitude: geo.longitude || null,
            page_path: pathname || "/",
            user_agent: navigator.userAgent,
            device_type: getDeviceType(),
            referrer: document.referrer || null,
          }),
        });

        sessionStorage.setItem(key, "1");
      } catch {
        // Fire and forget — don't break the site
      }
    };

    track();
  }, [pathname]);

  return null;
}
