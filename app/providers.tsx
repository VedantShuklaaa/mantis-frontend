"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ToastHost } from "@/components/pool/Toast";
import { useBalances, type Balances } from "@/hooks/useBalances";
import { usePool } from "@/hooks/usePool";
import type { PoolState } from "@/lib/amm/constants";

type PoolData = {
  pool: PoolState;
  poolLoading: boolean;
  poolError: string | null;
  balances: Balances;
  refreshKey: number;
  refresh: () => Promise<void>;
};

const PoolDataContext = createContext<PoolData | null>(null);

export default function Providers({ children }: { children: ReactNode }) {
  const { pool, loading, error, refresh: refreshPool } = usePool();
  const { balances, refresh: refreshBalances } = useBalances(pool);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    await Promise.all([refreshPool(), refreshBalances()]);
    setRefreshKey((key) => key + 1);
  }, [refreshBalances, refreshPool]);

  useEffect(() => {
    document.documentElement.dataset.pool = "true";
    return () => {
      delete document.documentElement.dataset.pool;
    };
  }, []);

  const value = useMemo<PoolData>(
    () => ({
      pool,
      poolLoading: loading,
      poolError: error,
      balances,
      refreshKey,
      refresh,
    }),
    [balances, error, loading, pool, refresh, refreshKey],
  );

  return (
    <PoolDataContext.Provider value={value}>
      {children}
      <ToastHost />
    </PoolDataContext.Provider>
  );
}

export function usePoolData(): PoolData {
  const context = useContext(PoolDataContext);
  if (!context) {
    throw new Error("Pool components must render inside the pool providers.");
  }
  return context;
}
