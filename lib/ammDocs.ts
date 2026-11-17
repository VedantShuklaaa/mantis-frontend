// lib/ammDocs.ts
export type Status = "live" | "building" | "planned";

export type DocSection = {
	id: string;
	title: string;
	body: string[];
};

export const SECTIONS: DocSection[] = [
	{
		id: "overview",
		title: "Overview",
		body: [
			"The MAN/SOL pool is a token pool on Solana devnet where MAN and SOL can be swapped directly against each other.",
			"The pool is in development. This page will become the full reference once it ships.",
		],
	},
	{
		id: "swap",
		title: "Swap",
		body: [
			"Swap MAN for SOL, or SOL for MAN, in a single transaction from your connected wallet.",
			"Quotes, price impact and slippage settings will be documented here.",
		],
	},
	{
		id: "liquidity",
		title: "Liquidity",
		body: [
			"Deposit MAN and SOL to provide liquidity, and withdraw your share at any time.",
			"Deposit, withdrawal and share accounting details will be documented here.",
		],
	},
];

export const STATUS: { label: string; status: Status }[] = [
	{ label: "MAN faucet", status: "live" },
	{ label: "Pool program", status: "building" },
	{ label: "Swap and liquidity UI", status: "planned" },
];

export const STATUS_LABEL: Record<Status, string> = {
	live: "Live",
	building: "In development",
	planned: "Planned",
};