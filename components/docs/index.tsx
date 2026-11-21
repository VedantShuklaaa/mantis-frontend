// components/docs/index.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SECTIONS } from "@/lib/ammDocs";
import Section from "./section";
import Sidebar from "./sidebar";

export default function Docs() {
	return (
		<main className="mx-auto flex w-full max-w-5xl gap-16 px-6 pb-24 pt-28">
			<Sidebar />

			<div className="min-w-0 flex-1 space-y-12">
				<motion.header
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<h1 className="text-3xl font-medium tracking-tight text-foreground">
						MAN/SOL pool
					</h1>
					<p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
						How the Mantis pool works on Solana devnet: swaps, liquidity,
						charts, and wrapping SOL.
					</p>
				</motion.header>

				{SECTIONS.map((s) => (
					<Section key={s.id} id={s.id} title={s.title}>
						{s.body.map((p) => (
							<p key={p}>{p}</p>
						))}
					</Section>
				))}

				<p className="text-sm leading-relaxed text-muted-foreground">
					Ready to try it? Open the{" "}
					<Link
						href="/pool"
						className="text-foreground underline underline-offset-4"
					>
						pool
					</Link>{" "}
					to swap or provide liquidity, or{" "}
					<Link
						href="/faucet"
						className="text-foreground underline underline-offset-4"
					>
						claim test MAN
					</Link>{" "}
					first.
				</p>
			</div>
		</main>
	);
}
