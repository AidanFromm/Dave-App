"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function StockXCallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      if (state === "web") {
        router.push(
          `/admin/settings?stockx=error&error=${encodeURIComponent(error)}`
        );
        return;
      }
      window.location.href = `securedapp://stockx/callback?error=${encodeURIComponent(error)}`;
      return;
    }

    if (state === "web" && code) {
      exchangeToken(code);
      return;
    }

    // iOS flow (default)
    const params = searchParams.toString();
    window.location.href = `securedapp://stockx/callback${params ? `?${params}` : ""}`;
  }, [searchParams, router]);

  async function exchangeToken(code: string) {
    try {
      const res = await fetch("/api/stockx/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        setStatus("success");
        router.push("/admin/settings?stockx=connected");
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? "Token exchange failed");
        setStatus("error");
        setTimeout(
          () =>
            router.push(
              `/admin/settings?stockx=error&error=${encodeURIComponent(data.error ?? "unknown")}`
            ),
          3000
        );
      }
    } catch {
      setErrorMsg("Connection failed");
      setStatus("error");
      setTimeout(
        () =>
          router.push(
            "/admin/settings?stockx=error&error=connection_failed"
          ),
        3000
      );
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      {status === "loading" && (
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-muted-foreground">Connecting StockX...</p>
        </div>
      )}
      {status === "success" && (
        <div className="text-center">
          <p className="font-medium text-green-600">
            StockX connected successfully!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Redirecting to settings...
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="text-center">
          <p className="font-medium text-destructive">Connection failed</p>
          <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Redirecting to settings...
          </p>
        </div>
      )}
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
