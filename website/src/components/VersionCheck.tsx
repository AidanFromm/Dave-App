"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-refresh when a new deployment is detected.
 * Polls /api/health every 30s. If the build ID changes, reloads the page.
 */
export default function VersionCheck() {
  const buildId = useRef<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = await res.json();
        const currentId = data?.buildId || data?.status || "unknown";

        if (buildId.current === null) {
          buildId.current = currentId;
        } else if (buildId.current !== currentId) {
          // New deploy detected — reload
          window.location.reload();
        }
      } catch {
        // Silently ignore network errors
      }
    };

    // Check every 30 seconds
    const interval = setInterval(check, 30_000);
    check(); // Initial check

    return () => clearInterval(interval);
  }, []);

  return null;
}
