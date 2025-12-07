import type { Metadata } from "next";
import { siteUrl } from "@/text/meta";
import type { ToolMeta } from "@/types/meta";

export function convertMetadata(meta: ToolMeta): Metadata {
    const icon = meta.logo ?? "/favicon.svg";
    const twitterIcon = icon === "/favicon.svg" ? "/favicon.png" : icon;
    return {
        title: meta.title,
        description: meta.description,
        icons: icon,
        keywords: meta.keywords,
        twitter: {
            title: meta.title,
            description: meta.description,
            card: "summary",
            site: "ru_milmil",
            images: `${siteUrl}${twitterIcon}`,
        },
        openGraph: {
            type: "website",
            title: meta.title,
            description: meta.description,
            images: `${siteUrl}${twitterIcon}`,
        },
        robots: {
            index: meta.index ?? true,
        },
    };
}
