"use client";

import { useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, X, Upload, Loader2, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "order_issue", label: "Order Issue" },
  { value: "product_question", label: "Product Question" },
  { value: "authentication", label: "Authentication" },
  { value: "general", label: "General" },
];

export function HelpButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  // Hide on admin pages
  if (pathname?.startsWith("/admin")) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit ticket");
      }

      setSuccess(true);
      form.reset();
      setFileName("");
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#002244] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#002244]/90 hover:shadow-xl"
        >
          <HelpCircle className="h-4 w-4" />
          Need Help?
        </button>
      )}

      {/* Slide-up panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className="absolute inset-0 -top-screen bg-black/30"
            style={{ top: "-100vh" }}
            onClick={() => !submitting && setOpen(false)}
          />
          <div className="relative mx-auto max-w-lg rounded-t-2xl border border-b-0 border-surface-800 bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-800 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold">Contact Support</h3>
                <p className="text-xs text-muted-foreground">We typically respond within a few hours</p>
              </div>
              <button
                onClick={() => !submitting && setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 px-5 py-10">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm font-medium">Ticket submitted! We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 px-5 py-4 max-h-[65vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                    <input
                      name="name"
                      required
                      className="w-full rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-sm outline-none focus:border-[#FB4F14] transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-sm outline-none focus:border-[#FB4F14] transition-colors"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                  <select
                    name="category"
                    required
                    className="w-full rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-sm outline-none focus:border-[#FB4F14] transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Subject</label>
                  <input
                    name="subject"
                    required
                    className="w-full rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-sm outline-none focus:border-[#FB4F14] transition-colors"
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
                  <textarea
                    name="message"
                    required
                    rows={3}
                    className="w-full rounded-lg border border-surface-800 bg-surface-900 px-3 py-2 text-sm outline-none focus:border-[#FB4F14] transition-colors resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Attach Image (optional)</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-surface-800 px-3 py-2 text-sm text-muted-foreground hover:border-[#FB4F14]/50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    {fileName || "Click to attach (max 5MB)"}
                  </div>
                  <input
                    ref={fileRef}
                    name="attachment"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-[#FB4F14] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FB4F14]/90 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </span>
                  ) : (
                    "Submit Ticket"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
