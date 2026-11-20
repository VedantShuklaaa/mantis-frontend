"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2 } from "lucide-react";
import { usePoolData } from "@/app/providers";
import {
  SOL_DECIMALS,
  SOL_FEE_RESERVE,
} from "@/lib/amm/constants";
import {
  formatBaseUnits,
  formatInput,
  solscanTx,
  toBaseUnits,
} from "@/lib/amm/format";
import { readableError, unwrapSolTx, wrapSolTx } from "@/lib/amm/tx";
import { toast } from "./Toast";

type Direction = "wrap" | "unwrap";

export default function WrapForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const { balances, refresh } = usePoolData();

  const [direction, setDirection] = useState<Direction>("wrap");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const available =
    balances.sol > SOL_FEE_RESERVE
      ? balances.sol - SOL_FEE_RESERVE
      : 0n;

  const parsed = toBaseUnits(amount, SOL_DECIMALS);
  const amountBase = direction === "unwrap" ? balances.wsol : parsed ?? 0n;

  const displayAmount =
    direction === "unwrap"
      ? formatInput(balances.wsol, SOL_DECIMALS, SOL_DECIMALS)
      : amount;

  const insufficient =
    direction === "wrap" && amountBase > 0n && amountBase > available;

  const switchDirection = (next: Direction) => {
    setDirection(next);
    setAmount("");
  };

  const handleSubmit = async () => {
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const signature =
        direction === "wrap"
          ? await wrapSolTx(connection, wallet, amountBase)
          : await unwrapSolTx(connection, wallet);

      toast({
        type: "success",
        title: direction === "wrap" ? "SOL wrapped" : "wSOL unwrapped",
        message:
          direction === "wrap"
            ? `${formatBaseUnits(amountBase, SOL_DECIMALS, 6)} wSOL added`
            : `${formatBaseUnits(balances.wsol, SOL_DECIMALS, 6)} SOL returned`,
        href: solscanTx(signature),
      });

      setAmount("");
      await refresh();
    } catch (cause) {
      toast({
        type: "error",
        title: direction === "wrap" ? "Wrap failed" : "Unwrap failed",
        message: readableError(cause),
      });
    } finally {
      setSubmitting(false);
    }
  };

  let label = direction === "wrap" ? "Wrap SOL" : "Unwrap wSOL";
  let disabled = false;

  if (!wallet.publicKey) {
    label = "Connect Wallet";
  } else if (submitting) {
    label = direction === "wrap" ? "Wrapping…" : "Unwrapping…";
    disabled = true;
  } else if (direction === "wrap" && (amountBase <= 0n || !amount.trim())) {
    label = "Enter amount";
    disabled = true;
  } else if (direction === "wrap" && insufficient) {
    label = "Insufficient balance";
    disabled = true;
  } else if (direction === "unwrap" && balances.wsol <= 0n) {
    label = "Nothing to unwrap";
    disabled = true;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-pool-border bg-pool-bg/60 p-1">
        {(["wrap", "unwrap"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => switchDirection(item)}
            className={`rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
              direction === item
                ? "bg-pool-accent/10 text-pool-accent ring-1 ring-pool-accent/25"
                : "text-pool-muted hover:text-pool-text"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-pool-border bg-pool-bg/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-pool-muted">
            SOL balance
          </p>
          <p className="mt-0.5 truncate font-mono text-xs text-pool-text">
            {formatBaseUnits(balances.sol, SOL_DECIMALS, 4)}
          </p>
        </div>
        <div className="rounded-lg border border-pool-border bg-pool-bg/60 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-pool-muted">
            wSOL balance
          </p>
          <p className="mt-0.5 truncate font-mono text-xs text-pool-text">
            {formatBaseUnits(balances.wsol, SOL_DECIMALS, 4)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-pool-border bg-pool-bg/60 p-3">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-pool-muted">Amount</span>
          {direction === "wrap" ? (
            <button
              type="button"
              onClick={() =>
                setAmount(formatInput(available, SOL_DECIMALS, SOL_DECIMALS))
              }
              className="rounded px-1 text-[10px] font-semibold text-pool-accent hover:underline"
            >
              MAX
            </button>
          ) : (
            <span className="text-[10px] text-pool-muted">Full balance</span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            value={displayAmount}
            onChange={(event) =>
              setAmount(
                event.target.value.replace(/,/g, "").replace(/[^\d.]/g, ""),
              )
            }
            readOnly={direction === "unwrap"}
            disabled={submitting}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            aria-label="Amount"
            className="min-w-0 flex-1 bg-transparent font-mono text-2xl tabular-nums text-pool-text outline-none placeholder:text-pool-muted/40 read-only:text-pool-muted disabled:opacity-60"
          />
          <span className="shrink-0 rounded-full border border-pool-border bg-pool-panel px-2.5 py-1.5 text-xs font-medium text-pool-text">
            {direction === "wrap" ? "SOL" : "wSOL"}
          </span>
        </div>
      </div>

      <p className="px-1 text-[10px] leading-4 text-pool-muted">
        {direction === "wrap"
          ? "Wrapping moves SOL into your wSOL token account. 1 SOL = 1 wSOL."
          : "Unwrapping closes the wSOL account and returns the full balance as native SOL."}
      </p>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${
          disabled
            ? "cursor-not-allowed bg-black/[0.05] text-pool-muted"
            : "bg-pool-accent text-pool-bg hover:brightness-95 active:scale-[0.99]"
        }`}
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        {label}
      </button>
    </div>
  );
}
