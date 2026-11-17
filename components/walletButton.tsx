"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { Check, ChevronDown, Copy, LogOut, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

const COPIED_FEEDBACK_MS = 1400;
const DROPDOWN_TRANSITION: Transition = { duration: 0.16, ease: "easeOut" };

/*
 * Wallet state only exists in the browser. useSyncExternalStore reports
 * `false` during hydration and `true` afterwards without a state-setting
 * effect, so the server and the first client render match.
 */
const subscribeToNothing = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

const shortenAddress = (address: string) =>
	`${address.slice(0, 4)}…${address.slice(-4)}`;

const CHROME =
	"inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card/80 px-3 text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(24_27_24/6%)] backdrop-blur-md transition-colors cursor-pointer";

const MENU_ITEM =
	"flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-foreground/[0.05] cursor-pointer";

export default function WalletButton() {
	const { publicKey, connected, connecting, disconnect } = useWallet();
	const { setVisible } = useWalletModal();
	const mounted = useSyncExternalStore(
		subscribeToNothing,
		getMounted,
		getServerMounted,
	);
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const copyTimerRef = useRef<number | undefined>(undefined);

	useEffect(() => {
		if (!open) return;

		const onPointerDown = (event: PointerEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	useEffect(() => () => window.clearTimeout(copyTimerRef.current), []);

	if (!mounted) {
		return (
			<span
				aria-hidden
				className="block h-8 w-28 rounded-full border border-border bg-card/60"
			/>
		);
	}

	if (connecting) {
		return (
			<button type="button" disabled className={`${CHROME} opacity-60`}>
				Connecting…
			</button>
		);
	}

	if (!connected || !publicKey) {
		return (
			<button
				type="button"
				onClick={() => setVisible(true)}
				className={`${CHROME} hover:bg-foreground/[0.04]`}
			>
				<Wallet className="size-3.5" strokeWidth={1.75} aria-hidden />
				Connect wallet
			</button>
		);
	}

	const address = publicKey.toBase58();

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(address);
			setCopied(true);
			window.clearTimeout(copyTimerRef.current);
			copyTimerRef.current = window.setTimeout(
				() => setCopied(false),
				COPIED_FEEDBACK_MS,
			);
		} catch {
			// Clipboard access can be denied; leave the menu open so the user
			// can retry.
		}
	};

	const handleDisconnect = () => {
		setOpen(false);
		void disconnect();
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				aria-haspopup="menu"
				aria-expanded={open}
				className={`${CHROME} hover:bg-foreground/[0.04]`}
			>
				<span aria-hidden className="size-1.5 rounded-full bg-primary" />
				<span className="tabular-nums">{shortenAddress(address)}</span>
				<ChevronDown
					className={`size-3.5 text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
					strokeWidth={1.75}
					aria-hidden
				/>
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						role="menu"
						aria-label="Wallet actions"
						initial={{ opacity: 0, y: -4, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -4, scale: 0.98 }}
						transition={DROPDOWN_TRANSITION}
						className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 rounded-lg border border-border bg-card p-1 shadow-[0_12px_32px_-12px_rgb(24_27_24/0.25)]"
					>
						<button
							type="button"
							role="menuitem"
							onClick={handleCopy}
							className={`${MENU_ITEM} text-foreground`}
						>
							{copied ? (
								<Check className="size-3.5" strokeWidth={1.75} aria-hidden />
							) : (
								<Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
							)}
							{copied ? "Copied" : "Copy address"}
						</button>
						<button
							type="button"
							role="menuitem"
							onClick={handleDisconnect}
							className={`${MENU_ITEM} text-muted-foreground hover:text-foreground`}
						>
							<LogOut className="size-3.5" strokeWidth={1.75} aria-hidden />
							Disconnect
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
