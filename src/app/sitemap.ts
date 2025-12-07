import type { MetadataRoute } from "next";
import { toolMeta } from "@/text/meta";

export default function sitemap(): MetadataRoute.Sitemap {
    const exclude: string[] = [
        "ajl-binoculars",
        "wind",
    ] satisfies (keyof typeof toolMeta)[];
    const urls = Object.keys(toolMeta)
        .filter((key) => !exclude.includes(key))
        .map((key) => ({
            url: `https://e6nlaq.vercel.app/${key}`,
            lastModified: new Date().toISOString(),
        }));
    return urls;
}
