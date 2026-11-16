"use client";

import { useMemo, type ReactNode } from "react";
import type { Adapter } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { BASE_PATH } from "@/lib/paths";
/*
 * Vendored copy of the adapter UI styles: the npm stylesheet @imports Google
 * Fonts, which the CSP blocks. Imported before the local overrides.
 */
import "@/app/wallet-adapter-ui.css";
import "@/app/wallet-modal.css";

/*
 * RPC traffic goes through our own same-origin proxy so the upstream RPC URL
 * (and its API key) never reaches the browser. `basePath` is part of the URL.
 */
const RPC_PATH = `${BASE_PATH}/api/rpc`;

/*
 * The server render has no `window`; this fallback is only used while
 * prerendering and is never rendered into the DOM. The browser recomputes the
 * real origin during hydration.
 */
const SERVER_ORIGIN = "http://localhost:3000";

function rpcEndpoint() {
	const origin = typeof window === "undefined" ? SERVER_ORIGIN : window.location.origin;
	return `${origin}${RPC_PATH}`;
}

/*
 * Wallet Standard wallets (Phantom, Solflare, Backpack, …) are detected
 * automatically, so the explicit adapter list stays empty.
 */
const WALLET_ADAPTERS: Adapter[] = [];

/* Stable identity: ConnectionProvider re-creates the Connection if this changes. */
const CONNECTION_CONFIG = { commitment: "confirmed" } as const;

export default function Providers({ children }: { children: ReactNode }) {
	const endpoint = useMemo(() => rpcEndpoint(), []);

	return (
		<ConnectionProvider endpoint={endpoint} config={CONNECTION_CONFIG}>
			<WalletProvider wallets={WALLET_ADAPTERS} autoConnect>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}
