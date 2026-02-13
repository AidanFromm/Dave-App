"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#002244] text-white font-sans">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <AlertTriangle className="h-12 w-12 text-[#FB4F14] mx-auto" />
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-sm text-gray-400">
              An unexpected error occurred. The issue has been reported.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 bg-[#FB4F14] text-white rounded-lg text-sm font-medium hover:bg-[#FB4F14]/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
