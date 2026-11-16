/**
 * On-chain constants mirrored from `programs/man-faucet/src/constants.rs`
 * in the man-faucet program repository.
 *
 * Keep these values in sync with the program. They drive the amount picker,
 * base-unit formatting, and the daily window countdown.
 */

/** SPL token decimals for MAN. */
export const MINT_DECIMALS = 6;

/** Base units minted by one claim step (1 MAN). */
export const BASE_CLAIM = 1_000_000;

/** Largest multiplier accepted by the `claims` instruction. */
export const MAX_MULTIPLIER = 3;

/** Most base units a wallet can claim per window (3 MAN). */
export const MAX_PER_WINDOW = BASE_CLAIM * MAX_MULTIPLIER;

/** Daily claim window, in seconds. */
export const WINDOW_SECONDS = 86_400;

/** Base units in one whole MAN, derived from the mint decimals. */
export const BASE_UNITS_PER_MAN = 10 ** MINT_DECIMALS;
