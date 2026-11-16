"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
	ArrowRight,
	Check,
	CircleAlert,
	ExternalLink,
	Loader2,
	Wallet,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import ClaimStatus from "@/components/claimStatus";
import SpecularButton from "@/components/SpecularButton";
import { useUserClaim } from "@/hooks/useUserClaim";
import { claimMan, describeClaimError } from "@/lib/claim";
import { BASE_CLAIM, MAX_MULTIPLIER, MAX_PER_WINDOW } from "@/lib/constants";
import { formatMan } from "@/lib/format";
import { PRIMARY_SPECULAR } from "@/lib/specular";

const OPTIONS = Array.from({ length: MAX_MULTIPLIER }, (_, i) => i + 1);

type Status = "idle" | "pending" | "success" | "error";

function explorerUrl(signature: string): string {
	return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function shortenSignature(signature: string): string {
	return `${signature.slice(0, 8)}…${signature.slice(-8)}`;
}

export default function FaucetPanel() {
	const { connection } = useConnection();
	const { connected, connecting, wallet, sendTransaction } = useWallet();
	const { setVisible } = useWalletModal();
	const claimStatus = useUserClaim();

	const [value, setValue] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState<string | null>(null);
	const [signature, setSignature] = useState<string | null>(null);

	const multiplier = Number(value);
	const isValid =
		value !== "" &&
		Number.isInteger(multiplier) &&
		multiplier >= 1 &&
		multiplier <= MAX_MULTIPLIER;
	const showInvalid = value !== "" && !isValid;
	const pending = status === "pending";

	const resetFeedback = () => {
		setStatus("idle");
		setMessage(null);
		setSignature(null);
	};

	const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
		// keep only the last typed digit so typing "2" after "1" replaces it
		setValue(e.target.value.replace(/\D/g, "").slice(-1));
		resetFeedback();
	};

	const pick = (n: number) => {
		setValue(String(n));
		resetFeedback();
	};

	const handleConfirm = async () => {
		if (pending) return;

		if (!connected) {
			setVisible(true);
			return;
		}

		if (!isValid) {
			setStatus("error");
			setMessage(`Pick a whole number from 1 to ${MAX_MULTIPLIER}.`);
			return;
		}

		if (!wallet) {
			setStatus("error");
			setMessage("Wallet unavailable. Reconnect and try again.");
			return;
		}

		try {
			setStatus("pending");
			setMessage(null);
			setSignature(null);

			const transactionSignature = await claimMan({
				connection,
				wallet: wallet.adapter,
				sendTransaction,
				multiplier,
			});

			setSignature(transactionSignature);
			setStatus("success");
			setMessage(
				`${formatMan(multiplier * BASE_CLAIM)} MAN sent to your wallet.`,
			);
			void claimStatus.refresh();
		} catch (error) {
			setStatus("error");
			setMessage(describeClaimError(error));
		}
	};

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		void handleConfirm();
	};

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16 pt-24">
			<section>
				<h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
					Claim devnet MAN
				</h1>
				<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
					Up to {formatMan(MAX_PER_WINDOW)} MAN every 24 hours on Solana
					devnet.
				</p>

				<div className="mt-5">
					<ClaimStatus
						connected={claimStatus.connected}
						loading={claimStatus.loading}
						claimed={claimStatus.claimed}
						remaining={claimStatus.remaining}
						resetSeconds={claimStatus.resetSeconds}
						error={claimStatus.error}
					/>
				</div>

				<form
					onSubmit={handleSubmit}
					className="mt-3 rounded-xl border border-border bg-card p-4"
				>
					<div className="flex items-center justify-between gap-3">
						<label
							htmlFor="amount"
							className="text-xs font-medium text-muted-foreground"
						>
							Amount
						</label>
						<span className="text-xs tabular-nums text-muted-foreground">
							Limit {formatMan(MAX_PER_WINDOW)} per 24h
						</span>
					</div>

					<div className="mt-2 flex items-center gap-2">
						<div className="relative flex-1">
							<input
								id="amount"
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								autoComplete="off"
								maxLength={1}
								value={value}
								onChange={handleInput}
								disabled={pending}
								placeholder="1"
								aria-invalid={showInvalid}
								aria-describedby="amount-help"
								className={`h-9 w-full rounded-lg border bg-background pl-3 pr-12 text-sm tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:ring-2 disabled:opacity-50 ${
									showInvalid
										? "border-destructive/60 focus:border-destructive/60 focus:ring-destructive/15"
										: "border-input focus:border-foreground/40 focus:ring-foreground/10"
								}`}
							/>
							<span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
								MAN
							</span>
						</div>

						<div
							role="group"
							aria-label="Quick amounts"
							className="flex shrink-0 rounded-lg border border-border p-0.5"
						>
							{OPTIONS.map((n) => {
								const selected = isValid && multiplier === n;

								return (
									<button
										key={n}
										type="button"
										onClick={() => pick(n)}
										disabled={pending}
										aria-pressed={selected}
										className={`h-8 w-8 rounded-md text-sm tabular-nums transition-colors disabled:opacity-50 ${
											selected
												? "bg-foreground text-background"
												: "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
										}`}
									>
										{n}
									</button>
								);
							})}
						</div>
					</div>

					<p
						id="amount-help"
						className={`mt-2 text-xs leading-5 tabular-nums ${
							showInvalid ? "text-destructive" : "text-muted-foreground"
						}`}
					>
						{showInvalid
							? "Enter 1, 2 or 3 MAN."
							: isValid
								? `You'll receive ${formatMan(multiplier * BASE_CLAIM)} MAN.`
								: "Choose 1, 2 or 3 MAN."}
					</p>

					<div className="mt-4">
						<SpecularButton
							{...PRIMARY_SPECULAR}
							type="submit"
							disabled={pending || connecting}
							className="w-full"
						>
							{pending || connecting ? (
								<>
									<Loader2
										className="size-4 animate-spin"
										strokeWidth={1.75}
										aria-hidden
									/>
									{pending ? "Claiming…" : "Connecting…"}
								</>
							) : (
								<>
									{connected
										? isValid
											? `Claim ${multiplier} MAN`
											: "Claim MAN"
										: "Connect wallet"}
									{connected ? (
										<ArrowRight
											className="size-4"
											strokeWidth={1.75}
											aria-hidden
										/>
									) : (
										<Wallet
											className="size-4"
											strokeWidth={1.75}
											aria-hidden
										/>
									)}
								</>
							)}
						</SpecularButton>
					</div>
				</form>

				<div className="min-h-6 pt-2" role="status" aria-live="polite">
					<AnimatePresence mode="wait">
						{message && (
							<motion.div
								key={`${status}-${message}`}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.18 }}
							>
								<p
									className={`flex items-start gap-1.5 text-xs leading-5 ${
										status === "success"
											? "text-primary"
											: "text-destructive"
									}`}
								>
									{status === "success" ? (
										<Check
											className="mt-0.5 size-3.5 shrink-0"
											strokeWidth={1.75}
											aria-hidden
										/>
									) : (
										<CircleAlert
											className="mt-0.5 size-3.5 shrink-0"
											strokeWidth={1.75}
											aria-hidden
										/>
									)}
									<span>{message}</span>
								</p>

								{status === "success" && signature && (
									<a
										href={explorerUrl(signature)}
										target="_blank"
										rel="noopener noreferrer"
										aria-label="View claim transaction on the Solana devnet explorer (opens in a new tab)"
										className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
									>
										<span className="font-mono">
											{shortenSignature(signature)}
										</span>
										<ExternalLink
											className="size-3"
											strokeWidth={1.75}
											aria-hidden
										/>
									</a>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>

				<p className="mt-1 text-xs leading-5 text-muted-foreground">
					Claims are capped at {formatMan(MAX_PER_WINDOW)} MAN per wallet
					every 24 hours. Devnet only.
				</p>
			</section>
		</main>
	);
}
