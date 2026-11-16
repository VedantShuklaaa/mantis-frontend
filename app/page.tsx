import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SpecularButton from "@/components/SpecularButton";
import { PRIMARY_SPECULAR } from "@/lib/specular";
import { absoluteUrl, socialMetadata } from "@/lib/site";

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
			<main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-24">
			<section className="max-w-lg">
				<h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
					Test the MAN token on Solana devnet.
				</h1>
				<p className="mt-3 max-w-md text-pretty text-sm leading-6 text-muted-foreground">
					Claim up to 3 MAN every 24 hours. The MAN/SOL pool is still being
					built.
				</p>

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
			</section>

			<section aria-labelledby="products-heading" className="mt-12">
				<h2
					id="products-heading"
					className="text-xs font-medium text-muted-foreground"
				>
					Products
				</h2>

				<div className="mt-3 grid gap-3 sm:grid-cols-2">
					{PRODUCTS.map((product) => (
						<Link
							key={product.href}
							href={product.href}
							className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
						>
							<div className="flex items-center justify-between gap-3">
								<h3 className="text-sm font-medium text-foreground">
									{product.name}
								</h3>
								<span
									className={`flex items-center gap-1.5 text-xs ${
										product.live ? "text-primary" : "text-muted-foreground"
									}`}
								>
									<span
										aria-hidden
										className={`size-1.5 rounded-full ${
											product.live ? "bg-primary" : "bg-muted-foreground/70"
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
					))}
				</div>
			</section>
		</main>
		</>
	);
}
