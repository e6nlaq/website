import type { ToolMeta } from "@/types/toolmeta";

export const toolmetas = {
	"": {
		title: "The Home",
		description: "いろんなツールを公開するよ",
	},
	"ajl-binoculars": {
		title: "AJL Binoculars",
		description: "AJLで相手との差を確認する",
		logo: "/icon/ajl.png",
	},
	wind: {
		title: "wind, hidden",
		description: "?",
	},
} as const satisfies Record<string, ToolMeta>;

export const siteurl = "https://e6nlaq.vercel.app";
