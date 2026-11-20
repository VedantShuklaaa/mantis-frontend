"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  type Connection,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";
import {
  MAN_MINT,
  TIMEFRAME_SECONDS,
  WSOL_MINT,
  type PoolState,
  type Timeframe,
} from "@/lib/amm/constants";
import { priceSolPerMan } from "@/lib/amm/math";
import { readableError } from "@/lib/amm/tx";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type PoolStats = {
  price: number;
  changePct: number;
  high: number;
  low: number;
  volumeSol: number;
  hasData: boolean;
};

type Sample = {
  t: number;
  price: number;
  solVolume: number;
};

type TokenBalances = NonNullable<
  ParsedTransactionWithMeta["meta"]
>["postTokenBalances"];

const MAX_CANDLES = 300;
const CACHE_TTL = 5 * 60_000;

function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - parsed.at > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Session storage can be unavailable in private contexts.
  }
}

function vaultAmount(
  balances: TokenBalances,
  mint: PublicKey,
  owner: PublicKey,
): bigint | null {
  const mintKey = mint.toBase58();
  const ownerKey = owner.toBase58();
  const entry = balances?.find(
    (balance) =>
      balance.mint === mintKey && (!balance.owner || balance.owner === ownerKey),
  );

  if (!entry) return null;

  try {
    return BigInt(entry.uiTokenAmount.amount);
  } catch {
    return null;
  }
}

async function fetchSamples(
  connection: Connection,
  solVault: PublicKey,
  manVault: PublicKey,
  authority: PublicKey,
): Promise<Sample[]> {
  const signatures = await connection.getSignaturesForAddress(
    solVault,
    { limit: 1000 },
    "confirmed",
  );

  const valid = signatures.filter(
    (item) => !item.err && typeof item.blockTime === "number",
  );
  const bySignature = new Map<string, Sample>();

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
      const signature = chunk[position]?.signature;
      const blockTime = tx?.blockTime ?? chunk[position]?.blockTime ?? null;
      if (!signature || blockTime === null || !tx?.meta) return;

      const postSol = vaultAmount(
        tx.meta.postTokenBalances,
        WSOL_MINT,
        authority,
      );
      const postMan = vaultAmount(
        tx.meta.postTokenBalances,
        MAN_MINT,
        authority,
      );

      if (postSol === null || postMan === null) return;
      if (postSol <= 0n || postMan <= 0n) return;

      const preSol =
        vaultAmount(tx.meta.preTokenBalances, WSOL_MINT, authority) ?? postSol;

      const price =
        (Number(postSol) / 1e9) / (Number(postMan) / 1e6);
      if (!Number.isFinite(price) || price <= 0) return;

      const solVolume = Math.abs(Number(postSol - preSol)) / 1e9;

      bySignature.set(signature, {
        t: blockTime,
        price,
        solVolume: Number.isFinite(solVolume) ? solVolume : 0,
      });
    });
  }

  return [...bySignature.values()].sort((a, b) => a.t - b.t);
}

function buildCandles(
  samples: Sample[],
  timeframe: Timeframe,
  livePrice: number | null,
): Candle[] {
  const step = TIMEFRAME_SECONDS[timeframe];
  const nowBucket = Math.floor(Date.now() / 1000 / step) * step;
  const cutoff = nowBucket - step * (MAX_CANDLES - 1);
  const buckets = new Map<number, Candle>();

  for (const sample of samples) {
    const bucket = Math.floor(sample.t / step) * step;
    if (bucket < cutoff) continue;

    const candle = buckets.get(bucket);
    if (!candle) {
      buckets.set(bucket, {
        time: bucket,
        open: sample.price,
        high: sample.price,
        low: sample.price,
        close: sample.price,
      });
    } else {
      candle.high = Math.max(candle.high, sample.price);
      candle.low = Math.min(candle.low, sample.price);
      candle.close = sample.price;
    }
  }

  const lastPrice =
    livePrice ?? (samples.length ? samples[samples.length - 1].price : null);

  if (lastPrice !== null) {
    const current = buckets.get(nowBucket);
    if (!current) {
      buckets.set(nowBucket, {
        time: nowBucket,
        open: lastPrice,
        high: lastPrice,
        low: lastPrice,
        close: lastPrice,
      });
    } else {
      current.high = Math.max(current.high, lastPrice);
      current.low = Math.min(current.low, lastPrice);
      current.close = lastPrice;
    }
  }

  if (buckets.size === 0) return [];

  const ordered = [...buckets.values()].sort((a, b) => a.time - b.time);
  const filled: Candle[] = [];
  let previous: Candle | null = null;

  for (const candle of ordered) {
    if (previous) {
      for (
        let time = previous.time + step;
        time < candle.time && filled.length < MAX_CANDLES * 2;
        time += step
      ) {
        filled.push({
          time,
          open: previous.close,
          high: previous.close,
          low: previous.close,
          close: previous.close,
        });
      }
    }
    filled.push(candle);
    previous = candle;
  }

  return filled.slice(-MAX_CANDLES);
}

function priceForReserves(
  reserveSol: bigint,
  reserveMan: bigint,
): number {
  return priceSolPerMan(reserveSol, reserveMan);
}

export function useCandles(pool: PoolState | null, timeframe: Timeframe) {
  const { connection } = useConnection();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const fetchedFor = useRef<string | null>(null);

  const solVault = pool
    ? pool.mintA.equals(WSOL_MINT)
      ? pool.vaultA
      : pool.vaultB
    : null;
  const manVault = pool
    ? pool.mintA.equals(MAN_MINT)
      ? pool.vaultA
      : pool.vaultB
    : null;

  const solVaultKey = solVault?.toBase58() ?? null;
  const manVaultKey = manVault?.toBase58() ?? null;
  const authorityKey = pool?.authority.toBase58() ?? null;
  const historyKey =
    pool?.initialized && solVaultKey && manVaultKey
      ? `${pool.address.toBase58()}:${solVaultKey}:${manVaultKey}`
      : null;

  useEffect(() => {
    if (!historyKey || !solVaultKey || !manVaultKey || !authorityKey) {
      setLoading(false);
      return;
    }

    const cacheKey = `mantis.pool.history.${historyKey}`;
    const cached = readCache<Sample[]>(cacheKey);

    if (cached?.length) {
      setSamples(cached);
      setLoading(false);
    }

    if (fetchedFor.current === historyKey) return;

    let cancelled = false;

    void (async () => {
      try {
        const fresh = await fetchSamples(
          connection,
          new PublicKey(solVaultKey),
          new PublicKey(manVaultKey),
          new PublicKey(authorityKey),
        );

        if (cancelled) return;

        setSamples(fresh);
        fetchedFor.current = historyKey;
        writeCache(cacheKey, fresh);
        setError(null);
      } catch (cause) {
        if (!cancelled) setError(readableError(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authorityKey,
    connection,
    historyKey,
    manVaultKey,
    solVaultKey,
  ]);

  useEffect(() => {
    if (!solVaultKey || !manVaultKey) return;

    const solKey = new PublicKey(solVaultKey);
    const manKey = new PublicKey(manVaultKey);
    let cancelled = false;

    const read = async () => {
      try {
        const [solAccount, manAccount] = await Promise.all([
          connection.getTokenAccountBalance(solKey).catch(() => null),
          connection.getTokenAccountBalance(manKey).catch(() => null),
        ]);

        if (cancelled || !solAccount || !manAccount) return;

        const price = priceForReserves(
          BigInt(solAccount.value.amount),
          BigInt(manAccount.value.amount),
        );

        setLivePrice(price > 0 ? price : null);
      } catch {
        // Keep the last known price while the RPC is unavailable.
      }
    };

    void read();
    const timer = window.setInterval(() => void read(), 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [connection, manVaultKey, solVaultKey]);

  const candlesKey = historyKey ? `mantis.pool.candles.${timeframe}.${historyKey}` : null;

  useEffect(() => {
    if (!candlesKey) return;
    const cached = readCache<Candle[]>(candlesKey);
    if (cached?.length) setCandles(cached);
  }, [candlesKey]);

  const lastWrite = useRef(0);

  useEffect(() => {
    if (loading && samples.length === 0 && livePrice === null) return;

    const next = buildCandles(samples, timeframe, livePrice);
    setCandles(next);

    if (candlesKey && next.length && Date.now() - lastWrite.current > 30_000) {
      writeCache(candlesKey, next);
      lastWrite.current = Date.now();
    }
  }, [candlesKey, livePrice, loading, samples, timeframe]);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const stats = useMemo<PoolStats>(() => {
    const cutoff = now / 1000 - 86_400;
    const recent = samples.filter((sample) => sample.t >= cutoff);
    const prices = recent.map((sample) => sample.price).filter((p) => p > 0);

    if (livePrice !== null) prices.push(livePrice);

    const firstPrice =
      recent.length > 0 ? recent[0].price : livePrice ?? 0;
    const price =
      livePrice ?? (recent.length ? recent[recent.length - 1].price : 0);

    const high = prices.length ? Math.max(...prices) : 0;
    const low = prices.length ? Math.min(...prices) : 0;
    const volumeSol = recent.reduce((sum, sample) => sum + sample.solVolume, 0);

    return {
      price,
      changePct:
        firstPrice > 0 && price > 0
          ? ((price - firstPrice) / firstPrice) * 100
          : 0,
      high,
      low,
      volumeSol,
      hasData: price > 0,
    };
  }, [livePrice, now, samples]);

  return { candles, stats, loading, error };
}
