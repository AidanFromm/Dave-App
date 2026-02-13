"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getConsent, setConsent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import Link from "next/link";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  function accept(analyticsVal: boolean, marketingVal: boolean) {
    setConsent({ analytics: analyticsVal, marketing: marketingVal });
    setVisible(false);
    setShowPrefs(false);
  }

  if (!visible) return null;

  return (
    <AnimatePresence>
      {/* Preferences Modal */}
      {showPrefs && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowPrefs(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-surface-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowPrefs(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-800/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Essential - always on */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Essential Cookies
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Required for basic site functionality. Always active.
                  </p>
                </div>
                <Switch checked disabled className="data-[state=checked]:bg-primary" />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Analytics Cookies
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Help us understand how visitors interact with our site.
                  </p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Marketing Cookies
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Used for targeted advertising and retargeting campaigns.
                  </p>
                </div>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-border"
                onClick={() => accept(false, false)}
              >
                Reject All
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
                onClick={() => accept(analytics, marketing)}
              >
                Save Preferences
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Banner */}
      {!showPrefs && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-950/95 backdrop-blur-md p-4 sm:p-6"
        >
          <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                We use cookies to improve your experience
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                We use cookies and similar technologies to personalize content, analyze traffic, and serve
                targeted ads. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
                See our{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details. You may also manage your preferences or opt out of non-essential cookies.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-xs"
                onClick={() => accept(false, false)}
              >
                Essential Only
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-xs"
                onClick={() => setShowPrefs(true)}
              >
                Manage Preferences
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-xs"
                onClick={() => accept(true, true)}
              >
                Accept All
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
