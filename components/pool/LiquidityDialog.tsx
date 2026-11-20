"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2, X } from "lucide-react";
import { usePoolData } from "@/app/providers";
import {
  DEFAULT_SLIPPAGE_BPS,
  MAN_DECIMALS,
  MAN_MINT,
  SOL_DECIMALS,
  SOL_FEE_RESERVE,
} from "@/lib/amm/constants";
import {
  formatBaseUnits,
  formatInput,
  solscanTx,
  toBaseUnits,
} from "@/lib/amm/format";
import {
  ceilDiv,
  quoteAddLp,
  quoteRemove,
  withSlippage,
} from "@/lib/amm/math";
import {
  addLiquidityTx,
  readableError,
  removeLiquidityTx,
} from "@/lib/amm/tx";
import { toast } from "./Toast";

export type LiquidityMode = "add" | "remove";

type Props = {
  mode: LiquidityMode;
  onMode: (mode: LiquidityMode) => void;
  onClose: () => void;
};

export default function LiquidityDialog({ mode, onMode, onClose }: Props) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const { pool, balances, refresh } = usePoolData();

  const [manAmount, setManAmount] = useState("");
  const [solAmount, setSolAmount] = useState("");
  const [removePercent, setRemovePercent] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const manIsA = pool.mintA.equals(MAN_MINT);
  const reserveMan = manIsA ? pool.reserveA : pool.reserveB;
  const reserveSol = manIsA ? pool.reserveB : pool.reserveA;

  const asPoolSides = (man: bigint, sol: bigint) =>
    manIsA ? { a: man, b: sol } : { a: sol, b: man };

  const manBase = toBaseUnits(manAmount, MAN_DECIMALS) ?? 0n;
  const solBase = toBaseUnits(solAmount, SOL_DECIMALS) ?? 0n;

  const editMan = (value: string) => {
    const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
    setManAmount(cleaned);

    const base = toBaseUnits(cleaned, MAN_DECIMALS);
    if (base !== null && base > 0n && reserveMan > 0n && reserveSol > 0n) {
      const sol = ceilDiv(base * reserveSol, reserveMan);
      setSolAmount(formatInput(sol, SOL_DECIMALS, SOL_DECIMALS));
    } else if (!cleaned) {
      setSolAmount("");
    }
  };

  const editSol = (value: string) => {
    const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
    setSolAmount(cleaned);

    const base = toBaseUnits(cleaned, SOL_DECIMALS);
    if (base !== null && base > 0n && reserveSol > 0n && reserveMan > 0n) {
      const man = ceilDiv(base * reserveMan, reserveSol);
      setManAmount(formatInput(man, MAN_DECIMALS, MAN_DECIMALS));
    } else if (!cleaned) {
      setManAmount("");
    }
  };

  const addSides = asPoolSides(manBase, solBase);
  const lpQuote = quoteAddLp(
    addSides.a,
    addSides.b,
    pool.reserveA,
    pool.reserveB,
    pool.lpSupply,
  );
  const minLp = withSlippage(lpQuote, DEFAULT_SLIPPAGE_BPS);
  const neededNativeSol =
    solBase > balances.wsol ? solBase - balances.wsol : 0n;
  const insufficientAdd =
    manBase > balances.man ||
    balances.sol < neededNativeSol + SOL_FEE_RESERVE;

  const lpAmount = (balances.lp * BigInt(removePercent)) / 100n;
  const outA = quoteRemove(lpAmount, pool.reserveA, pool.lpSupply);
  const outB = quoteRemove(lpAmount, pool.reserveB, pool.lpSupply);
  const minA = withSlippage(outA, DEFAULT_SLIPPAGE_BPS);
  const minB = withSlippage(outB, DEFAULT_SLIPPAGE_BPS);
  const outMan = manIsA ? outA : outB;
  const outSol = manIsA ? outB : outA;

  const addLiquidity = async () => {
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const signature = await addLiquidityTx({
        connection,
        wallet,
        pool,
        maxA: addSides.a,
        maxB: addSides.b,
        minLp,
      });

      toast({
        type: "success",
        title: "Liquidity added",
        message: `${formatBaseUnits(lpQuote, 6, 4)} LP tokens quoted`,
        href: solscanTx(signature),
      });

      await refresh();
      onClose();
    } catch (cause) {
      toast({
        type: "error",
        title: "Add liquidity failed",
        message: readableError(cause),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeLiquidity = async () => {
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const signature = await removeLiquidityTx({
        connection,
        wallet,
        pool,
        lpAmount,
        minA,
        minB,
      });

      toast({
        type: "success",
        title: "Liquidity removed",
        message: `${formatBaseUnits(lpAmount, 6, 4)} LP tokens burned`,
        href: solscanTx(signature),
      });

      await refresh();
      onClose();
    } catch (cause) {
      toast({
        type: "error",
        title: "Remove liquidity failed",
        message: readableError(cause),
      });
    } finally {
      setSubmitting(false);
    }
  };

  let label = mode === "add" ? "Add liquidity" : "Remove liquidity";
  let disabled = false;
  let action: () => void | Promise<void> = mode === "add" ? addLiquidity : removeLiquidity;

  if (!wallet.publicKey) {
    label = "Connect Wallet";
    action = () => setVisible(true);
  } else if (submitting) {
    label = mode === "add" ? "Adding…" : "Removing…";
    disabled = true;
  } else if (!pool.initialized) {
    label = "Pool not initialized";
    disabled = true;
  } else if (mode === "add" && (manBase <= 0n || solBase <= 0n)) {
    label = "Enter amounts";
    disabled = true;
  } else if (mode === "add" && insufficientAdd) {
    label = "Insufficient balance";
    disabled = true;
  } else if (mode === "add" && lpQuote <= 0n) {
    label = "Amount too small";
    disabled = true;
  } else if (mode === "remove" && lpAmount <= 0n) {
    label = "No LP position";
    disabled = true;
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Manage liquidity"
        className="w-full max-w-[420px] rounded-2xl border border-pool-border bg-pool-panel p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-pool-text">
              Manage liquidity
            </h2>
            <p className="mt-0.5 text-[11px] text-pool-muted">
              MAN/SOL · {DEFAULT_SLIPPAGE_BPS / 100}% slippage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-pool-muted transition-colors hover:bg-black/[0.06] hover:text-pool-text"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-pool-border bg-pool-bg/60 p-1">
          {(["add", "remove"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMode(item)}
              className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
                mode === item
                  ? "bg-pool-accent/10 text-pool-accent ring-1 ring-pool-accent/25"
                  : "text-pool-muted hover:text-pool-text"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {mode === "add" ? (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-pool-border bg-pool-bg/60 p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-pool-muted">MAN</span>
                <span className="font-mono text-pool-muted">
                  {formatBaseUnits(balances.man, MAN_DECIMALS, 4)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  value={manAmount}
                  onChange={(event) => editMan(event.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  aria-label="MAN amount"
                  className="min-w-0 flex-1 bg-transparent font-mono text-xl tabular-nums text-pool-text outline-none placeholder:text-pool-muted/40"
                />
                <span className="rounded-full border border-pool-border px-2 py-1 text-[11px] text-pool-text">
                  MAN
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-pool-border bg-pool-bg/60 p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-pool-muted">SOL</span>
                <span className="font-mono text-pool-muted">
                  {formatBaseUnits(balances.sol, SOL_DECIMALS, 4)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  value={solAmount}
                  onChange={(event) => editSol(event.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  aria-label="SOL amount"
                  className="min-w-0 flex-1 bg-transparent font-mono text-xl tabular-nums text-pool-text outline-none placeholder:text-pool-muted/40"
                />
                <span className="rounded-full border border-pool-border px-2 py-1 text-[11px] text-pool-text">
                  SOL
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-pool-muted">LP tokens (min)</span>
              <span className="font-mono text-pool-text">
                {formatBaseUnits(minLp, 6, 6)}
              </span>
            </div>
            <p className="text-[10px] leading-4 text-pool-muted">
              The second amount follows the pool ratio and rounds up. Native SOL
              is wrapped automatically when needed.
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-pool-muted">Your LP balance</span>
              <span className="font-mono text-pool-text">
                {formatBaseUnits(balances.lp, 6, 4)}
              </span>
            </div>

            <div className="rounded-xl border border-pool-border bg-pool-bg/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-pool-muted">Remove</span>
                <span className="w-14 rounded-lg border border-pool-border bg-pool-panel py-1 text-center font-mono text-[11px] text-pool-text">
                  {removePercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={25}
                value={removePercent}
                onChange={(event) =>
                  setRemovePercent(Number(event.target.value))
                }
                aria-label="Liquidity percentage to remove"
                className="pool-range mt-3 w-full"
                style={{ "--pct": `${removePercent}%` } as CSSProperties}
              />
              <div className="mt-1 flex justify-between px-0.5 text-[9px] text-pool-muted">
                {[25, 50, 75, 100].map((tick) => (
                  <span
                    key={tick}
                    className={
                      tick <= removePercent ? "text-pool-accent" : undefined
                    }
                  >
                    {tick}%
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl border border-pool-border bg-pool-bg/40 px-3 py-2.5 text-[11px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-pool-muted">Receive MAN</span>
                <span className="font-mono text-pool-text">
                  {formatBaseUnits(outMan, MAN_DECIMALS, 6)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-pool-muted">Receive SOL</span>
                <span className="font-mono text-pool-text">
                  {formatBaseUnits(outSol, SOL_DECIMALS, 6)}
                </span>
              </div>
            </div>

            <p className="text-[10px] leading-4 text-pool-muted">
              The SOL side is returned as wSOL. Minimums apply{" "}
              {DEFAULT_SLIPPAGE_BPS / 100}% slippage.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={action}
          disabled={disabled}
          className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
            disabled
              ? "cursor-not-allowed bg-black/[0.05] text-pool-muted"
              : "bg-pool-accent text-pool-bg hover:brightness-95 active:scale-[0.99]"
          }`}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {label}
        </button>
      </motion.div>
    </div>
  );
}
