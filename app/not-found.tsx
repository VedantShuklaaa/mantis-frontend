import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Page not found",
	robots: { index: false, follow: false },
};

export default function NotFound() {
	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16 pt-24">
			<p className="text-xs font-medium tabular-nums text-muted-foreground">404</p>
			<h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">
				Page not found
			</h1>
			<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
				The page you are looking for does not exist or has moved.
			</p>
			<Link
				href="/"
				className="mt-6 inline-flex h-9 w-fit items-center rounded-lg border border-border bg-card px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
			>
				Back to Mantis
			</Link>
		</main>
	);
}
