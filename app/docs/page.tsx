// app/amm/page.tsx
import type { Metadata } from "next";
import ComingSoonDocs from "@/components/comingSoonDocs";
import { absoluteUrl, socialMetadata } from "@/lib/site";

const DESCRIPTION =
	"The MAN/SOL pool is in development on Solana devnet. Use the faucet to get test MAN.";

export const metadata: Metadata = {
	title: "MAN/SOL pool",
	description: DESCRIPTION,
	alternates: { canonical: absoluteUrl("/amm") },
	...socialMetadata("MAN/SOL pool", DESCRIPTION, "/amm"),
};

export default function AmmPage() {
	return <ComingSoonDocs />;
}