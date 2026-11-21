"use client";

import { useState, type CSSProperties } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Loader2 } from "lucide-react";
import { usePoolData } from "@/app/providers";
import {
  MAN_DECIMALS,
  MAN_MINT,
  SOL_DECIMALS,
  SOL_FEE_RESERVE,
  WSOL_MINT,
  aToB,
  mintDecimals,
} from "@/lib/amm/constants";
import {
  formatBaseUnits,
  formatInput,
  formatPrice,
  solscanTx,
  toBaseUnits,
} from "@/lib/amm/format";
import {
  priceImpactBps,
  priceSolPerMan,
  quoteSwap,
  withSlippage,
} from "@/lib/amm/math";
import { initializePoolTx, readableError, swapTx } from "@/lib/amm/tx";
import { toast } from "./Toast";
import SlippagePopover from "./SlippagePopover";
import Image from "next/image";

type Props = {
  side: "buy" | "sell";
  slippageBps: number;
  onSlippage: (bps: number) => void;
};

export type TokenSymbol = "SOL" | "MAN";

export const TOKEN_ICONS: Record<TokenSymbol, string> = {
  MAN: "/mantis/token/mantis.svg",
  SOL: "/mantis/token/solana.svg",
};

function TokenChip({ symbol }: { symbol: TokenSymbol }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-pool-border bg-pool-bg px-2.5 py-1.5 text-xs font-medium text-pool-text">
      <Image
        src={TOKEN_ICONS[symbol]}
        alt={symbol}
        width={16}
        height={16}
        className="size-4 rounded-full object-cover"
      />
      {symbol}
    </span>
  );
}

export default function SwapForm({ side, slippageBps, onSlippage }: Props) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const { pool, balances, refresh } = usePoolData();

  const [amount, setAmount] = useState("");
  const [percent, setPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const payingSol = side === "buy";
  const payMint = payingSol ? WSOL_MINT : MAN_MINT;
  const receiveMint = payingSol ? MAN_MINT : WSOL_MINT;
  const paySymbol = payingSol ? "SOL" : "MAN";
  const receiveSymbol = payingSol ? "MAN" : "SOL";
  const payDecimals = payingSol ? SOL_DECIMALS : MAN_DECIMALS;
  const receiveDecimals = payingSol ? MAN_DECIMALS : SOL_DECIMALS;

  const available = payingSol
    ? balances.sol > SOL_FEE_RESERVE
      ? balances.sol - SOL_FEE_RESERVE
      : 0n
    : balances.man;

  const parsed = toBaseUnits(amount, payDecimals);
  const amountBase = parsed ?? 0n;

  const reserveIn = aToB(payMint) ? pool.reserveA : pool.reserveB;
  const reserveOut = aToB(payMint) ? pool.reserveB : pool.reserveA;
  const quoted = pool.initialized
    ? quoteSwap(amountBase, reserveIn, reserveOut, pool.feeBps)
    : 0n;
  const minOut = withSlippage(quoted, slippageBps);
  const impactBps = priceImpactBps(
    amountBase,
    quoted,
    reserveIn,
    reserveOut,
  );

  const solReserve = pool.mintA.equals(WSOL_MINT)
    ? pool.reserveA
    : pool.reserveB;
  const manReserve = pool.mintA.equals(MAN_MINT)
    ? pool.reserveA
    : pool.reserveB;
  const spot = priceSolPerMan(solReserve, manReserve);

  const zero = !amount.trim() || amountBase <= 0n;
  const insufficient = amountBase > 0n && amountBase > available;

  const applyPercent = (value: number) => {
    setPercent(value);
    if (value <= 0) {
      setAmount("");
      return;
    }
    const target = (available * BigInt(value)) / 100n;
    setAmount(formatInput(target, payDecimals, payDecimals));
  };

  const onAmountChange = (raw: string) => {
    const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
    setAmount(cleaned);

    const base = toBaseUnits(cleaned, payDecimals);
    if (base !== null && base > 0n && available > 0n) {
      const ratio = Number((base * 100n) / available);
      setPercent(Math.min(100, Math.max(0, ratio)));
    } else {
      setPercent(0);
    }
  };

  const handleSwap = async () => {
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const signature = await swapTx({
        connection,
        wallet,
        pool,
        amountIn: amountBase,
        minOut,
        aToB: aToB(payMint),
        payMint,
        receiveMint,
      });

      toast({
        type: "success",
        title: payingSol ? "Bought MAN" : "Sold MAN",
        message: `${formatBaseUnits(quoted, receiveDecimals, 6)} ${receiveSymbol} received`,
        href: solscanTx(signature),
      });

      setAmount("");
      setPercent(0);
      await refresh();
    } catch (cause) {
      toast({
        type: "error",
        title: "Swap failed",
        message: readableError(cause),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitialize = async () => {
    if (!wallet.publicKey) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    try {
      const signature = await initializePoolTx(connection, wallet);

      toast({
        type: "success",
        title: "Pool initialized",
        message: "Add liquidity to set the starting price.",
        href: solscanTx(signature),
      });

      await refresh();
    } catch (cause) {
      toast({
        type: "error",
        title: "Initialize failed",
        message: readableError(cause),
      });
    } finally {
      setSubmitting(false);
    }
  };

  let label = payingSol ? "Buy MAN" : "Sell MAN";
  let disabled = false;
  let action: () => void | Promise<void> = handleSwap;

  if (!wallet.publicKey) {
    label = "Connect Wallet";
    action = () => setVisible(true);
  } else if (submitting) {
    label = pool.initialized ? "Swapping…" : "Initializing…";
    disabled = true;
  } else if (!pool.initialized) {
    label = "Initialize pool";
    action = handleInitialize;
  } else if (zero) {
    label = "Enter amount";
    disabled = true;
  } else if (insufficient) {
    label = "Insufficient balance";
    disabled = true;
  } else if (quoted <= 0n) {
    label = "Amount too small";
    disabled = true;
  }

  const feeLabel = `${(pool.feeBps / 100).toFixed(2)}%`;
  const impactLabel = `${(impactBps / 100).toFixed(2)}%`;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-pool-border bg-pool-bg/60 p-3">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-pool-muted">Amount</span>
          <span className="font-mono text-pool-muted">
            {formatBaseUnits(
              payingSol ? balances.sol : balances.man,
              payDecimals,
              4,
            )}{" "}
            {paySymbol}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            disabled={submitting}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            aria-label={`Amount in ${paySymbol}`}
            className="min-w-0 flex-1 bg-transparent font-mono text-2xl tabular-nums text-pool-text outline-none placeholder:text-pool-muted/40"
          />
          <TokenChip symbol={paySymbol} />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={25}
            value={percent}
            onChange={(event) => applyPercent(Number(event.target.value))}
            disabled={submitting}
            aria-label="Amount percentage"
            className="pool-range w-full"
            style={{ "--pct": `${percent}%` } as CSSProperties}
          />
          <span className="w-14 shrink-0 rounded-lg border border-pool-border bg-pool-panel py-1 text-center font-mono text-[11px] text-pool-text">
            {percent}%
          </span>
        </div>

        <div className="mt-1 flex justify-between px-0.5 text-[9px] text-pool-muted">
          <span>0</span>
          {[25, 50, 75, 100].map((tick) => (
            <span
              key={tick}
              className={tick <= percent ? "text-pool-accent" : undefined}
            >
              {tick}%
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-pool-border bg-pool-bg/60 p-3">
        <div className="flex items-center justify-between gap-3 text-[11px] text-pool-muted">
          <span>Receive</span>
          <span className="font-mono">
            {formatBaseUnits(quoted, receiveDecimals, 6)} {receiveSymbol}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate font-mono text-2xl tabular-nums text-pool-text">
            {quoted > 0n
              ? formatBaseUnits(quoted, receiveDecimals, 6)
              : "0.00"}
          </span>
          <TokenChip symbol={receiveSymbol} />
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-pool-border bg-pool-bg/40 px-3 py-2.5 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-pool-muted">Price</span>
          <span className="font-mono text-pool-text">
            {spot > 0 ? `${formatPrice(spot)} SOL` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-pool-muted">Price Impact</span>
          <span
            className={`font-mono ${impactBps > 100 ? "text-pool-danger" : "text-pool-text"
              }`}
          >
            {amountBase > 0n ? impactLabel : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-pool-muted">Min Received</span>
          <span className="font-mono text-pool-text">
            {minOut > 0n
              ? `${formatBaseUnits(minOut, receiveDecimals, 6)} ${receiveSymbol}`
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-pool-muted">Slippage</span>
          <SlippagePopover bps={slippageBps} onChange={onSlippage} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-pool-muted">Pool Fee</span>
          <span className="font-mono text-pool-text">{feeLabel}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={action}
        disabled={disabled}
        className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all ${disabled
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
