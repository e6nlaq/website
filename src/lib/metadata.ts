import type { Metadata } from "next";
import { siteurl } from "@/text/meta";
import type { ToolMeta } from "@/types/toolmeta";

export function convertMetadata(meta: ToolMeta): Metadata {
	const icon = meta.logo ?? "/favicon.svg";
	const twicon = icon === "/favicon.svg" ? "/favicon.png" : icon;
	return {
		title: meta.title,
		description: meta.description,
		icons: icon,
		twitter: {
			title: meta.title,
			description: meta.description,
			card: "summary",
			site: "ru_milmil",
			images: `${siteurl}${twicon}`,
		},
		openGraph: {
			type: "website",
			title: meta.title,
			description: meta.description,
			images: `${siteurl}${twicon}`,
		},
		robots: {
			index: meta.index ?? true,
		},
	};
}
