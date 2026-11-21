// lib/ammDocs.ts
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
			"Mantis runs the MAN/SOL pool on Solana devnet. It is a constant-product pool, so MAN and SOL are swapped directly against each other and the price is set by the ratio of the two vault reserves.",
			"Everything on this site uses devnet tokens and devnet SOL. Nothing here has real value — never send mainnet funds.",
		],
	},
	{
		id: "faucet",
		title: "Faucet",
		body: [
			"Claim 1, 2, or 3 MAN on the faucet page. Each wallet can claim up to 3 MAN per 24-hour window, and the window resets automatically.",
			"The first claim creates your MAN token account, so the wallet needs a small amount of devnet SOL to cover rent and network fees.",
		],
	},
	{
		id: "swap",
		title: "Swap",
		body: [
			"Open the pool page and connect a Solana wallet on devnet. Choose Buy MAN to pay SOL for MAN, or Sell MAN to pay MAN for SOL, then enter an amount or use the percentage slider.",
			"Quotes come from the pool reserves using the constant-product formula minus the pool fee. The panel shows the current rate, price impact, pool fee, slippage tolerance, and the minimum amount you will receive before you confirm.",
			"Slippage defaults to 1% and can be set to 0.5%, 1%, 3%, or a custom value up to 50%. If the pool moves past your minimum, the transaction reverts rather than filling at a worse price.",
			"Native SOL is wrapped to wSOL when you pay, and wSOL is unwrapped back to native SOL when you receive, all inside the same transaction. Confirmed swaps link to Solscan.",
		],
	},
	{
		id: "liquidity",
		title: "Liquidity",
		body: [
			"Provide liquidity from the Positions tab. Enter a MAN amount or a SOL amount — the other side follows the current pool ratio and rounds up — and you receive LP tokens for your share of the pool.",
			"Remove liquidity by choosing a percentage of your LP balance, from 25% to 100%. Both assets are returned in proportion to the reserves, and the SOL side comes back as wSOL.",
			"Liquidity actions use a 1% slippage tolerance on the minimum LP tokens minted and the minimum amounts returned. Native SOL is wrapped automatically when the pool needs it.",
		],
	},
	{
		id: "markets",
		title: "Charts and stats",
		body: [
			"The price chart is built from the pool vault's on-chain transaction history. Switch between 1m, 5m, 15m, and 1h candles, and toggle the quote between SOL per MAN and MAN per SOL.",
			"The stats bar shows the mark price, 24-hour change, volume, high and low, pool liquidity, and the current swap fee. Positions shows your LP balance, pool share, and the underlying MAN and SOL value, while History lists your recent pool transactions with Solscan links.",
		],
	},
	{
		id: "wrapping",
		title: "Wrapping SOL",
		body: [
			"Use the Wrap tab on the pool page to convert SOL to wSOL, or unwrap wSOL back to native SOL. One SOL always equals one wSOL.",
			"Unwrapping closes the wSOL token account and returns the full balance as native SOL. You normally do not need this tab — swaps and liquidity actions wrap and unwrap SOL for you.",
		],
	},
	{
		id: "contracts",
		title: "Contracts",
		body: [
			"The pool program, MAN mint, and wSOL mint are deployed on Solana devnet.",
			"Pool program: DwMeAF9UFscahiqeYKr1CmKhEwdp9TBxihGbcK5YqJFm",
			"MAN mint: 9JyKSkrvCcwivA2W12zgNDSAmgpDH6fdfaioCYYBJ3vs",
			"wSOL mint: So11111111111111111111111111111111111111112",
		],
	},
];
