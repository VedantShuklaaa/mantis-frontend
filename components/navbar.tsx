"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import WalletButton from "@/components/walletButton";
import { BASE_PATH } from "@/lib/site";

type NavItem = { label: string; href: string; soon?: boolean };

const NAV_ITEMS: NavItem[] = [
	{ label: "Faucet", href: "/faucet" },
	{ label: "Pool", href: "/amm", soon: true },
];

export default function Navbar() {
	const pathname = usePathname();
	const current =
		pathname === BASE_PATH ? "/" : pathname.replace(`${BASE_PATH}/`, "/");

	return (
		<header className="fixed inset-x-0 top-3 z-50 flex justify-center px-4">
			<div className="relative flex w-full max-w-2xl items-center justify-center">
				<nav className="flex items-center gap-0.5 rounded-lg border border-border bg-background/80 p-1 shadow-[0_1px_2px_rgb(24_27_24/6%)] backdrop-blur-md">
					<Link
						href="/"
						aria-label="Mantis home"
						className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium tracking-tight text-foreground transition-colors hover:bg-foreground/[0.05]"
					>
						<span aria-hidden className="size-1.5 rounded-[2px] bg-primary" />
						Mantis
					</Link>

					<span aria-hidden className="mx-0.5 h-4 w-px bg-border" />

					{NAV_ITEMS.map((item) => {
						const isActive = current === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={isActive ? "page" : undefined}
								className={`relative rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
									isActive
										? "text-foreground"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{isActive && (
									<motion.span
										layoutId="nav-active"
										className="absolute inset-0 rounded-md bg-foreground/[0.06]"
										transition={{ type: "spring", stiffness: 400, damping: 34 }}
									/>
								)}
								<span className="relative z-10 flex items-center gap-1.5">
									{item.label}
									{item.soon && (
										<span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
											Soon
										</span>
									)}
								</span>
							</Link>
						);
					})}
				</nav>

				{/* Hidden below sm: at 360px it would collide with the centered pill. */}
				<div className="absolute right-0 hidden sm:block">
					<WalletButton />
				</div>
			</div>
		</header>
	);
}
