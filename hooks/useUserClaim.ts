"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { Connection, PublicKey } from "@solana/web3.js";
import { MAX_PER_WINDOW, WINDOW_SECONDS } from "@/lib/constants";
import { getProgram, getUserClaimAddress } from "@/lib/program";

type ClaimSnapshot = {
	owner: string;
	claimed: number;
	windowStart: number;
};

type ClaimError = {
	owner: string;
	message: string;
};

export type UserClaimStatus = {
	connected: boolean;
	loading: boolean;
	claimed: number;
	remaining: number;
	resetSeconds: number | null;
	error: string | null;
	refresh: () => Promise<void>;
};

type ClaimValues = {
	claimed: number;
	windowStart: number;
};

async function fetchClaim(
	connection: Connection,
	adapter: Adapter,
	user: PublicKey,
): Promise<ClaimValues> {
	const program = getProgram(connection, adapter);
	const claim = await program.account.userClaim.fetchNullable(
		getUserClaimAddress(user),
	);

	// A wallet that has never claimed has no claim account yet.
	return claim
		? {
				claimed: claim.claimed.toNumber(),
				windowStart: claim.windowStart.toNumber(),
			}
		: { claimed: 0, windowStart: 0 };
}

/** Reads the wallet's `UserClaim` PDA and keeps the reset countdown ticking. */
export function useUserClaim(): UserClaimStatus {
	const { connection } = useConnection();
	const { publicKey, wallet } = useWallet();
	const adapter = wallet?.adapter ?? null;
	const owner = publicKey?.toBase58() ?? null;

	const [snapshot, setSnapshot] = useState<ClaimSnapshot | null>(null);
	const [claimError, setClaimError] = useState<ClaimError | null>(null);
	// Starts at 0 so prerendering never reads the clock. It is filled from the
	// fetch callback and the interval below, both of which run on the client.
	const [now, setNow] = useState(0);
	const requestId = useRef(0);

	const refresh = useCallback(async () => {
		const request = ++requestId.current;

		if (!publicKey || !adapter) return;

		const requestOwner = publicKey.toBase58();

		try {
			const claim = await fetchClaim(connection, adapter, publicKey);

			if (request !== requestId.current) return;

			setNow(Math.floor(Date.now() / 1_000));
			setSnapshot({ owner: requestOwner, ...claim });
			setClaimError(null);
		} catch {
			if (request !== requestId.current) return;

			setClaimError({
				owner: requestOwner,
				message: "Claim status unavailable.",
			});
		}
	}, [adapter, connection, publicKey]);

	useEffect(() => {
		if (!publicKey || !adapter) return;

		const request = ++requestId.current;
		const requestOwner = publicKey.toBase58();
		let cancelled = false;

		void fetchClaim(connection, adapter, publicKey).then(
			(claim) => {
				if (cancelled || request !== requestId.current) return;

				setNow(Math.floor(Date.now() / 1_000));
				setSnapshot({ owner: requestOwner, ...claim });
				setClaimError(null);
			},
			() => {
				if (cancelled || request !== requestId.current) return;

				setClaimError({
					owner: requestOwner,
					message: "Claim status unavailable.",
				});
			},
		);

		return () => {
			cancelled = true;
		};
	}, [adapter, connection, publicKey]);

	useEffect(() => {
		const timer = window.setInterval(() => {
			setNow(Math.floor(Date.now() / 1_000));
		}, 1_000);

		return () => window.clearInterval(timer);
	}, []);

	const current =
		snapshot && owner && snapshot.owner === owner ? snapshot : null;
	const error =
		claimError && owner && claimError.owner === owner
			? claimError.message
			: null;

	const windowEnd = current ? current.windowStart + WINDOW_SECONDS : 0;
	const windowActive =
		current !== null && current.claimed > 0 && now < windowEnd;
	const claimed = windowActive
		? Math.min(current.claimed, MAX_PER_WINDOW)
		: 0;
	const remaining = Math.max(MAX_PER_WINDOW - claimed, 0);
	const resetSeconds = windowActive ? Math.max(windowEnd - now, 0) : null;

	return {
		connected: owner !== null,
		loading: owner !== null && current === null && error === null,
		claimed,
		remaining,
		resetSeconds,
		error,
		refresh,
	};
}
