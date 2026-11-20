"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import { DEFAULT_SLIPPAGE_BPS } from "@/lib/amm/constants";

type Props = {
  bps: number;
  onChange: (bps: number) => void;
};

const PRESETS = [50, 100, 300];

export default function SlippagePopover({ bps, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const applyCustom = () => {
    const value = Number(custom);
    if (!Number.isFinite(value) || value <= 0 || value > 50) return;
    onChange(Math.round(value * 100));
    setCustom("");
    setOpen(false);
  };

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs text-pool-muted transition-colors hover:text-pool-text"
        aria-label="Adjust slippage tolerance"
      >
        Max: {bps / 100}%
        <Settings2 className="size-3.5" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-40 mt-2 w-56 rounded-xl border border-pool-border bg-pool-raised p-3 shadow-2xl"
          >
            <p className="text-xs font-medium text-pool-text">
              Slippage tolerance
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    onChange(preset);
                    setOpen(false);
                  }}
                  className={`rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                    bps === preset
                      ? "border-pool-accent/40 bg-pool-accent/10 text-pool-accent"
                      : "border-pool-border text-pool-muted hover:border-black/20 hover:text-pool-text"
                  }`}
                >
                  {preset / 100}%
                </button>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  value={custom}
                  onChange={(event) =>
                    setCustom(event.target.value.replace(/[^\d.]/g, ""))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") applyCustom();
                  }}
                  inputMode="decimal"
                  placeholder="Custom"
                  className="w-full rounded-lg border border-pool-border bg-pool-panel px-2.5 py-1.5 pr-6 text-xs text-pool-text outline-none transition-colors placeholder:text-pool-muted/70 focus:border-pool-accent/50"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-pool-muted">
                  %
                </span>
              </div>
              <button
                type="button"
                onClick={applyCustom}
                className="rounded-lg bg-pool-accent px-2.5 py-1.5 text-xs font-semibold text-pool-bg transition-opacity hover:opacity-90"
              >
                Set
              </button>
            </div>

            <p className="mt-2 text-[10px] leading-4 text-pool-muted">
              Default {DEFAULT_SLIPPAGE_BPS / 100}%. Higher tolerance accepts a
              worse fill.
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
