"use client";

import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, CircleAlert, Loader2 } from "lucide-react";
import SpecularButton from "@/components/SpecularButton";
import { PRIMARY_SPECULAR } from "@/lib/specular";

const BASE_CLAIM_CLAW = 1_000_000; // 1 MAN in claw, same as BASE_CLAIM in the program
const MAX_MULTIPLIER = 3;
const OPTIONS = Array.from({ length: MAX_MULTIPLIER }, (_, i) => i + 1);

const CLAW_FORMAT = new Intl.NumberFormat("en-US");
type Status = "idle" | "pending" | "success" | "error";

// TODO: replace with the real Anchor call: program.methods.claim(multiplier)
async function claimMan(multiplier: number): Promise<void> {
	console.log("claim", multiplier);
	await new Promise((resolve) => setTimeout(resolve, 1200));
}

export default function FaucetPanel() {
	const [value, setValue] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [message, setMessage] = useState<string | null>(null);

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

		if (!isValid) {
			setStatus("error");
			setMessage(`Pick a whole number from 1 to ${MAX_MULTIPLIER}.`);
			return;
		}

		try {
			setStatus("pending");
			setMessage(null);
			await claimMan(multiplier);
			setStatus("success");
			setMessage(`${multiplier} MAN sent to your wallet.`);
		} catch {
			setStatus("error");
			setMessage("Claim failed. Check your wallet and your 24h limit.");
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
					Up to {MAX_MULTIPLIER} MAN every 24 hours on Solana devnet.
				</p>

				<form
					onSubmit={handleSubmit}
					className="mt-6 rounded-xl border border-border bg-card p-4"
				>
					<div className="flex items-center justify-between gap-3">
						<label
							htmlFor="amount"
							className="text-xs font-medium text-muted-foreground"
						>
							Amount
						</label>
						<span className="text-xs tabular-nums text-muted-foreground">
							Limit 3 per 24h
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
								? `You'll receive ${CLAW_FORMAT.format(multiplier * BASE_CLAIM_CLAW)} claw.`
								: "Choose 1, 2 or 3 MAN."}
					</p>

					<div className="mt-4">
						<SpecularButton
							{...PRIMARY_SPECULAR}
							type="submit"
							disabled={pending}
							className="w-full"
						>
							{pending ? (
								<>
									<Loader2
										className="size-4 animate-spin"
										strokeWidth={1.75}
										aria-hidden
									/>
									Claiming…
								</>
							) : (
								<>
									{isValid ? `Claim ${multiplier} MAN` : "Claim MAN"}
									<ArrowRight
										className="size-4"
										strokeWidth={1.75}
										aria-hidden
									/>
								</>
							)}
						</SpecularButton>
					</div>
				</form>

				<div className="min-h-5 pt-2" role="status" aria-live="polite">
					<AnimatePresence mode="wait">
						{message && (
							<motion.p
								key={message}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 0.18 }}
								className={`flex items-start gap-1.5 text-xs leading-5 ${
									status === "success" ? "text-primary" : "text-destructive"
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
							</motion.p>
						)}
					</AnimatePresence>
				</div>

				<p className="mt-1 text-xs leading-5 text-muted-foreground">
					Claims are capped at 3 MAN per wallet every 24 hours. Devnet only.
				</p>
			</section>
		</main>
	);
}
