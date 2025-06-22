import type { MetadataRoute } from "next";
import { toolmetas } from "@/text/meta";

export default function sitemap(): MetadataRoute.Sitemap {
	const urls = Object.keys(toolmetas).map((key) => ({
		url: `https://e6nlaq.vercel.app/${key}`,
		lastModified: new Date().toISOString(),
	}));
	return urls;
}
