import type { Connection } from "@solana/web3.js";

/*
 * Confirms a transaction without WebSocket subscriptions.
 *
 * The browser talks to our JSON-RPC proxy (`app/api/rpc/route.ts`), and a
 * Next.js route cannot tunnel WebSocket subscriptions. That means
 * `Connection.confirmTransaction`, `onSignature`, and the confirmation step
 * inside Anchor's `.rpc()` / `provider.sendAndConfirm` cannot work here.
 *
 * Intended flow for every on-chain write:
 *
 *   const latest = await connection.getLatestBlockhash("confirmed");
 *   const transaction = await program.methods
 *     .claims(multiplier)            // program instruction name
 *     .accounts({ ... })             // exactly the Rust `Claims` accounts
 *     .blockhash(latest.blockhash)
 *     .lastValidBlockHeight(latest.lastValidBlockHeight)
 *     .transaction();                // build, do not send
 *   const signature = await sendTransaction(transaction, connection);
 *   await confirmSignature(connection, signature, {
 *     lastValidBlockHeight: latest.lastValidBlockHeight,
 *   });
 *
 * Poll `getSignatureStatuses` (allowlisted by the proxy) and stop early when
 * the blockhash can no longer land.
 */

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

export class SignatureConfirmationError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = "SignatureConfirmationError";
	}
}

export type ConfirmSignatureOptions = {
	/** `lastValidBlockHeight` from the blockhash used to build the transaction. */
	lastValidBlockHeight: number;
	/** Overall time to keep polling. Defaults to 60 seconds. */
	timeoutMs?: number;
	/** Delay between polls. Defaults to 1 second. */
	pollIntervalMs?: number;
};

/**
 * Resolves when `signature` is confirmed (or finalized), rejects when it failed
 * on-chain, when its blockhash expires, or when `timeoutMs` elapses.
 */
export async function confirmSignature(
	connection: Connection,
	signature: string,
	options: ConfirmSignatureOptions,
): Promise<void> {
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
	const startedAt = Date.now();
	let lastError: unknown;

	while (Date.now() - startedAt < timeoutMs) {
		try {
			const { value } = await connection.getSignatureStatuses([signature]);
			const status = value[0];

			if (status) {
				if (status.err) {
					throw new SignatureConfirmationError(
						"Transaction failed on-chain.",
						{ cause: status.err },
					);
				}

				// `confirmations === null` means the status is rooted/finalized.
				if (
					status.confirmationStatus === "confirmed" ||
					status.confirmationStatus === "finalized" ||
					status.confirmations === null
				) {
					return;
				}
			}

			const blockHeight = await connection.getBlockHeight("confirmed");
			if (blockHeight > options.lastValidBlockHeight) {
				throw new SignatureConfirmationError(
					"Transaction expired before it was confirmed.",
				);
			}
		} catch (error) {
			// A failed transaction or an expired blockhash is final; RPC hiccups
			// are retried until the timeout.
			if (error instanceof SignatureConfirmationError) throw error;
			lastError = error;
		}

		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}

	throw new SignatureConfirmationError(
		"Timed out waiting for the transaction to confirm.",
		{ cause: lastError },
	);
}
