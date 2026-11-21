// app/docs/page.tsx
import type { Metadata } from "next";
import Docs from "@/components/docs";
import { absoluteUrl, socialMetadata } from "@/lib/site";

const DESCRIPTION =
	"Reference for the MAN/SOL pool on Solana devnet: swaps, liquidity, charts, and wrapping SOL.";

export const metadata: Metadata = {
	title: "MAN/SOL pool docs",
	description: DESCRIPTION,
	alternates: { canonical: absoluteUrl("/docs") },
	...socialMetadata("MAN/SOL pool docs", DESCRIPTION, "/docs"),
};

export default function DocsPage() {
	return <Docs />;
}
