"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import type { Connection, PublicKey } from "@solana/web3.js";
import {
  FALLBACK_FEE_BPS,
  MINT_A,
  MINT_B,
  type PoolState,
} from "@/lib/amm/constants";
import { authorityPda, lpMintPda, poolPda, vaultPda } from "@/lib/amm/pda";
import { readProgram, type PoolAccount } from "@/lib/amm/program";
import { readableError } from "@/lib/amm/tx";

export const POOL_ADDRESS = poolPda(MINT_A, MINT_B);
export const POOL_AUTHORITY = authorityPda(POOL_ADDRESS);
export const POOL_VAULT_A = vaultPda(POOL_ADDRESS, MINT_A);
export const POOL_VAULT_B = vaultPda(POOL_ADDRESS, MINT_B);
export const POOL_LP_MINT = lpMintPda(POOL_ADDRESS);

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

function skeletonPool(): PoolState {
  return {
    initialized: false,
    address: POOL_ADDRESS,
    authority: POOL_AUTHORITY,
    mintA: MINT_A,
    mintB: MINT_B,
    vaultA: POOL_VAULT_A,
    vaultB: POOL_VAULT_B,
    lpMint: POOL_LP_MINT,
    feeBps: FALLBACK_FEE_BPS,
    reserveA: 0n,
    reserveB: 0n,
    lpSupply: 0n,
  };
}

export function usePool() {
  const { connection } = useConnection();
  const [pool, setPool] = useState<PoolState>(skeletonPool);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;

    try {
      const program = readProgram(connection);
      const account = (await program.account.pool.fetchNullable(
        POOL_ADDRESS,
      )) as PoolAccount | null;

      const vaultA = account?.vaultA ?? POOL_VAULT_A;
      const vaultB = account?.vaultB ?? POOL_VAULT_B;
      const lpMint = account?.lpMint ?? POOL_LP_MINT;

      const [reserveA, reserveB] = await Promise.all([
        tokenAmount(connection, vaultA),
        tokenAmount(connection, vaultB),
      ]);

      let lpSupply = 0n;
      if (account) {
        try {
          const supply = await connection.getTokenSupply(lpMint);
          lpSupply = BigInt(supply.value.amount);
        } catch {
          lpSupply = 0n;
        }
      }

      setPool({
        initialized: Boolean(account),
        address: POOL_ADDRESS,
        authority: POOL_AUTHORITY,
        mintA: MINT_A,
        mintB: MINT_B,
        vaultA,
        vaultB,
        lpMint,
        feeBps: account?.feeBps ?? FALLBACK_FEE_BPS,
        reserveA,
        reserveB,
        lpSupply,
      });
      setError(null);
    } catch (cause) {
      setError(readableError(cause));
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, [connection]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return { pool, loading, error, refresh: load };
}
