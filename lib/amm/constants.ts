import { Buffer } from "buffer";
import { PublicKey } from "@solana/web3.js";

export const CLUSTER = "devnet" as const;

export const PROGRAM_ID = new PublicKey(
  "DwMeAF9UFscahiqeYKr1CmKhEwdp9TBxihGbcK5YqJFm",
);

export const MAN_MINT = new PublicKey(
  "9JyKSkrvCcwivA2W12zgNDSAmgpDH6fdfaioCYYBJ3vs",
);

export const WSOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112",
);

export const MAN_DECIMALS = 6;
export const SOL_DECIMALS = 9;

export const DEFAULT_SLIPPAGE_BPS = 100;
export const FALLBACK_FEE_BPS = 30;
export const SOL_FEE_RESERVE = 10_000_000n;

export const SOLSCAN_URL = "https://solscan.io";

export const TIMEFRAMES = ["1m", "5m", "15m", "1h"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
};

export const DEFAULT_TIMEFRAME: Timeframe = "15m";

const ORDER = Buffer.compare(MAN_MINT.toBuffer(), WSOL_MINT.toBuffer());

export const [MINT_A, MINT_B] =
  ORDER < 0
    ? ([MAN_MINT, WSOL_MINT] as const)
    : ([WSOL_MINT, MAN_MINT] as const);

export function isMintA(mint: PublicKey): boolean {
  return mint.equals(MINT_A);
}

export function aToB(payMint: PublicKey): boolean {
  return isMintA(payMint);
}

export function mintDecimals(mint: PublicKey): number {
  return mint.equals(MAN_MINT) ? MAN_DECIMALS : SOL_DECIMALS;
}

export type PoolState = {
  initialized: boolean;
  address: PublicKey;
  authority: PublicKey;
  mintA: PublicKey;
  mintB: PublicKey;
  vaultA: PublicKey;
  vaultB: PublicKey;
  lpMint: PublicKey;
  feeBps: number;
  reserveA: bigint;
  reserveB: bigint;
  lpSupply: bigint;
};

export function reservesFor(pool: PoolState): { sol: bigint; man: bigint } {
  return pool.mintA.equals(WSOL_MINT)
    ? { sol: pool.reserveA, man: pool.reserveB }
    : { sol: pool.reserveB, man: pool.reserveA };
}

export function vaultsFor(pool: PoolState): {
  sol: PublicKey;
  man: PublicKey;
} {
  return pool.mintA.equals(WSOL_MINT)
    ? { sol: pool.vaultA, man: pool.vaultB }
    : { sol: pool.vaultB, man: pool.vaultA };
}
