"use client";

import { useMemo, type ReactNode } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
/*
 * Vendored copy of the adapter UI styles: the npm stylesheet @imports Google
 * Fonts, which the CSP blocks. Imported before the local overrides.
 */
import "@/app/wallet-adapter-ui.css";
import "@/app/wallet-modal.css";

const FALLBACK_RPC_ENDPOINT = clusterApiUrl("devnet");

/*
 * Wallet Standard wallets (Phantom, Solflare, Backpack, …) are detected
 * automatically, so the explicit adapter list stays empty.
 */
const WALLET_ADAPTERS: Adapter[] = [];

export default function Providers({ children }: { children: ReactNode }) {
	const endpoint = useMemo(
		() => process.env.NEXT_PUBLIC_RPC_URL || FALLBACK_RPC_ENDPOINT,
		[],
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider wallets={WALLET_ADAPTERS} autoConnect>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
