"use client";

import { useEffect, useState } from "react";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ExternalLink } from "lucide-react";
import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import { usePoolData } from "@/app/providers";
import { PROGRAM_ID } from "@/lib/amm/constants";
import { shortKey, solscanTx } from "@/lib/amm/format";
import { readableError } from "@/lib/amm/tx";

type Row = {
  signature: string;
  blockTime: number | null;
  failed: boolean;
};

function formatTime(blockTime: number | null): string {
  if (!blockTime) return "—";
  return new Date(blockTime * 1_000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryTable() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { refreshKey } = usePoolData();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setRows([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const signatures = await connection.getSignaturesForAddress(
          publicKey,
          { limit: 100 },
          "confirmed",
        );

        const valid = signatures.filter(
          (item) => typeof item.blockTime === "number",
        );
        const found: Row[] = [];

        for (let index = 0; index < valid.length; index += 50) {
          const chunk = valid.slice(index, index + 50);

          let parsed: (ParsedTransactionWithMeta | null)[];
          try {
            parsed = await connection.getParsedTransactions(
              chunk.map((item) => item.signature),
              { maxSupportedTransactionVersion: 0, commitment: "confirmed" },
            );
          } catch {
            continue;
          }

          parsed.forEach((tx, position) => {
            if (!tx) return;

            const program = PROGRAM_ID.toBase58();
            const involvesProgram = tx.transaction.message.instructions.some(
              (instruction) => String(instruction.programId) === program,
            );
            if (!involvesProgram) return;

            const item = chunk[position];
            found.push({
              signature: item.signature,
              blockTime: tx.blockTime ?? item.blockTime ?? null,
              failed: Boolean(tx.meta?.err),
            });
          });
        }

        found.sort(
          (a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0),
        );

        if (!cancelled) {
          setRows(found.slice(0, 20));
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) setError(readableError(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [connection, publicKey, refreshKey]);

  if (!publicKey) {
    return (
      <div className="grid place-items-center gap-3 px-4 py-12 text-center">
        <p className="text-sm text-pool-muted">
          Connect your wallet to see your history
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

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-2 p-4" aria-label="Loading transaction history">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-9 animate-pulse rounded-lg bg-black/[0.05]"
          />
        ))}
      </div>
    );
  }

  if (error && rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-xs text-pool-muted">{error}</p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-xs text-pool-muted">
        No transactions yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-xs">
        <thead>
          <tr className="border-b border-pool-border text-[10px] uppercase tracking-wide text-pool-muted">
            <th className="px-4 py-2 font-medium">Time</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Signature</th>
            <th className="px-4 py-2 text-right font-medium">Solscan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.signature}
              className="border-b border-pool-border/60 last:border-0 hover:bg-black/[0.03]"
            >
              <td className="whitespace-nowrap px-4 py-2.5 text-pool-muted">
                {formatTime(row.blockTime)}
              </td>
              <td className="px-4 py-2.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    row.failed
                      ? "bg-pool-danger/10 text-pool-danger"
                      : "bg-pool-accent/10 text-pool-accent"
                  }`}
                >
                  {row.failed ? "Failed" : "Success"}
                </span>
              </td>
              <td className="px-4 py-2.5 font-mono text-pool-muted">
                {shortKey(row.signature, 6)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <a
                  href={solscanTx(row.signature)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-pool-accent hover:underline"
                >
                  View
                  <ExternalLink className="size-3" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
