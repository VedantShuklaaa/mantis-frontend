import { SOLSCAN_URL } from "./constants";

function group(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toBaseUnits(input: string, decimals: number): bigint | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!trimmed || trimmed === ".") return null;
  if (!/^\d*(?:\.\d*)?$/.test(trimmed)) return null;
  if (trimmed === ".") return null;

  const [whole = "0", fraction = ""] = trimmed.split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);

  try {
    return (
      BigInt(whole || "0") * 10n ** BigInt(decimals) +
      BigInt(padded || "0")
    );
  } catch {
    return null;
  }
}

export function formatBaseUnits(
  value: bigint,
  decimals: number,
  maxFractionDigits = 4,
): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, Math.max(0, maxFractionDigits))
    .replace(/0+$/, "");

  const result = fractionText
    ? `${group(whole.toString())}.${fractionText}`
    : group(whole.toString());

  return negative ? `-${result}` : result;
}

export function formatInput(
  value: bigint,
  decimals: number,
  maxFractionDigits = decimals,
): string {
  if (value <= 0n) return "";

  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, Math.max(0, maxFractionDigits))
    .replace(/0+$/, "");

  return fractionText ? `${whole.toString()}.${fractionText}` : whole.toString();
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  });
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function shortKey(value: string, size = 4): string {
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}

export function solscanTx(signature: string): string {
  return `${SOLSCAN_URL}/tx/${signature}?cluster=devnet`;
}

export function solscanAccount(address: string): string {
  return `${SOLSCAN_URL}/account/${address}?cluster=devnet`;
}
