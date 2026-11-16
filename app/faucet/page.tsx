import type { Metadata } from "next";
import FaucetPanel from "@/components/faucetPanel";
import { absoluteUrl, socialMetadata } from "@/lib/site";

const DESCRIPTION =
	"Claim up to 3 MAN every 24 hours on Solana devnet. No mainnet funds.";

export const metadata: Metadata = {
	title: "Faucet",
	description: DESCRIPTION,
	alternates: { canonical: absoluteUrl("/faucet") },
	...socialMetadata("Claim devnet MAN", DESCRIPTION, "/faucet"),
};

export default function FaucetPage() {
	return <FaucetPanel />;
}
