import { ArrowRight } from "lucide-react";
import SpecularButton from "@/components/SpecularButton";
import { PRIMARY_SPECULAR } from "@/lib/specular";

const ROWS = [
  { label: "Pair", value: "MAN / SOL" },
  { label: "Network", value: "Solana devnet" },
  { label: "Status", value: "In development", muted: true },
] as const;

export default function ComingSoon() {
	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16 pt-24">
			<h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
				MAN/SOL pool
			</h1>
			<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
				Pool trading is still in development. The faucet is live on Solana devnet.
			</p>

			<dl className="mt-6 divide-y divide-border rounded-xl border border-border bg-card px-4">
				{ROWS.map((row) => (
					<div
						key={row.label}
						className="flex items-center justify-between gap-4 py-3"
					>
						<dt className="text-xs text-muted-foreground">{row.label}</dt>
						<dd
							className={`flex items-center gap-1.5 text-sm ${
								"muted" in row && row.muted
									? "text-muted-foreground"
									: "text-foreground"
							}`}
						>
							{"muted" in row && row.muted && (
								<span
									aria-hidden
									className="size-1.5 rounded-full bg-muted-foreground/70"
								/>
							)}
							{row.value}
						</dd>
					</div>
				))}
			</dl>

			<div className="mt-6">
				<SpecularButton {...PRIMARY_SPECULAR} href="/faucet">
					Claim devnet MAN
					<ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
				</SpecularButton>
			</div>
		</main>
	);
}
