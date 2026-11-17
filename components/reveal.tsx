"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* Fades and lifts its children into view the first time they're scrolled to. */
export default function Reveal({
	children,
	delay = 0,
	className,
	amount = 0.4,
}: {
	children: ReactNode;
	delay?: number;
	className?: string;
	amount?: number;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			initial={reduceMotion ? false : { opacity: 0, y: 18 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount }}
			transition={{ duration: 0.65, ease: EASE_OUT, delay }}
		>
			{children}
		</motion.div>
	);
}
