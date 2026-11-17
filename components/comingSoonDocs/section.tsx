// components/comingSoonDocs/section.tsx
"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function Section({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<motion.section
			id={id}
			className="scroll-mt-24"
			initial={{ opacity: 0, y: 12 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.3 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
		>
			<h2 className="mb-3 text-lg font-medium tracking-tight text-foreground">
				{title}
			</h2>
			<div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
				{children}
			</div>
		</motion.section>
	);
}