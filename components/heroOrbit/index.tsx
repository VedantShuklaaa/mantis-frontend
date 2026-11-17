// components/heroOrbit/index.tsx
"use client";

import { motion, useReducedMotion } from "motion/react";
import { BASE_PATH } from "@/lib/site";
import Chip from "./chip";
import { DUR, END, ORBIT_ID, PATH, SAGE, START } from "./orbit";
import SolLogo from "./solLogo";
import Trail from "./trail";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroOrbit({ className = "" }: { className?: string }) {
	const reduceMotion = !!useReducedMotion();
	const half = `-${DUR / 2}s`;

	const fade = (delay: number) => ({
		initial: reduceMotion ? false : { opacity: 0 },
		animate: { opacity: 1 },
		transition: { duration: 0.7, delay, ease: EASE },
	});

	return (
		<svg
			viewBox="0 0 680 340"
			aria-hidden
			className={`pointer-events-none w-full select-none opacity-70 ${className}`}
		>
			<defs>
				<path id={ORBIT_ID} d={PATH} />
			</defs>

			<motion.g {...fade(0.3)}>
				<use
					href={`#${ORBIT_ID}`}
					fill="none"
					className="stroke-foreground/20"
					strokeWidth={0.75}
					strokeDasharray="2 5"
				/>
			</motion.g>

			{!reduceMotion && (
				<motion.path
					d={PATH}
					fill="none"
					stroke={SAGE}
					strokeWidth={1.5}
					strokeLinecap="round"
					initial={{ pathLength: 0, opacity: 1 }}
					animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
					transition={{ duration: 1.8, times: [0, 0.7, 1], ease: "easeInOut" }}
				/>
			)}

			<motion.g
				initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
				style={{ transformOrigin: "340px 170px" }}
			>
				{!reduceMotion && (
					<circle cx={340} cy={170} r={26} fill="none" stroke={SAGE} strokeWidth={1.5}>
						<animate attributeName="r" values="26;54" dur="2.8s" repeatCount="indefinite" />
						<animate attributeName="opacity" values="0.4;0" dur="2.8s" repeatCount="indefinite" />
					</circle>
				)}
				<circle cx={340} cy={170} r={26} className="fill-background stroke-foreground/20" />
				<circle cx={340} cy={170} r={6} fill={SAGE} />
			</motion.g>

			{!reduceMotion && (
				<motion.g {...fade(1.3)}>
					<Trail begin="0s" />
					<Trail begin={half} />
				</motion.g>
			)}

			<motion.g {...fade(1.0)}>
				<Chip begin="0s" staticAt={START} reduceMotion={reduceMotion}>
					<image href={`${BASE_PATH}/man2.svg`} x={-10} y={-10} width={20} height={20} />
				</Chip>
				<Chip begin={half} staticAt={END} reduceMotion={reduceMotion}>
					<SolLogo />
				</Chip>
			</motion.g>
		</svg>
	);
}