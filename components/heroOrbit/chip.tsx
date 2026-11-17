// components/heroOrbit/chip.tsx
import type { ReactNode } from "react";
import { DUR, ORBIT_ID } from "./orbit";

export default function Chip({
	begin,
	staticAt,
	reduceMotion,
	children,
}: {
	begin: string;
	staticAt: [number, number];
	reduceMotion: boolean;
	children: ReactNode;
}) {
	return (
		<g
			transform={
				reduceMotion ? `translate(${staticAt[0]} ${staticAt[1]})` : undefined
			}
		>
			<circle r={17} className="fill-background stroke-foreground/20" />
			{children}
			{!reduceMotion && (
				<animateMotion dur={`${DUR}s`} begin={begin} repeatCount="indefinite">
					<mpath href={`#${ORBIT_ID}`} />
				</animateMotion>
			)}
		</g>
	);
}