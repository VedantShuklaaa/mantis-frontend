import { AnchorError } from "@coral-xyz/anchor";
import type { Adapter, WalletAdapterProps } from "@solana/wallet-adapter-base";
import { SystemProgram, type Connection } from "@solana/web3.js";
import {
	confirmSignature,
	SignatureConfirmationError,
} from "@/lib/confirmSignature";
import {
	ASSOCIATED_TOKEN_PROGRAM_ID,
	getConfigAddress,
	getMintAddress,
	getProgram,
	getUserAtaAddress,
	getUserClaimAddress,
	TOKEN_PROGRAM_ID,
} from "@/lib/program";

type SendTransaction = WalletAdapterProps["sendTransaction"];

export type ClaimRequest = {
	connection: Connection;
	wallet: Adapter;
	sendTransaction: SendTransaction;
	multiplier: number;
};

/**
 * Builds, sends, and confirms a claim.
 *
 * The transaction is built locally with the current blockhash, signed and sent
 * by the wallet adapter, then confirmed by polling the RPC proxy.
 */
export async function claimMan({
	connection,
	wallet,
	sendTransaction,
	multiplier,
}: ClaimRequest): Promise<string> {
	const user = wallet.publicKey;

	if (!user) {
		throw new Error("Connect a wallet before claiming.");
	}

	const program = getProgram(connection, wallet);
	const latest = await connection.getLatestBlockhash("confirmed");

	// Kept in a variable so every account is passed explicitly. Anchor's
	// `.accounts()` type only lists accounts it cannot resolve on its own, and
	// this bypasses the fresh-object-literal excess property check.
	const accounts = {
		user,
		config: getConfigAddress(),
		mint: getMintAddress(),
		userClaim: getUserClaimAddress(user),
		userAta: getUserAtaAddress(user),
		tokenProgram: TOKEN_PROGRAM_ID,
		associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
		systemProgram: SystemProgram.programId,
	};

	const transaction = await program.methods
		.claims(multiplier)
		.accounts(accounts)
		.transaction();

	transaction.feePayer = user;
	transaction.recentBlockhash = latest.blockhash;
	transaction.lastValidBlockHeight = latest.lastValidBlockHeight;

	const signature = await sendTransaction(transaction, connection);

	await confirmSignature(connection, signature, {
		lastValidBlockHeight: latest.lastValidBlockHeight,
	});

	return signature;
}

const PROGRAM_ERROR_MESSAGES: Record<string, string> = {
	limitreached:
		"Daily limit reached. This wallet has already claimed its 3 MAN for the current 24-hour window.",
	invalidmultiplier: "Pick a whole number from 1 to 3 MAN.",
	overflow: "That amount is too large to process. Try a smaller amount.",
};

const CUSTOM_CODE_NAMES: Record<number, string> = {
	6000: "limitreached",
	6001: "invalidmultiplier",
	6002: "overflow",
};

const WALLET_REJECTED_MESSAGE =
	"Signature request was rejected in your wallet. Nothing was sent.";

type ErrorDetails = {
	names: Set<string>;
	text: string;
	codes: Set<number>;
};

/**
 * Walks an error and its nested `error` / `cause` values. Wallet adapters and
 * web3.js wrap the useful details at different depths.
 */
function walkError(
	value: unknown,
	visit: (record: Record<string, unknown>) => void,
	seen: Set<object>,
): void {
	if (typeof value !== "object" || value === null || seen.has(value)) {
		return;
	}

	seen.add(value);

	if (Array.isArray(value)) {
		for (const item of value) walkError(item, visit, seen);
		return;
	}

	const record = value as Record<string, unknown>;
	visit(record);

	for (const nested of Object.values(record)) {
		walkError(nested, visit, seen);
	}

	// `Error.cause` is non-enumerable.
	walkError(record.cause, visit, seen);
}

function inspectError(error: unknown): ErrorDetails {
	const names = new Set<string>();
	const parts: string[] = [];
	const codes = new Set<number>();

	walkError(
		error,
		(record) => {
			if (typeof record.name === "string") {
				names.add(record.name.toLowerCase());
			}

			if (typeof record.message === "string") {
				parts.push(record.message);
			}

			if (Array.isArray(record.logs)) {
				for (const log of record.logs) {
					if (typeof log === "string") parts.push(log);
				}
			}

			const errorCode = record.errorCode;
			if (typeof errorCode === "object" && errorCode !== null) {
				const code = errorCode as { name?: unknown; number?: unknown };

				if (typeof code.name === "string") {
					names.add(code.name.toLowerCase());
				}

				if (typeof code.number === "number") {
					codes.add(code.number);
				}
			}

			if (typeof record.Custom === "number") {
				codes.add(record.Custom);
			}

			if (typeof record.code === "number" && typeof record.msg === "string") {
				codes.add(record.code);
			}
		},
		new Set(),
	);

	const text = parts.join("\n");

	for (const match of text.matchAll(/Error Number:\s*(\d+)/gi)) {
		codes.add(Number(match[1]));
	}

	for (const match of text.matchAll(/Error Code:\s*([A-Za-z0-9_]+)/gi)) {
		names.add(match[1].toLowerCase());
	}

	for (const match of text.matchAll(/custom program error:\s*0x([0-9a-f]+)/gi)) {
		codes.add(Number.parseInt(match[1], 16));
	}

	return { names, text, codes };
}

function isWalletRejection({ names, text }: ErrorDetails): boolean {
	if (
		/user rejected|rejected the request|request rejected|user denied|denied the (request|transaction)|user cancell?ed|cancell?ed by (the )?user/i.test(
			text,
		)
	) {
		return true;
	}

	return [...names].some(
		(name) =>
			name.includes("walletsigntransactionerror") ||
			name.includes("walletsignmessageerror"),
	);
}

function programErrorMessage(details: ErrorDetails): string | null {
	const keys = new Set(details.names);

	for (const code of details.codes) {
		const name = CUSTOM_CODE_NAMES[code];
		if (name) keys.add(name);
	}

	for (const key of keys) {
		const message = PROGRAM_ERROR_MESSAGES[key];
		if (message) return message;
	}

	return null;
}

function isInsufficientSol({ text, codes }: ErrorDetails): boolean {
	if (
		/insufficient (lamports|funds)|insufficient funds for rent|no record of a prior credit|account has insufficient funds/i.test(
			text,
		)
	) {
		return true;
	}

	// System Program's insufficient-funds error (custom code 1). In this
	// instruction the only System Program CPI is rent for `init_if_needed`.
	return codes.has(1);
}

/** Turns wallet, program, and confirmation errors into readable messages. */
export function describeClaimError(error: unknown): string {
	const details = inspectError(error);

	if (isWalletRejection(details)) {
		return WALLET_REJECTED_MESSAGE;
	}

	const programMessage = programErrorMessage(details);
	if (programMessage) return programMessage;

	if (isInsufficientSol(details)) {
		return "Not enough devnet SOL to cover the claim. The first claim creates your claim account and MAN token account, so it needs a little SOL for rent. Airdrop devnet SOL to this wallet and try again.";
	}

	if (error instanceof SignatureConfirmationError) {
		if (/expired/i.test(error.message)) {
			return "The transaction expired before it confirmed. Nothing was charged — try again.";
		}

		if (/timed out/i.test(error.message)) {
			return "The transaction is taking longer than expected. Check the explorer before retrying.";
		}

		return "The transaction failed on-chain. Check your wallet and try again.";
	}

	if (/blockhash not found|blockhash.*expired|block height exceeded/i.test(details.text)) {
		return "The transaction expired before it confirmed. Nothing was charged — try again.";
	}

	if (error instanceof AnchorError) {
		return error.error.errorMessage || "Claim failed. Please try again.";
	}

	return "Claim failed. Please try again.";
}
