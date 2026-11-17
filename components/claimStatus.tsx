"use client";

import { motion } from "motion/react";
import { formatCountdown, formatMan } from "@/lib/format";

type ClaimStatusProps = {
	connected: boolean;
	loading: boolean;
	claimed: number;
	remaining: number;
	resetSeconds: number | null;
	error: string | null;
};

export default function ClaimStatus({
	connected,
	loading,
	claimed,
	remaining,
	resetSeconds,
	error,
}: ClaimStatusProps) {
	const haveStatus = connected && !loading && !error;
	const ready = haveStatus && resetSeconds === null;

	const items = [
		{
			label: "Claimed",
			value: haveStatus ? `${formatMan(claimed)} MAN` : "—",
		},
		{
			label: "Remaining",
			value: haveStatus ? `${formatMan(remaining)} MAN` : "—",
		},
		{
			label: "Resets in",
			value: !haveStatus
				? "—"
				: resetSeconds === null
					? "Ready"
					: formatCountdown(resetSeconds),
		},
	];

	return (
		<motion.div
			initial={{ opacity: 0, y: 4 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2 }}
			className="overflow-hidden rounded-xl bg-card"
		>
			<dl className="grid grid-cols-3 divide-x divide-zinc-300">
				{items.map((item) => (
					<div key={item.label} className="px-3 py-3">
						<dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
							{item.label}
						</dt>
						<dd
							className={`mt-1 text-sm font-medium tabular-nums ${
								haveStatus
									? "text-foreground"
									: "text-muted-foreground/60"
							}`}
						>
							{item.value}
						</dd>
					</div>
				))}
			</dl>

			{!connected ? (
				<p className="border-t border-border px-3 py-2 text-xs leading-5 text-muted-foreground">
					Connect a wallet to see your claim status.
				</p>
			) : null}

			{connected && error ? (
				<p className="border-t border-border px-3 py-2 text-xs leading-5 text-destructive">
					{error}
				</p>
			) : null}

			{ready ? (
				<p className="border-t border-border px-3 py-2 text-xs leading-5 text-muted-foreground">
					The 24-hour window is clear. You can claim the full amount again.
				</p>
			) : null}
		</motion.div>
	);
}
