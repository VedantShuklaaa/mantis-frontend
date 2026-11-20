"use client";

import Image from "next/image";
import type { PoolStats } from "@/hooks/useCandles";
import { FALLBACK_FEE_BPS, WSOL_MINT, type PoolState } from "@/lib/amm/constants";
import {
  formatNumber,
  formatPercent,
  formatPrice,
} from "@/lib/amm/format";

type Props = {
  pool: PoolState;
  stats: PoolStats;
  loading: boolean;
};


type PairIconProps = {
  baseSrc: string;
  quoteSrc: string;
  baseAlt?: string;
  quoteAlt?: string;
};

function PairIcon({
  baseSrc,
  quoteSrc,
  baseAlt = "Base token",
  quoteAlt = "Quote token",
}: PairIconProps) {
  return (
    <span className="flex items-center -space-x-2">
      <Image
        src={baseSrc}
        alt={baseAlt}
        width={32}
        height={32}
        className="size-8 rounded-full border-2 border-pool-panel bg-pool-accent"
      />
      <Image
        src={quoteSrc}
        alt={quoteAlt}
        width={32}
        height={32}
        className="size-8 rounded-full border-2 border-pool-panel bg-pool-accent "
      />
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "default",
  prominent = false,
}: {
  label: string;
  value: string;
  tone?: "default" | "accent" | "danger";
  prominent?: boolean;
}) {
  const color =
    tone === "accent"
      ? "text-pool-accent"
      : tone === "danger"
        ? "text-pool-danger"
        : "text-pool-text";

  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-pool-muted">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate font-mono tabular-nums ${color} ${prominent ? "text-lg sm:text-xl" : "text-xs sm:text-sm"
          }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function StatsBar({ pool, stats, loading }: Props) {
  const solReserve = pool.mintA.equals(WSOL_MINT)
    ? pool.reserveA
    : pool.reserveB;
  const feeBps = pool.initialized ? pool.feeBps : FALLBACK_FEE_BPS;
  const feeLabel = `${(feeBps / 100).toFixed(2)}%`;
  const up = stats.changePct >= 0;
  const hasData = stats.hasData;
  const liquiditySol = (Number(solReserve) / 1e9) * 2;

  return (
    <section className="rounded-xl border border-pool-border bg-pool-panel px-4 py-3">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex items-center gap-3">
          <PairIcon baseSrc="/mantis/token/mantis.svg" quoteSrc="/mantis/token/solana.svg" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-semibold tracking-tight text-pool-text">
                MAN/SOL
              </h1>
              <span className="rounded-full border border-pool-border px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-pool-muted">
                DEVNET
              </span>
              <span className="rounded-full border border-pool-accent/25 bg-pool-accent/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-pool-accent">
                {feeLabel}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-pool-muted">
              {pool.initialized
                ? "Constant product pool"
                : loading
                  ? "Reading pool account…"
                  : "Pool not initialized"}
            </p>
          </div>
        </div>

        <div className="hidden h-9 w-px shrink-0 bg-pool-border lg:block" />

        <div className="grid flex-1 grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="Mark Price"
            value={hasData ? formatPrice(stats.price) : "—"}
            tone={up ? "accent" : "danger"}
            prominent
          />
          <Stat
            label="24H Change"
            value={hasData ? formatPercent(stats.changePct) : "—"}
            tone={up ? "accent" : "danger"}
          />
          <Stat
            label="24H Vol"
            value={hasData ? `${formatNumber(stats.volumeSol, 2)} SOL` : "—"}
          />
          <Stat
            label="24H High"
            value={hasData ? formatPrice(stats.high) : "—"}
          />
          <Stat
            label="24H Low"
            value={hasData ? formatPrice(stats.low) : "—"}
          />
          <Stat
            label="Pool Liquidity"
            value={
              pool.initialized
                ? `${formatNumber(liquiditySol, 2)} SOL`
                : "—"
            }
          />
        </div>

        <div className="hidden shrink-0 border-l border-pool-border pl-4 lg:block">
          <p className="text-[10px] font-medium uppercase tracking-wide text-pool-muted">
            Swap Fee
          </p>
          <p className="mt-0.5 font-mono text-sm text-pool-text">{feeLabel}</p>
        </div>
      </div>
    </section>
  );
}
