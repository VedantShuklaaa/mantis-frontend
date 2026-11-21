"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import Providers, { usePoolData } from "@/app/providers";
import HistoryTable from "@/components/pool/HistoryTable";
import PositionsTable from "@/components/pool/PositionsTable";
import StatsBar from "@/components/pool/StatsBar";
import TradePanel from "@/components/pool/TradePanel";
import { useCandles } from "@/hooks/useCandles";
import {
  DEFAULT_TIMEFRAME,
  type Timeframe,
} from "@/lib/amm/constants";

const ChartPanel = dynamic(
  () => import("@/components/pool/Chart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[430px] animate-pulse rounded-xl border border-pool-border bg-pool-panel" />
    ),
  },
);

type Tab = "positions" | "history";

function PoolScreen() {
  const { pool, poolLoading } = usePoolData();
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [tab, setTab] = useState<Tab>("positions");
  const { candles, stats, loading, error } = useCandles(pool, timeframe);

  return (
    <main className="pool-shell min-h-svh bg-pool-bg text-pool-text">
      <div className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-24 sm:px-6">
        <StatsBar
          pool={pool}
          stats={stats}
          loading={poolLoading || loading}
        />

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section className="min-w-0 lg:col-start-1 lg:row-start-1">
            <ChartPanel
              candles={candles}
              timeframe={timeframe}
              onTimeframe={setTimeframe}
              loading={loading}
              error={error}
            />
          </section>

          <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <TradePanel />
            </div>
          </aside>

          <section className="min-w-0 lg:col-start-1 lg:row-start-2">
            <div className="overflow-hidden rounded-xl border border-pool-border bg-pool-panel">
              <header className="flex items-center gap-1 border-b border-pool-border px-3 py-2">
                {(
                  [
                    { id: "positions", label: "Positions" },
                    { id: "history", label: "History" },
                  ] as const
                ).map((item) => {
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "text-pool-text"
                          : "text-pool-muted hover:text-pool-text"
                      }`}
                    >
                      {active ? (
                        <motion.span
                          layoutId="pool-bottom-tab"
                          className="absolute inset-0 rounded-lg bg-black/[0.06]"
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                          }}
                        />
                      ) : null}
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </header>

              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {tab === "positions" ? <PositionsTable /> : <HistoryTable />}
              </motion.div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function PoolPage() {
  return (
    <Providers>
      <PoolScreen />
    </Providers>
  );
}
