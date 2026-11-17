// components/comingSoonDocs/index.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SECTIONS } from "@/lib/ammDocs";
import Section from "./section";
import Sidebar from "./sidebar";
import StatusList from "./statusList";

export default function ComingSoonDocs() {
	return (
		<main className="mx-auto flex w-full max-w-5xl gap-16 px-6 pb-24 pt-28">
			<Sidebar />

			<div className="min-w-0 flex-1 space-y-12">
				<motion.header
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
				>
					<span className="mb-4 inline-block rounded-full border border-border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
						Coming soon
					</span>
					<h1 className="text-3xl font-medium tracking-tight text-foreground">
						MAN/SOL pool
					</h1>
					<p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
						Docs for the Mantis pool on Solana devnet. Sections fill in as the
						pool ships.
					</p>
				</motion.header>

				{SECTIONS.map((s) => (
					<Section key={s.id} id={s.id} title={s.title}>
						{s.body.map((p) => (
							<p key={p}>{p}</p>
						))}
					</Section>
				))}

				<Section id="status" title="Status">
					<StatusList />
					<p>
						Need test MAN in the meantime?{" "}
						<Link
							href="/faucet"
							className="text-foreground underline underline-offset-4"
						>
							Use the faucet
						</Link>
						.
					</p>
				</Section>
			</div>
		</main>
	);
}