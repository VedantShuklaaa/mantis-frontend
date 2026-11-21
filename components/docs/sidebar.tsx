// components/docs/sidebar.tsx
"use client";

import { SECTIONS } from "@/lib/ammDocs";

export default function Sidebar() {
	return (
		<aside className="sticky top-24 hidden h-fit w-48 shrink-0 lg:block">
			<p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
				On this page
			</p>
			<ul className="space-y-1.5 border-l border-border">
				{SECTIONS.map((s) => (
					<li key={s.id}>
						<a
							href={`#${s.id}`}
							className="-ml-px block border-l border-transparent pl-3 text-[13px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
						>
							{s.title}
						</a>
					</li>
				))}
			</ul>
		</aside>
	);
}