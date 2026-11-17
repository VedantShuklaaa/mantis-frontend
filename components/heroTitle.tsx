"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const BUTTON_BASE =
	"group inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium leading-none outline-none transition-[background-color,color,border-color,transform] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] motion-reduce:transition-none";

/*
 * The arrow slot has zero width at rest. Hover/focus opens it to the right,
 * so the button grows on its right edge instead of shifting its label.
 */
const ARROW_SLOT =
	"grid w-0 shrink-0 place-items-center overflow-hidden opacity-0 transition-[width,margin,opacity] duration-300 ease-out group-hover:ml-2 group-hover:w-4 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:w-4 group-focus-visible:opacity-100 motion-reduce:transition-none";

/* Appears pointing right, then pivots to top-right after a short beat. */
const ARROW =
	"size-4 shrink-0 delay-150 transition-transform duration-200 ease-out group-hover:-rotate-45 group-focus-visible:-rotate-45 motion-reduce:transition-none";

const TONES = {
	primary:
		"bg-foreground text-background hover:bg-foreground/90 focus-visible:outline-foreground/50",
	accent:
		"border border-primary/35 bg-primary/[0.06] text-primary hover:border-primary/55 hover:bg-primary/[0.11] focus-visible:outline-primary/50",
} as const;

function HeroAction({
	href,
	label,
	tone,
	delay,
	reduceMotion,
}: {
	href: string;
	label: string;
	tone: keyof typeof TONES;
	delay: number;
	reduceMotion: boolean;
}) {
	return (
		<motion.div
			initial={reduceMotion ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: EASE_OUT, delay }}
		>
			<Link href={href} className={`${BUTTON_BASE} ${TONES[tone]}`}>
				{label}
				<span aria-hidden className={ARROW_SLOT}>
					<ArrowRight className={ARROW} strokeWidth={1.75} />
				</span>
			</Link>
		</motion.div>
	);
}

export default function HeroTitle() {
	const reduceMotion = useReducedMotion();

	return (
		<div className="flex flex-col">
			<motion.p
				className="text-xl font-medium uppercase leading-none tracking-[0.02em] text-foreground sm:text-2xl"
				initial={reduceMotion ? false : { opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.05 }}
			>
				devnet
			</motion.p>

			{/* Mask line: the word rises out of the overflow clip on load. */}
			<span className="mt-3 block overflow-hidden">
				<motion.span
					className="block text-[clamp(3.5rem,20vw,15rem)] font-black leading-[0.78] tracking-[-0.045em] text-foreground"
					initial={reduceMotion ? false : { y: "108%" }}
					animate={{ y: "0%" }}
					transition={{ duration: 1, ease: EASE_OUT, delay: 0.12 }}
				>
					MANTIS
				</motion.span>
			</span>

			<div className="mt-7 flex flex-wrap items-center gap-2.5 justify-end">
				<HeroAction
					href="/faucet"
					label="Faucet"
					tone="primary"
					delay={0.62}
					reduceMotion={!!reduceMotion}
				/>
				<HeroAction
					href="/amm"
					label="Pool"
					tone="accent"
					delay={0.7}
					reduceMotion={!!reduceMotion}
				/>
			</div>
		</div>
	);
}
