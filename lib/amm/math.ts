export function quoteSwap(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps: number,
): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;

  const feeFactor = BigInt(10_000 - Math.min(Math.max(feeBps, 0), 10_000));
  const inAfterFee = amountIn * feeFactor;

  return (inAfterFee * reserveOut) / (reserveIn * 10_000n + inAfterFee);
}

export function withSlippage(amount: bigint, slippageBps: number): bigint {
  const bps = BigInt(10_000 - Math.min(Math.max(slippageBps, 0), 10_000));
  return (amount * bps) / 10_000n;
}

export function priceImpactBps(
  amountIn: bigint,
  out: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
): number {
  if (amountIn <= 0n || out <= 0n || reserveIn <= 0n || reserveOut <= 0n) {
    return 0;
  }

  const spotOut = (amountIn * reserveOut) / reserveIn;
  if (spotOut <= 0n || out >= spotOut) return 0;

  return Number(((spotOut - out) * 10_000n) / spotOut);
}

export function priceSolPerMan(
  solReserve: bigint,
  manReserve: bigint,
): number {
  if (solReserve <= 0n || manReserve <= 0n) return 0;

  return (
    (Number(solReserve) / 10 ** 9) / (Number(manReserve) / 10 ** 6)
  );
}

export function quoteAddLp(
  maxA: bigint,
  maxB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  lpSupply: bigint,
): bigint {
  if (lpSupply === 0n) return sqrt(maxA * maxB);

  const fromA = reserveA > 0n ? (maxA * lpSupply) / reserveA : 0n;
  const fromB = reserveB > 0n ? (maxB * lpSupply) / reserveB : 0n;

  return fromA < fromB ? fromA : fromB;
}

export function quoteRemove(
  lpAmount: bigint,
  reserve: bigint,
  lpSupply: bigint,
): bigint {
  if (lpAmount <= 0n || reserve <= 0n || lpSupply <= 0n) return 0n;
  return (lpAmount * reserve) / lpSupply;
}

export function ceilDiv(a: bigint, b: bigint): bigint {
  if (b <= 0n) return 0n;
  return (a + b - 1n) / b;
}

export function sqrt(value: bigint): bigint {
  if (value < 0n) return 0n;
  if (value < 2n) return value;

  let x = value;
  let y = (x + 1n) / 2n;

  while (y < x) {
    x = y;
    y = (x + value / x) / 2n;
  }

  return x;
}
