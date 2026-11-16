import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return [
		{
			url: absoluteUrl(""),
			lastModified,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: absoluteUrl("/faucet"),
			lastModified,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: absoluteUrl("/amm"),
			lastModified,
			changeFrequency: "monthly",
			priority: 0.6,
		},
	];
}
