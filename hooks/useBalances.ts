"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey, type Connection } from "@solana/web3.js";
import { MAN_MINT, WSOL_MINT, type PoolState } from "@/lib/amm/constants";

export type Balances = {
  sol: bigint;
  man: bigint;
  wsol: bigint;
  lp: bigint;
};

const EMPTY: Balances = { sol: 0n, man: 0n, wsol: 0n, lp: 0n };

async function tokenAmount(
  connection: Connection,
  address: PublicKey,
): Promise<bigint> {
  try {
    const result = await connection.getTokenAccountBalance(address);
    return BigInt(result.value.amount);
  } catch {
    return 0n;
  }
}

export function useBalances(pool: PoolState | null) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<Balances>(EMPTY);
  const busy = useRef(false);
  const lpMintKey = pool?.lpMint.toBase58() ?? null;

  const load = useCallback(async () => {
    if (!publicKey) {
      setBalances(EMPTY);
      return;
    }
    if (busy.current) return;
    busy.current = true;

    try {
      const manAta = getAssociatedTokenAddressSync(MAN_MINT, publicKey);
      const wsolAta = getAssociatedTokenAddressSync(WSOL_MINT, publicKey);
      const lpAta = lpMintKey
        ? getAssociatedTokenAddressSync(new PublicKey(lpMintKey), publicKey)
        : null;

      const [sol, man, wsol, lp] = await Promise.all([
        connection.getBalance(publicKey).catch(() => 0),
        tokenAmount(connection, manAta),
        tokenAmount(connection, wsolAta),
        lpAta ? tokenAmount(connection, lpAta) : Promise.resolve(0n),
      ]);

      setBalances({ sol: BigInt(sol), man, wsol, lp });
    } finally {
      busy.current = false;
    }
  }, [connection, publicKey, lpMintKey]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return { balances, refresh: load };
}
