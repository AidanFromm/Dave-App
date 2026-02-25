"use client";

import { useState, useEffect } from "react";

const SITE_PASSWORD = "secured";
const STORAGE_KEY = "st_site_access";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {}
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.toLowerCase().trim() === SITE_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FB4F14] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1
            className="text-5xl font-bold text-[#002244]"
            style={{ fontFamily: "var(--font-script)" }}
          >
            Secured
          </h1>
          <p className="text-sm text-gray-500 mt-2 tracking-wide uppercase">
            Tampa
          </p>
        </div>

        {/* Message */}
        <div className="mb-8">
          <p className="text-gray-700 text-sm leading-relaxed">
            We&apos;re currently setting up our inventory.
            <br />
            Enter the password to access the store.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(false);
              }}
              placeholder="Enter password"
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border text-sm text-center tracking-widest font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-[#FB4F14]/30 ${
                error
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 bg-gray-50 focus:border-[#FB4F14]"
              }`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-2">
                Incorrect password. Please try again.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-[#FB4F14] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#e04510] transition-colors"
          >
            Enter Store
          </button>
        </form>

        {/* Footer */}
        <p className="text-gray-400 text-xs mt-10">
          Questions? Call{" "}
          <a href="tel:8139432777" className="text-[#FB4F14] hover:underline">
            (813) 943-2777
          </a>
        </p>
      </div>
    </div>
  );
}
