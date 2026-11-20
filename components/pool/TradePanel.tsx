"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { usePoolData } from "@/app/providers";
import { DEFAULT_SLIPPAGE_BPS } from "@/lib/amm/constants";
import SwapForm from "./SwapForm";
import WrapForm from "./WrapForm";

type Side = "buy" | "sell";
type View = "swap" | "wrap";

export default function TradePanel() {
  const { refresh } = usePoolData();
  const [side, setSide] = useState<Side>("buy");
  const [view, setView] = useState<View>("swap");
  const [slippageBps, setSlippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      window.setTimeout(() => setRefreshing(false), 350);
    }
  };

  return (
    <section className="rounded-xl border border-pool-border bg-pool-panel p-6">
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-pool-border bg-pool-bg/60 p-1">
        {(
          [
            { id: "buy", label: "Buy MAN" },
            { id: "sell", label: "Sell MAN" },
          ] as const
        ).map((item) => {
          const active = side === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSide(item.id)}
              className={`relative rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                active ? "text-pool-accent" : "text-pool-muted hover:text-pool-text"
              }`}
            >
              {active ? (
                <motion.span
                  layoutId="pool-trade-side"
                  className="absolute inset-0 rounded-lg bg-pool-accent/10 ring-1 ring-pool-accent/25"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-pool-bg/60 p-0.5">
          {(
            [
              { id: "swap", label: "Swap" },
              { id: "wrap", label: "Wrap" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                view === item.id
                  ? "bg-black/[0.06] text-pool-text"
                  : "text-pool-muted hover:text-pool-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={refreshData}
          aria-label="Refresh pool data"
          className="rounded-md p-1.5 text-pool-muted transition-colors hover:bg-black/[0.06] hover:text-pool-text"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-3">
        {view === "swap" ? (
          <SwapForm
            key={side}
            side={side}
            slippageBps={slippageBps}
            onSlippage={setSlippageBps}
          />
        ) : (
          <WrapForm />
        )}
      </div>
    </section>
  );
}
