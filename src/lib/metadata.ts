import type { Metadata } from "next";
import { isOgImageTarget, ogImageUrl } from "@/lib/og";
import { siteUrl } from "@/text/meta";
import type { ToolMeta } from "@/types/meta";

export function convertMetadata(meta: ToolMeta, key?: string): Metadata {
  const icon = meta.logo ?? "/favicon.svg";
  const twitterIcon = icon === "/favicon.svg" ? "/favicon.png" : icon;
  const title =
    meta.title + (meta.title !== "e6nlaq's Lab" ? " - e6nlaq's Lab" : "");
  const ogImage = key && isOgImageTarget(key) ? ogImageUrl(key) : null;
  return {
    title,
    description: meta.description,
    icons: icon,
    keywords: meta.keywords,
    twitter: {
      title: meta.title,
      description: meta.description,
      card: ogImage ? ("summary_large_image" as const) : ("summary" as const),
      site: "ru_milmil",
      images: ogImage ?? `${siteUrl}${twitterIcon}`,
    },
    openGraph: {
      type: "website",
      title: meta.title,
      description: meta.description,
      images: ogImage ?? `${siteUrl}${twitterIcon}`,
    },
    robots: {
      index: meta.index ?? true,
    },
  };
}
