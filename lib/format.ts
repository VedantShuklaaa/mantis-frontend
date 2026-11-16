import { BASE_UNITS_PER_MAN, MINT_DECIMALS } from "@/lib/constants";

const MAN_FORMAT = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: MINT_DECIMALS,
});

/** Formats base units (claw) as a MAN amount. */
export function formatMan(baseUnits: number): string {
	return MAN_FORMAT.format(baseUnits / BASE_UNITS_PER_MAN);
}

/** Compact countdown such as `23h 59m`, `12m 04s`, or `08s`. */
export function formatCountdown(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	const hours = Math.floor(seconds / 3_600);
	const minutes = Math.floor((seconds % 3_600) / 60);
	const remainder = seconds % 60;

	if (hours > 0) {
		return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
	}

	if (minutes > 0) {
		return `${minutes}m ${remainder.toString().padStart(2, "0")}s`;
	}

	return `${remainder}s`;
}
