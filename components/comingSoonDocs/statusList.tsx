// components/comingSoonDocs/statusList.tsx
import { STATUS, STATUS_LABEL } from "@/lib/ammDocs";

export default function StatusList() {
	return (
		<ul className="divide-y divide-border rounded-lg border border-border">
			{STATUS.map((item) => (
				<li
					key={item.label}
					className="flex items-center justify-between px-4 py-3"
				>
					<span className="text-sm text-foreground">{item.label}</span>
					<span
						className={`rounded-full border px-2 py-0.5 text-[11px] ${item.status === "live"
								? "border-foreground bg-foreground text-background"
								: "border-border text-muted-foreground"
							}`}
					>
						{STATUS_LABEL[item.status]}
					</span>
				</li>
			))}
		</ul>
	);
}