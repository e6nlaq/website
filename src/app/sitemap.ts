import type { MetadataRoute } from "next";
import { toolMeta } from "@/text/meta";

export default function sitemap(): MetadataRoute.Sitemap {
    const urls = Object.keys(toolMeta).map((key) => ({
        url: `https://e6nlaq.vercel.app/${key}`,
        lastModified: new Date().toISOString(),
    }));
    return urls;
}
