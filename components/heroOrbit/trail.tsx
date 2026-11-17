// components/heroOrbit/trail.tsx
import { DUR, PATH, SAGE } from "./orbit";

export default function Trail({ begin }: { begin: string }) {
	return (
		<path
			d={PATH}
			fill="none"
			stroke={SAGE}
			strokeWidth={2}
			strokeLinecap="round"
			pathLength={100}
			strokeDasharray="16 84"
		>
			<animate
				attributeName="stroke-dashoffset"
				from="16"
				to="-84"
				dur={`${DUR}s`}
				begin={begin}
				repeatCount="indefinite"
			/>
		</path>
	);
}