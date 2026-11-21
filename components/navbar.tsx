"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import WalletButton from "@/components/walletButton";
import { BASE_PATH } from "@/lib/site";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
	{ label: "Faucet", href: "/faucet" },
	{ label: "Pool", href: "/pool" },
	{ label: "Docs", href: "/docs" },
];

export default function Navbar() {
	const pathname = usePathname();
	const current =
		pathname === BASE_PATH ? "/" : pathname.replace(`${BASE_PATH}/`, "/");

	return (
		<header className="fixed inset-x-0 top-3 z-50 flex justify-center px-4 ">
			<div className="relative flex w-full max-w-2xl md:max-w-full items-center justify-center">
				<nav className="flex items-center gap-0.5 rounded-lg border border-border bg-background/80 p-1 shadow-[0_1px_2px_rgb(24_27_24/6%)] backdrop-blur-md lg:w-1/2 lg:justify-between">
					<Link
						href="/"
						aria-label="Mantis home"
						className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-lg font-medium tracking-tight text-foreground transition-colors hover:bg-foreground/[0.05]"
					>
						<Image
							src={`${BASE_PATH}/man2.svg`}
							alt=""
							width={24}
							height={24}
							unoptimized
							className="size-[24px]"
						/>
						Mantis
					</Link>

					<span aria-hidden className="mx-0.5 h-4 w-px bg-border lg:hidden" />

					<div className="flex items-center gap-0.5">
						{NAV_ITEMS.map((item) => {
							const isActive = current === item.href;

							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={isActive ? "page" : undefined}
									className={`relative rounded-md px-2.5 py-1.5 text-md transition-colors ${isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground"
										}`}
								>
									{isActive && (
										<motion.span
											layoutId="nav-active"
											className="absolute inset-0 rounded-md bg-foreground/[0.06]"
											transition={{
												type: "spring",
												stiffness: 400,
												damping: 34,
											}}
										/>
									)}
									<span className="relative z-10 flex items-center gap-1.5">
										{item.label}
									</span>
								</Link>
							);
						})}
					</div>
				</nav>

				{/* Hidden below sm: at 360px it would collide with the centered pill. */}
				<div className="absolute right-0 hidden sm:block">
					<WalletButton />
				</div>
			</div>
		</header>
	);
}