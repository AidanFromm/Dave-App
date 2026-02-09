"use client";

import { useCallback, useRef } from "react";

type ScanTone = "success" | "duplicate" | "unknown" | "error" | "submit";

const TONES: Record<ScanTone, { frequency: number; duration: number; type: OscillatorType }> = {
  success: { frequency: 1200, duration: 100, type: "sine" },
  duplicate: { frequency: 440, duration: 80, type: "sine" },
  unknown: { frequency: 660, duration: 150, type: "triangle" },
  error: { frequency: 200, duration: 300, type: "sawtooth" },
  submit: { frequency: 880, duration: 120, type: "sine" },
};

export function useScanSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((tone: ScanTone) => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const { frequency, duration, type } = TONES[tone];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);

      // Success: second higher beep
      if (tone === "success") {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.08);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.18);
      }

      // Duplicate: quick double beep
      if (tone === "duplicate") {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(520, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.18);
      }
    } catch {
      // Audio not available
    }
  }, [getCtx]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { playTone, setEnabled, isEnabled: enabledRef };
}
