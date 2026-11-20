"use client";
import Image from "next/image";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Plus, Minus } from "lucide-react";
import { usePoolData } from "@/app/providers";
import {
  MAN_DECIMALS,
  MAN_MINT,
  SOL_DECIMALS,
} from "@/lib/amm/constants";
import { formatBaseUnits, formatNumber } from "@/lib/amm/format";
import { quoteRemove } from "@/lib/amm/math";
import LiquidityDialog, { type LiquidityMode } from "./LiquidityDialog";

type PairIconProps = {
  baseSrc: string;
  quoteSrc: string;
  baseAlt?: string;
  quoteAlt?: string;
};

export default function PositionsTable() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { pool, balances } = usePoolData();
  const [mode, setMode] = useState<LiquidityMode | null>(null);

  if (!publicKey) {
    return (
      <div className="grid place-items-center gap-3 px-4 py-12 text-center">
        <p className="text-sm text-pool-muted">
          Connect your wallet to see your positions
        </p>
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="rounded-xl bg-pool-accent px-4 py-2 text-xs font-semibold text-pool-bg transition-all hover:brightness-95 active:scale-[0.99]"
        >
          Connect wallet
        </button>
      </div>
    );
  }

  const manIsA = pool.mintA.equals(MAN_MINT);
  const reserveMan = manIsA ? pool.reserveA : pool.reserveB;
  const reserveSol = manIsA ? pool.reserveB : pool.reserveA;

  const sharePct =
    pool.lpSupply > 0n
      ? Number((balances.lp * 1_000_000n) / pool.lpSupply) / 10_000
      : 0;

  const manValue = quoteRemove(balances.lp, reserveMan, pool.lpSupply);
  const solValue = quoteRemove(balances.lp, reserveSol, pool.lpSupply);
  const hasPosition = balances.lp > 0n;

  return (
    <>
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex items-center -space-x-2">
            <Image
              src="/mantis/token/mantis.svg"
              alt="base token"
              width={32}
              height={32}
              className="size-8 rounded-full border-2 border-pool-panel bg-pool-accent"
            />
            <Image
              src="/mantis/token/solana.svg"
              alt="quoto token"
              width={32}
              height={32}
              className="size-8 rounded-full border-2 border-pool-panel bg-pool-accent "
            />
          </span>
          <div>
            <p className="text-xs font-medium text-pool-text">MAN/SOL LP</p>
            <p className="text-[10px] text-pool-muted">
              {hasPosition ? "Open position" : "No LP position yet"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-pool-muted">
              LP balance
            </p>
            <p className="mt-0.5 font-mono text-xs text-pool-text">
              {formatBaseUnits(balances.lp, 6, 4)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-pool-muted">
              Pool share
            </p>
            <p className="mt-0.5 font-mono text-xs text-pool-text">
              {hasPosition ? `${formatNumber(sharePct, 2)}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-pool-muted">
              Value
            </p>
            <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-pool-text">
              {formatBaseUnits(manValue, MAN_DECIMALS, 2)} MAN
            </p>
            <p className="font-mono text-[10px] text-pool-muted">
              {formatBaseUnits(solValue, SOL_DECIMALS, 4)} SOL
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("add")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-pool-accent/30 bg-pool-accent/10 px-3 py-1.5 text-[11px] font-semibold text-pool-accent transition-colors hover:bg-pool-accent/15"
          >
            <Plus className="size-3" />
            Add
          </button>
          <button
            type="button"
            onClick={() => setMode("remove")}
            disabled={!hasPosition}
            className="inline-flex items-center gap-1.5 rounded-lg border border-pool-border px-3 py-1.5 text-[11px] font-medium text-pool-muted transition-colors hover:border-black/20 hover:text-pool-text disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Minus className="size-3" />
            Remove
          </button>
        </div>
      </div>

      {mode ? (
        <LiquidityDialog
          mode={mode}
          onMode={setMode}
          onClose={() => setMode(null)}
        />
      ) : null}
    </>
  );
}
