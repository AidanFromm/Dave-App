"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function StockXCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirect to iOS app with query params preserved
    const params = searchParams.toString();
    window.location.href = `securedapp://stockx/callback${params ? `?${params}` : ""}`;
  }, [searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Redirecting to Secured App...</p>
    </div>
  );
}

export default function StockXCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      }
    >
      <StockXCallbackInner />
    </Suspense>
  );
}
