import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ClaimStepIllustration from "@/components/claimStepIllustration";
import HeroTitle from "@/components/heroTitle";
import Reveal from "@/components/reveal";
import SpecularButton from "@/components/SpecularButton";
import { PRIMARY_SPECULAR } from "@/lib/specular";
import { absoluteUrl, socialMetadata } from "@/lib/site";
import HeroOrbit from "@/components/heroOrbit";

const DESCRIPTION =
	"Claim up to 3 MAN every 24 hours on Solana devnet. Mantis is a small toolkit for testing the MAN token and the MAN/SOL pool.";

export const metadata: Metadata = {
	title: "Mantis — Solana devnet MAN faucet",
	description: DESCRIPTION,
	alternates: { canonical: absoluteUrl("") },
	...socialMetadata("Mantis — Solana devnet MAN faucet", DESCRIPTION),
};

const PRODUCTS = [
	{
		href: "/faucet",
		name: "Faucet",
		status: "Live",
		live: true,
		description: "Claim 1–3 MAN every 24 hours on devnet.",
		action: "Open faucet",
	},
	{
		href: "/amm",
		name: "MAN/SOL pool",
		status: "In development",
		live: false,
		description: "Pool trading is not live on devnet yet.",
		action: "View status",
	},
] as const;

const STEPS = [
	{
		step: "wallet",
		title: "Connect your wallet",
		description: "Link any Solana wallet on devnet — no sign-up needed.",
	},
	{
		step: "amount",
		title: "Choose the amount",
		description: "Pick 1, 2, or 3 MAN. Your claim limit resets every 24 hours.",
	},
	{
		step: "confirm",
		title: "Confirm airdrop",
		description: "Approve the transaction and the MAN lands in your wallet.",
	},
] as const;

const JSON_LD = {
	"@context": "https://schema.org",
	"@type": "WebApplication",
	name: "Mantis",
	url: absoluteUrl(""),
	description: DESCRIPTION,
	applicationCategory: "DeveloperApplication",
	operatingSystem: "Web",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
};

export default function HomePage() {
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
			/>
			<main className="mx-auto w-full max-w-2xl md:max-w-6xl flex-1 px-5">
				<div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden">
					<HeroOrbit className="absolute left-1/2 top-1/2 -z-10 w-full max-w-8xl -translate-x-1/2 -translate-y-1/2" />
					<HeroTitle />
				</div>
				<div className="h-[50vh] flex flex-col mx-auto justify-center">
					<section className="max-w-lg">
						<Reveal>
							<h1 className="text-balance text-4xl font-semibold leading-none tracking-tight sm:text-5xl">
								Test the MAN token on Solana devnet.
							</h1>
						</Reveal>
						<Reveal delay={0.08}>
							<p className="mt-3 max-w-md text-pretty text-sm leading-none text-muted-foreground">
								Your playground for MAN on Solana. Claim test tokens, experiment, and explore.
							</p>
						</Reveal>

						<Reveal delay={0.16}>
							<div className="mt-7 flex flex-wrap items-center gap-2.5">
								<SpecularButton {...PRIMARY_SPECULAR} href="/faucet">
									Claim devnet MAN
									<ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
								</SpecularButton>
								<Link
									href="/amm"
									className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
								>
									Pool status
									<ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
								</Link>
							</div>
						</Reveal>
					</section>

					<section aria-labelledby="products-heading" className="mt-6">
						<Reveal>
							<h2
								id="products-heading"
								className="text-xs font-medium text-muted-foreground"
							>
								Products
							</h2>
						</Reveal>

						<div className="mt-3 grid gap-3 sm:grid-cols-2">
							{PRODUCTS.map((product, index) => (
								<Reveal key={product.href} delay={0.06 + index * 0.07} className="h-full">
									<Link
										href={product.href}
										className="group flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
									>
										<div className="flex items-center justify-between gap-3">
											<h3 className="text-sm font-medium text-foreground">
												{product.name}
											</h3>
											<span
												className={`flex items-center gap-1.5 text-xs ${product.live ? "text-primary" : "text-muted-foreground"
													}`}
											>
												<span
													aria-hidden
													className={`size-1.5 rounded-full ${product.live ? "bg-primary" : "bg-muted-foreground/70"
														}`}
												/>
												{product.status}
											</span>
										</div>
										<p className="mt-1.5 text-sm leading-6 text-muted-foreground">
											{product.description}
										</p>
										<span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
											{product.action}
											<ArrowRight
												className="size-3.5 transition-transform group-hover:translate-x-0.5"
												strokeWidth={1.75}
												aria-hidden
											/>
										</span>
									</Link>
								</Reveal>
							))}
						</div>
					</section>
				</div>

				<section aria-labelledby="steps-heading" className="h-[50vh]">
					<Reveal>
						<h2
							id="steps-heading"
							className="text-xs font-medium text-muted-foreground"
						>
							How it works
						</h2>
					</Reveal>

					<Reveal delay={0.06}>
						<ol className="mt-3 grid overflow-hidden gap-2 bg-card divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
							{STEPS.map((item, index) => (
								<li key={item.step} className="flex flex-col px-5 py-15">
									<ClaimStepIllustration step={item.step} />
									<span className="mt-5 text-[11px] font-medium tabular-nums text-muted-foreground">
										{String(index + 1).padStart(2, "0")}
									</span>
									<h3 className="mt-1 text-lg font-medium text-foreground">
										{item.title}
									</h3>
									<p className="mt-1.5 text-sm leading-5 text-muted-foreground">
										{item.description}
									</p>
								</li>
							))}
						</ol>
					</Reveal>
				</section>
			</main>
		</>
	);
}
