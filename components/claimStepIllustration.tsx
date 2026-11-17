"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export type ClaimStep = "wallet" | "amount" | "confirm";

const SOURCES: Record<ClaimStep, string> = {
	wallet: "/mantis/gif/Wallet",
	amount: "/mantis/gif/Money",
	confirm: "/mantis/gif/Confirm",
};

const TILE =
	"relative flex h-60 items-center justify-center overflow-hidden rounded-lg bg-muted/60";

export default function ClaimStepIllustration({ step }: { step: ClaimStep }) {
	const reduceMotion = !!useReducedMotion();
	const ref = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const v = ref.current;
		if (!v || reduceMotion) return;
		v.muted = true;
		v.play().catch(() => { });
	}, [step, reduceMotion]);

	const src = SOURCES[step];

	return (
		<div className={TILE}>
			<video
				key={step}
				ref={ref}
				className="h-full w-full object-contain"
				autoPlay={!reduceMotion}
				loop
				muted
				playsInline
				preload="auto"
				aria-hidden
			>
				<source src={`${src}.hevc.mp4`} type='video/mp4; codecs="hvc1"' />
				<source src={`${src}.webm`} type="video/webm" />
			</video>
		</div>
	);
}