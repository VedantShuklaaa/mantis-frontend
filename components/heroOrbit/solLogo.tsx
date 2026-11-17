// components/heroOrbit/solLogo.tsx
export default function SolLogo() {
	return (
		<svg
			x={-9}
			y={-7.5}
			width={18}
			height={15}
			viewBox="0 0 24 20"
			className="fill-foreground"
			aria-hidden
		>
			<polygon points="5,0 24,0 19,5 0,5" />
			<polygon points="0,7.5 19,7.5 24,12.5 5,12.5" />
			<polygon points="5,15 24,15 19,20 0,20" />
		</svg>
	);
}